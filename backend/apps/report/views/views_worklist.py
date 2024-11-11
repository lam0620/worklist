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

class OrderFilter(filters.FilterSet):
    # For search range date (created_at_after, created_at_before)
    # /orders?created_at_after=2024-10-20 00:00&created_at_before=2024-10-21 23:59
    created_at = filters.DateTimeFromToRangeFilter()
    # Search like '%xxxx'
    patient_name = filters.CharFilter(field_name='patient__fullname', lookup_expr='endswith')
    patient_pid = filters.CharFilter(field_name='patient__pid')
    # accession_no = filters.CharFilter(field_name='accession_no')

    class Meta:
        model = Order
        fields = ['accession_no', 'patient_name', 'patient_pid','created_at']

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
        # query_serializer= ser.GetOrderSerializers,
        tags=[swagger_tags.REPORT_ORDER],
    )
    def get(self, request, *args, **kwargs):
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_ORDER)

        procedure_prefetch = Prefetch(
            'procedure_set',
            queryset=Procedure.objects.select_related('procedure_type'),
            to_attr='procedure_list'
        )

        # Search by accession
        try:
            queryset = self.filter_queryset(Order.objects.prefetch_related(procedure_prefetch))
        
        except Order.DoesNotExist:
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
            list_accession_no = [order.accession_no for order in queryset]
            # Get pacsdb.study by accession_no
            with connections["pacs_db"].cursor() as cursor:
                sql = """select s.accession_no, s.study_iuid, s.created_time, sqa.num_series, sqa.num_instances,study_desc 
                            from study s 
                            left join study_query_attrs sqa on s.pk =sqa.study_fk 
                            where s.accession_no in %s"""
                
                cursor.execute(sql,[tuple(list_accession_no)])
                results = cursor.fetchall()

                # Convert Django's fetchall() result into a Pandas DataFrame
                column_names = [desc[0] for desc in cursor.description]
                df_study = pd.DataFrame(results, columns = column_names)

        except Exception as e:
            # No raise exception here
            logger.warning(e, exc_info=True)

        # Convert queryset to json, merge df_study to and to json
        orders_data = self._merge_n2_json(queryset, df_study)
  
        page = self.paginate_queryset(orders_data)
        return self.get_paginated_response(page)
    

    def _merge_n2_json(self, queryset, df_study):
        orders_json = []

        # First, convert queryset to json to be able to get procedure data
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
        df_merged = pd.concat([df_merged, df_duplciate_order]).replace([np.nan, -np.inf], '')
        
        # Format datetime to sort
        df_merged['created_time'] = pd.to_datetime(df_merged['created_time'], format='%d/%m/%Y %H:%M')
        #print(df_merged.dtypes)
        # Sort latest created_time first
        df_merged = df_merged.sort_values(by=['created_time'], ascending = False)

        #print(df_merged)
        # Convert dataframe to json to add to response
        return df_merged.to_dict(orient = 'records')        

    # """
    # Get list of worklist
    # """
    # @swagger_auto_schema(
    #     operation_summary='Get worklists',
    #     operation_description='Get worklists',
    #     # query_serializer= ser.GetOrderSerializers,
    #     tags=[swagger_tags.REPORT_ORDER],
    # )
    # def get1(self, request, *args, **kwargs):
    #     # Get and check version to secure or not
    #     if request.META.get('HTTP_X_API_VERSION') != "X":  
    #         user = request.user
    #         is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
    #         if not is_per and not user.is_superuser:
    #             return self.cus_response_403(per_code.VIEW_ORDER)

    #     procedure_prefetch = Prefetch(
    #         'procedure_set',
    #         queryset=Procedure.objects.select_related('procedure_type'),
    #         to_attr='procedure_list'
    #     )

    #     # Search by accession
    #     try:
    #         queryset = self.filter_queryset(Order.objects.prefetch_related(procedure_prefetch))
        
    #     except Order.DoesNotExist:
    #         return self.cus_response_empty_data()
    
    #     data= {}

    #     # Convert Django's Queryset into a Pandas DataFrame
    #     df_order_dataframe = pd.DataFrame.from_records(queryset.values())
    #     df_study = pd.DataFrame({'accession_no':[]}) # Empty dataframe

    #     # try:
    #     #     list_accession_no = [order.accession_no for order in queryset]
    #     #     # Get pacsdb.study by accession_no
    #     #     with connections["pacs_db"].cursor() as cursor:
    #     #         sql = """select s.accession_no, s.study_iuid , s.created_time, sqa.num_series, sqa.num_instances,study_desc 
    #     #                     from study s 
    #     #                     left join study_query_attrs sqa on s.pk =sqa.study_fk 
    #     #                     where s.accession_no in %s"""
    #     #         cursor.execute(sql,[tuple(list_accession_no)])
    #     #         results = cursor.fetchall()

    #     #         # Convert Django's fetchall() result into a Pandas DataFrame
    #     #         column_names = [desc[0] for desc in cursor.description]
    #     #         study_dataframe = pd.DataFrame(results, columns = column_names)


    #     # except Exception as e:
    #     #     logger.warning(e, exc_info=True)

    #     # Merge study_dataframe to order_dataframe
    #     df_merged = order_dataframe.merge(study_dataframe, how='left')

        
    #     #orders_data = [self.get_pure_order_json(order) for order in queryset]
    #     orders_data = df_merged.to_dict(orient = 'records')

  
    #     page = self.paginate_queryset(orders_data)
    #     return self.get_paginated_response(page)
    

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

            'study_iuid':proc.study_iuid,
            'status':proc.status
                
        } for proc in order.procedure_list]        

        return order_data
    

