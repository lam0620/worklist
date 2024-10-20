import logging

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

from apps.report.utils import  get_image_field_str,get_username

logger = logging.getLogger(__name__)

"""
Order class
"""
class OrderView(OrderBaseView):
    queryset = User.objects.all()
    # Call overwrite here to skip authenticate or don't call request.user
    # uncomment if no need to check permission 
    # authentication_classes = ()
    
    # for search box (?search=xxx). which you want to search. 
    search_fields = ['accession_no', 'patient__fullname']
    # for query string (?type=xxx)
    #filter_fields = ['type', 'user_id', 'is_active']

    """
    Get list of order
    """
    @swagger_auto_schema(
        operation_summary='Get orders',
        operation_description='Get orders',
        query_serializer= ser.GetOrderSerializers,
        tags=[swagger_tags.REPORT_ORDER],
    )
    def get(self, request, *args, **kwargs):
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_ORDER)

        # Get modality from query params: /?accession=XX   
        accession=request.query_params.get('accession')
        # if accession =='':
        #     return self.response_item_NG(ec.SYSTEM_ERR, 'accession', "Accession number is empty")
    
        procedure_prefetch = Prefetch(
            'procedure_set',
            queryset=Procedure.objects.select_related('procedure_type'),
            to_attr='procedure_list'
        )

        # Search by accession
        try:
            if accession:
                queryset = self.filter_queryset(Order.objects.prefetch_related(procedure_prefetch).filter(accession_no=accession, delete_flag=False))
            else:
                queryset = self.filter_queryset(Order.objects.prefetch_related(procedure_prefetch))
        
        except Order.DoesNotExist:
            return self.cus_response_empty_data(ec.REPORT)
        
        orders_data = [self.get_pure_order_json(order) for order in queryset]

        if accession:
            if len(orders_data) > 1:
                return self.response_NG(ec.SYSTEM_ERR, "Return value is more than one record. Data is incorrect!")
            elif len(orders_data) == 0:
                return self.cus_response_empty_data(ec.REPORT)
            else:
                return self.response_success(data=orders_data[0])
        else:    
            page = self.paginate_queryset(orders_data)
            return self.get_paginated_response(page)
   
class OrderDetail(OrderBaseView):
    queryset = User.objects.all()
    # uncomment if no need to check permission 
    # authentication_classes = ()

    """
    Get a report
    kwargs = study_iuid
    """
    @swagger_auto_schema(
        operation_summary='Get Detail Order by Id',
        operation_description='Get Detail Order by Id',
        tags=[swagger_tags.REPORT_ORDER],
    )
    def get(self, request, *args, **kwargs):
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_ORDER)
                    
        # Get latest report        
        return self.get_order_by_id(request, kwargs['pk'])
    
# class OrderByACNView(ReportBaseView):
#     queryset = User.objects.all()
#     # uncomment if no need to check permission 
#     # authentication_classes = ()

#     """
#     Get list of order
#     """
#     @swagger_auto_schema(
#         operation_summary='Order Detail by AccessionNumber',
#         operation_description='Order Detail by AccessionNumber',
#         tags=[swagger_tags.REPORT_ORDER],
#     )
#     def get(self, request, *args, **kwargs):
#         # Get and check version to secure or not
#         if request.META.get('HTTP_X_API_VERSION') != "X":  
#             user = request.user
#             is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
#             if not is_per and not user.is_superuser:
#                 return self.cus_response_403(per_code.VIEW_ORDER)

#         # procedure and procedure_type queries
#         procedure_prefetch = Prefetch(
#             'procedure_set',
#             queryset=Procedure.objects.select_related('procedure_type'),
#             to_attr='procedure_list'
#         )

#         try:
#             order = Order.objects.prefetch_related(procedure_prefetch).get(**kwargs, delete_flag=False)
#         except Order.DoesNotExist:
#             return self.cus_response_empty_data(ec.REPORT)
        
#         except Exception as e:
#             logger.error(e, exc_info=True)
#             return self.response_NG(ec.SYSTEM_ERR, str(e))
        
#         order_data = {
#             'accession_no': order.accession_no,
#             'req_phys_code': order.referring_phys.doctor_no,
#             'req_phys_name': order.referring_phys.fullname,
#             'clinical_diagnosis': order.clinical_diagnosis,
#             'order_time': order.order_time,
#             'modality_type': order.modality_type,
#             'is_insurance_applied': order.is_insurance_applied,
#             'patient': {
#                 'pid':order.patient.pid,
#                 'fullname':order.patient.fullname,
#                 'gender':order.patient.gender,
#                 'dob':order.patient.dob,
#                 'tel':order.patient.tel,
#                 'address':order.patient.address,
#                 'insurance_no':order.patient.insurance_no
#             },
#             'procedures': [{'proc_id': proc.id,
#                             'study_iuid':proc.study_iuid,
#                             'code': proc.procedure_type.code, 
#                             'name': proc.procedure_type.name,
#                             'report':self.get_order_report_json(proc.id)} for proc in order.procedure_list]
#         }
#         return self.response_success(data=order_data)
