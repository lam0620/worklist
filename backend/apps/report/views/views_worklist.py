import logging
import pandas as pd
import numpy as np

from django_filters import rest_framework as filters
from django.db import transaction,connections
from drf_yasg.utils import swagger_auto_schema

from django.db.models import F, Prefetch

from rest_framework.decorators import parser_classes

from library.constant import error_codes as ec
from library.constant import module_code as module_code
from library.constant import permission_code as per_code
from library.constant import swagger_tags

from apps.account.permission import CheckPermission

from apps.report.order_base_view import OrderBaseView
from apps.report import serializers as ser
from apps.report.models import (
    User, Order,Procedure
)

from apps.report.utils import  get_image_field_str

logger = logging.getLogger(__name__)

import django_filters
import operator
from django.db.models import Q
from functools import reduce

class ListFilterField(django_filters.Filter):
    ''' This is a custom FilterField to enable a behavior like:
    ?log=taco,sandwich,burrito,ramen ...
    '''
    def filter(self, queryset, value):
        # If no value is passed, just return the initial queryset
        if not value:
            return queryset
        list_values = value.split(',') # Split the incoming query string by comma
        # Return a queryset filtered for every value in the list like 'taco OR burrito OR...'
        # Change operator.or_ to operator._and to apply all filters like 'taco AND burrito AND...'
        #return queryset.filter(reduce(operator.or_, (Q(**{f'{self.field_name}__contains':x.strip()}) for x in list_values)))
        return queryset.filter(reduce(operator.or_, (Q(**{f'{self.field_name}__iexact':x.strip()}) for x in list_values)))
    
class OrderFilter(filters.FilterSet):
    # For search range date (created_at_after, created_at_before)
    # /orders?created_at_after=2024-10-20 00:00&created_at_before=2024-10-21 23:59
    created_at = filters.DateTimeFromToRangeFilter()
    # Search like '%xxxx'
    patient_name = filters.CharFilter(field_name='patient__fullname', lookup_expr='endswith')
    patient_pid = filters.CharFilter(field_name='patient__pid')
    # accession_no = filters.CharFilter(field_name='accession_no')

    modality_type = ListFilterField(field_name='modality_type')

    class Meta:
        model = Order
        fields = ['accession_no','patient_name','modality_type','patient_pid','created_at']

"""
Order class
"""
class WorklistView(OrderBaseView):
    queryset = Order.objects.all()
    # Call overwrite here to skip authenticate or don't call request.user
    # uncomment if no need to check permission 
    # authentication_classes = ()
    
    # for search box (?search=xxx). which you want to search. 
    search_fields = ['accession_no', 'patient__fullname', 'patient__pid']

    # for query string (?type=xxx)
    # View attributes renamed: filter_fields => filterset_fields
    # https://django-filter.readthedocs.io/en/stable/guide/migration.html
    #filterset_fields = ['accession_no', 'patient__fullname', 'patient__pid','created_at']
    filterset_class = OrderFilter


    """
    Get list of worklist
    """
    @swagger_auto_schema(
        operation_summary='Get worklists',
        operation_description='Get worklists',
        tags=[swagger_tags.REPORT_ORDER],
    )
    def get(self, request, *args, **kwargs):
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_ORDER)

        # SC, IP, CM, IM
        status=request.query_params.get('status')
        list_accession_no = [] # for query in pacs.study
        queryset = None

        # If status is passed in query_params, search in the Procedure
        if status:
            list_status = status.split(',')
            # Search in procedure first
            queryset = Procedure.objects.filter(status__in=list_status)

            if not queryset.exists():
                return self.cus_response_empty_data()
        
            # Get order id from procedure
            order_ids = [proc.order.id for proc in queryset]

            procedure_prefetch = Prefetch(
                'procedure_set',
                queryset=Procedure.objects.select_related('procedure_type'),
                to_attr='procedure_list'
            )
            # Search based on filter and order_ids (call filter() have to be before prefetch_related)
            queryset = self.filter_queryset(Order.objects.filter(pk__in=order_ids).prefetch_related(procedure_prefetch))            
            
         
        else:    
            procedure_prefetch = Prefetch(
                'procedure_set',
                queryset=Procedure.objects.select_related('procedure_type'),
                to_attr='procedure_list'
            )
            queryset = self.filter_queryset(Order.objects.prefetch_related(procedure_prefetch))


        if not queryset.exists():
            return self.cus_response_empty_data()

        data= {}
        # Init a Empty dataframe
        df_study = pd.DataFrame({'accession_no':[],
                                 'study_iuid':[],
                                 'study_time':[],
                                 'num_series':[],
                                 'num_instances':[]}) 
        
        # test dataframe
        # df_study = pd.DataFrame({'accession_no':['202411102','202411101'],
        #                         'study_time':['10/11/2024 13:59','10/11/2024 13:58']})

        # Get study data from pacs database
        try:
            # if status:
            #     list_accession_no = [proc.order.accession_no for proc in queryset]
            # else:
            list_accession_no = [order.accession_no for order in queryset]
                
            # Get pacsdb.study by accession_no
            with connections["pacs_db"].cursor() as cursor:
                sql = """select s.accession_no, s.study_iuid, s.created_time as study_created_time, sqa.num_series, sqa.num_instances,study_desc 
                            from study s 
                            left join study_query_attrs sqa on s.pk =sqa.study_fk 
                            where s.accession_no in %s and spa.mods_in_study is not null
                        """
                
                cursor.execute(sql,[tuple(list_accession_no)])
                results = cursor.fetchall()

                # Convert Django's fetchall() result into a Pandas DataFrame
                column_names = [desc[0] for desc in cursor.description]
                df_study = pd.DataFrame(results, columns = column_names)

        except Exception as e:
            # No raise exception here
            logger.warning(e, exc_info=True)

        # Convert queryset to json, merge df_study to df_merged
        df_merged = self._merge_df(queryset, df_study, status)

        # Search status = SC or IM in df. Do this because the status in procedure table is not latest data
        if status and (status == 'SC' or status == 'IM'):
            df_merged = df_merged[df_merged['proc_status'] == status]

        # Convert to json to response
        orders_data = df_merged.to_dict(orient = 'records')    
  
        page = self.paginate_queryset(orders_data)
        return self.get_paginated_response(page)
    

    def _merge_df(self, queryset, df_study, status):
        orders_json = []

        # First, convert queryset to json to be able to get procedure data
        # if status:
        #     orders_json = self._get_worklist_json_1level(queryset)
        # else:
        for order in queryset:
            for worklist in self._get_worklist_json(order):
                orders_json.append(worklist)

      
        # Convert json to dataframe
        df_order = pd.DataFrame.from_records(orders_json)

        # Don't merge study to orders if there are duplciated accession_no in orders
        # Because we don't know which study match with which order??
        
        # Get rows duplicate accession_no
        df_duplciate_order=df_order[df_order.duplicated(subset=['accession_no'],keep=False)]
        # Get new df by removing duplicated rows
        df_new_order = df_order.drop_duplicates(subset=['accession_no'], keep=False) 

        # Merge df_study to df_new_order
        df_merged = df_new_order.merge(df_study, how='left', on='accession_no')

        # Add df_duplciate_order to df_merged and replace NaN to ''
        df_merged = pd.concat([df_merged, df_duplciate_order])#.replace([np.nan, -np.inf, pd.NaT], '')
        #print(df_merged['study_created_time'])
        # Format datetime to sort
        df_merged['created_time'] = pd.to_datetime(df_merged['created_time'], format='%d/%m/%Y %H:%M',errors='coerce')
       
        #print(df_merged.dtypes)
        # Sort latest created_time first
        df_merged = df_merged.sort_values(by=['created_time'], ascending = False)

       
        # change the datetime format
        df_merged['created_time'] = df_merged['created_time'].dt.strftime('%d/%m/%Y %H:%M')

        # study_created_time is got from pacs.study
        if 'study_created_time' in df_merged.columns :
            df_merged['study_created_time'] = pd.to_datetime(df_merged['study_created_time'], format='%d/%m/%Y %H:%M',errors='coerce')
            df_merged['study_created_time'] = df_merged['study_created_time'].dt.strftime('%d/%m/%Y %H:%M')
        else:
            df_merged['study_created_time'] = ''

        # Applying the condition to update status = 'IM' if current = SC and exists study_iuid
        df_merged["proc_status"] = np.where((df_merged["proc_status"] == 'SC') & (df_merged["study_iuid"].isnull() == False), 'IM', df_merged["proc_status"])

        # Add df_duplciate_order to df_merged and replace NaN to ''
        return df_merged.replace([np.nan, -np.inf, pd.NaT], '')


    def _get_worklist_json(self, order):
        order_data = [{
            'id': order.id,
            'accession_no': order.accession_no,
            'referring_phys_code': order.referring_phys.doctor_no,
            'referring_phys_name': order.referring_phys.fullname,
            'clinical_diagnosis': order.clinical_diagnosis,
            # 'order_time': order.order_time,
            'created_time':order.created_at.strftime('%d/%m/%Y %H:%M'),
            'modality_type': order.modality_type,
            
            'pat_pid':order.patient.pid,
            'pat_fullname':order.patient.fullname,
            'pat_gender':order.patient.gender,
            'pat_dob':order.patient.dob,
            'pat_tel':order.patient.tel,
            'pat_address':order.patient.address,
            'pat_insurance_no':order.patient.insurance_no,

            'proc_id': proc.id,
            'proc_code': proc.procedure_type.code, 
            'proc_name': proc.procedure_type.name,

            'proc_study_iuid':proc.study_iuid,
            'proc_status':proc.status
                
        } for proc in order.procedure_list]        

        return order_data

    def _get_worklist_json_1level(self, queryset):
        """
        queryset is list of the procedure
        """
        order_data = [{
            'id': proc.id,
            'accession_no': proc.order.accession_no,
            'referring_phys_code': proc.order.referring_phys.doctor_no,
            'referring_phys_name': proc.order.referring_phys.fullname,
            'clinical_diagnosis': proc.order.clinical_diagnosis,
            # 'proc_time': proc.proc_time,
            'created_time':proc.order.created_at.strftime('%d/%m/%Y %H:%M'),
            'modality_type': proc.order.modality_type,
            
            'pat_pid':proc.order.patient.pid,
            'pat_fullname':proc.order.patient.fullname,
            'pat_gender':proc.order.patient.gender,
            'pat_dob':proc.order.patient.dob,
            'pat_tel':proc.order.patient.tel,
            'pat_address':proc.order.patient.address,
            'pat_insurance_no':proc.order.patient.insurance_no,

            'proc_id': proc.id,
            'proc_code': proc.procedure_type.code, 
            'proc_name': proc.procedure_type.name,

            'proc_study_iuid':proc.study_iuid,
            'proc_status':proc.status
                
        } for proc in queryset]        

        return order_data   

    def log_queryset(self, queryset):
        orders_json = []

        # First, convert queryset to json to be able to get procedure data
        for order in queryset:
            for worklist in self._get_worklist_json(order):
                orders_json.append(worklist)      

        logger.info(orders_json)  

