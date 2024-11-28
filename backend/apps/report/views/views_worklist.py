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

from apps.report.worklist_base_view import WorklistBaseView
from apps.report import serializers as ser
from apps.report.models import (
    Report, User, Order,Procedure
)


from third_parties.contribution.api_view import CustomAPIView

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
Worklist class
"""
class WorklistView(WorklistBaseView):
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
        tags=[swagger_tags.WORKLIST],
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

        logger.info("Total rows worklist are: %s", len(queryset))

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
            list_accession_no = [order.accession_no for order in queryset]
                
            logger.info('Query pacs.study by accession_no: %s', list_accession_no)

            # Get pacsdb.study by accession_no
            with connections["pacs_db"].cursor() as cursor:
                # 1 study has many study_query_attrs, so add distinct
                sql = """select distinct s.accession_no, s.study_iuid, s.created_time as study_created_time, sqa.num_series, sqa.num_instances,study_desc 
                            from study s 
                            left join study_query_attrs sqa on s.pk =sqa.study_fk 
                            where s.accession_no in %s and sqa.mods_in_study is not null
                        """
                
                cursor.execute(sql,[tuple(list_accession_no)])
                results = cursor.fetchall()
                logger.info("Total rows of pacs.study are:  %s", len(results))

                # Convert Django's fetchall() result into a Pandas DataFrame
                column_names = [desc[0] for desc in cursor.description]
                df_study = pd.DataFrame(results, columns = column_names)

        except Exception as e:
            # No raise exception here
            logger.warning(e, exc_info=True)

        # Convert queryset to json, merge df_study to df_merged
        df_merged = self._merge_df(queryset, df_study)
        #logger.debug('Number of rows after merging df_study: %s', len(df_merged))

        # Search status = SC or IM in df. Do this because the status in procedure table is not latest data
        # if status and (status == 'SC' or status == 'IM'):
        #     df_merged = df_merged[df_merged['proc_status'] == status]
        
        if status:
            list_status = status.split(',')
            
            # Filter status in list
            df_merged = df_merged[df_merged['proc_status'].isin(list_status)]

        # Convert to json to response
        orders_data = df_merged.to_dict(orient = 'records')    
  
        page = self.paginate_queryset(orders_data)
        return self.get_paginated_response(page)
    

"""
Worklist class
"""
class NewWorklistView(WorklistBaseView):
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
        tags=[swagger_tags.WORKLIST],
    )
    def get(self, request, *args, **kwargs):
        """
        Get list of worklist
        - Search orders
        - Search pacs.study
        - Merge
        """
                
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_ORDER)

        # Search including studies that no order yet
        is_include_no_order =request.query_params.get('is_include_no_order')
        logger.info('Search by is_include_no_order?: %s', is_include_no_order)

        if not is_include_no_order or is_include_no_order == '0':            
            df_merged = self._get_worklists(request)
        else:
            df_merged = self._get_include_no_order(request)

        if len(df_merged) == 0:
            return self.cus_response_empty_data()
        
        # Convert to json to response
        orders_data = df_merged.to_dict(orient = 'records')    
  
        page = self.paginate_queryset(orders_data)
        return self.get_paginated_response(page)
    


class WorklistByProcedureId(WorklistBaseView):
    #queryset = User.objects.all()
    #authentication_classes = ()

    """
    Get a report
    kwargs = accession_no and procedure_code
    """
    @swagger_auto_schema(
        operation_summary='Worklist Detail By Procdure Id',
        operation_description='Worklist Detail By Procdure Id',
        tags=[swagger_tags.WORKLIST],
    )
    def get(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_REPORT)

        return self._get_worklist_by_procid(pk = kwargs['pk'])
   

