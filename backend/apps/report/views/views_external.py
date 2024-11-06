import json
import logging

from django.utils import timezone

from django.db import transaction,connections
from drf_yasg.utils import swagger_auto_schema

from third_parties.contribution.api_view import CustomAPIView
from django.db.models import F, Prefetch
from drf_yasg import openapi

from library.constant import error_codes as ec
from library.constant import module_code as module_code
from library.constant import permission_code as per_code
from library.constant import swagger_tags

from apps.report import serializers as ser
from apps.report.report_base_view import ReportBaseView
from apps.report.order_base_view import OrderBaseView
from apps.report.models import (
    Doctor, Report, User, 
    Order,Patient,Procedure,ProcedureType
)
from apps.account.permission import CheckPermission
from apps.report.utils import  get_image_link

logger = logging.getLogger(__name__)


"""
HIS PACS integration class
"""

class External_OrderView(OrderBaseView):
    queryset = User.objects.all()
    authentication_classes = ()
 
    """
    Create new an order - For HIS(1)
    """
    @swagger_auto_schema(
        operation_summary='Create new an order',
        operation_description='Create new an order',
        request_body=ser.CreateOrderSerializers,
        tags=[swagger_tags.REPORT_HIS],
        manual_parameters=[
            openapi.Parameter('x-auth-key', openapi.IN_HEADER, 
                              description="Custom Header",
                              type=openapi.TYPE_STRING),
        ],
    )
    def post(self, request):
        # Get and check external app. Headers: x-auth-key
        if request.META.get('HTTP_X_AUTH_KEY'):
            user = self.check_integration_token(request.META.get('HTTP_X_AUTH_KEY'))
        else:
            user = request.user

        logger.info("[HIS] Order data: %s",json.dumps(request.data))

        has_permission = CheckPermission(per_code.ADD_ORDER, user.id).check()
        if not has_permission and not user.is_superuser:
            return self.cus_response_403(per_code.ADD_ORDER)   

        serializer = ser.CreateOrderSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            with transaction.atomic():
                procedures = data['procedures']
                procs_list = []
                for item in procedures:
                    # ProcedureType
                    procedureType, _ = ProcedureType.objects.get_or_create(
                        code = item['code'],
                        defaults={
                            'name' : item['name']
                        }
                    )

                    procs_list.append(procedureType)

                # Patient
                patient_data = data['patient']
                patient, _ = Patient.objects.get_or_create(
                    pid = patient_data['pid'],
                    defaults={
                        'fullname' : patient_data['fullname'],
                        'gender' : patient_data['gender'],
                        'dob' : patient_data['dob'],
                        'tel':patient_data['tel'],
                        'address' : patient_data['address'],
                        'insurance_no' : patient_data['insurance_no']
                    }
                )

                referring_phys, _ = Doctor.objects.get_or_create(
                    doctor_no = data['referring_phys_code'],
                    defaults= {
                        'fullname' : data['referring_phys_name'],
                        'type':'P', # P = Referring physician
                    }
                )

                order_new = Order.objects.create(
                    accession_no=data['accession_no'],
                    req_dept_code=data['req_dept_code'],
                    req_dept_name=data['req_dept_name'],
                    clinical_diagnosis=data['clinical_diagnosis'],
                    patient_class=data['patient_class'],
                    order_time=data['order_time'],
                    modality_type=data['modality_type'],
                    order_no=data['order_no'],
                    # insurance_no = data['insurance_no'],
                    is_insurance_applied=data['is_insurance_applied'],
                    is_urgent=data['is_urgent'],

                    # this uid is created first in \shared\data\integration_app.json
                    created_by="65838386-c439-44b4-8ee6-68f134eb5bc2", 

                    # patient_id mean
                    patient = patient,
                    referring_phys = referring_phys
                )

                order_new.save()
                proce_list = []
                for item in procs_list:
                    proce_list.append(Procedure(
                        order=order_new,
                        procedure_type=item
                    ))
                Procedure.objects.bulk_create(proce_list)

                data = {'id': order_new.id}
                return self.cus_response_created(data)

        except Exception as e:
            logger.error(e, exc_info=True)
            code = ec.E_SYSTEM
            msg = str(e)

            if 'duplicate key value' in str(e):
                code = ec.E_RECORD_EXISTS
                msg = 'The order already exists'

            return self.response_NG(code, msg)
    
    """
    Delete the order - For HIS(1)
    """
    @swagger_auto_schema(
        operation_summary='Delete the order',
        operation_description='Delete the order',
        # request_body=ser.DeleteOrderSerializers,
        query_serializer= ser.DeleteOrderSerializers,
        tags=[swagger_tags.REPORT_HIS],
        manual_parameters=[
            openapi.Parameter('x-auth-key', openapi.IN_HEADER, 
                              description="Custom Header",
                              type=openapi.TYPE_STRING),
        ],
    )
    def delete(self, request, *args, **kwargs):
        # Get and check external app. Headers: x-auth-key
        if request.META.get('HTTP_X_AUTH_KEY'):
            user = self.check_integration_token(request.META.get('HTTP_X_AUTH_KEY'))
        else:
            user = request.user

        has_permission = CheckPermission(per_code.DELETE_ORDER, user.id).check()
        if not has_permission and not user.is_superuser:
            return self.cus_response_403(per_code.DELETE_ORDER)   

        serializer = ser.DeleteOrderSerializers(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            # Get accession_no from query params: /?accession=XX   
            accession=data['accession']

            instance = Order.objects.filter(accession_no=accession, delete_flag=False).first()
            if not instance:
                return self.cus_response_empty_data(type=ec.ORDER)

            # Check if the order's image or report is not exist, if already, return 403 error
            # is_exist = Report.objects.filter(accession_no=accession, delete_flag = False).exists()
            # if is_exist:
            #     return self.cus_response_403_contraint('Cannot delete! The order has been linked with report')
            
            # More check image link if report doesnot exist
            # Get pacsdb.study by accession_no
            with connections["pacs_db"].cursor() as cursor:
                cursor.execute("select study_iuid from study where accession_no=%s",[accession])
                results = cursor.fetchall()

                if results is not None and len(results) > 0:
                    # Return error 403 Forbidden
                    return self.cus_response_403_contraint('Cannot delete! The order has been linked with images')

            # Update    
            instance.delete_flag = True
            # this uid is created first in \shared\data\integration_app.json
            instance.updated_by = "65838386-c439-44b4-8ee6-68f134eb5bc2"
            instance.updated_at=timezone.now()

            instance.save()
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))
        
        return self.cus_response_deleted()
    
        
# =============== Report class ==================    
"""
Report detail view class - For HIS(2)
"""   
class External_ReportByACNProcedure(ReportBaseView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Get a report
    kwargs = accession_no and procedure_code
    """
    @swagger_auto_schema(
        operation_summary='Report Detail By ACN and Procdure',
        operation_description='Report Detail By ACN and Procdure',
        tags=[swagger_tags.REPORT_HIS],
        manual_parameters=[
            openapi.Parameter('x-auth-key', openapi.IN_HEADER, 
                              description="Custom Header",
                              type=openapi.TYPE_STRING),
        ],
    )
    def get(self, request, *args, **kwargs):
        # Get and check external app. Headers: x-auth-key
        if request.META.get('HTTP_X_AUTH_KEY'):
            user = self.check_integration_token(request.META.get('HTTP_X_AUTH_KEY'))
        else:
            user = request.user

        has_permission = CheckPermission(per_code.VIEW_REPORT, user.id).check()
        if not has_permission and not user.is_superuser:
            return self.cus_response_403(per_code.VIEW_REPORT)   

        accession_no=kwargs['accession_no']
        procedure_code=kwargs['procedure_code']
        
        # procedure and procedure_type queries
        procedure_prefetch = Prefetch(
            'procedure_set',
            queryset=Procedure.objects.select_related('procedure_type').filter(procedure_type__code=procedure_code),
            to_attr='procedure_list'
        )

        try:
            order = Order.objects.prefetch_related(procedure_prefetch).get(accession_no=accession_no)
        except Order.DoesNotExist:
            return self.cus_response_empty_data(ec.REPORT)
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))
        
        if len(order.procedure_list) <= 0:
            return self.cus_response_empty_data(ec.REPORT)
        
        # One record only
        proc = order.procedure_list[0]
        procedure= {'proc_id':proc.id,
                    'code': proc.procedure_type.code, 
                    'name': proc.procedure_type.name} 

        # Get report
        data = {}
        report = self.get_report_by_proc_id(proc.id)
        if report is None:
            return self.cus_response_empty_data(ec.REPORT)
        
        # Get latest report
        return self.get_report_json(request, report)
    

class External_ReportById(ReportBaseView):
    """
     - For HIS(3) : delete report
    """
    queryset = User.objects.all()
    authentication_classes = ()
    
    @swagger_auto_schema(
        operation_summary='Delete the report by Id',
        operation_description='Delete the report by Id',
        tags=[swagger_tags.REPORT_HIS],
        manual_parameters=[
            openapi.Parameter('x-auth-key', openapi.IN_HEADER, 
                              description="Custom Header",
                              type=openapi.TYPE_STRING),
        ],
    )
    def delete(self, request, *args, **kwargs):
        """
        Delete the report.
        If deleting from UI, updated_by is login user
        If deleting from integration app, updated_by is HIS user.
        """

        # Get and check external app. Headers: x-auth-key
        if request.META.get('HTTP_X_AUTH_KEY'):
            user = self.check_integration_token(request.META.get('HTTP_X_AUTH_KEY'))
        else:
            user = request.user

        has_permission = CheckPermission(per_code.DELETE_REPORT, user.id).check()
        if not has_permission and not user.is_superuser:
            return self.cus_response_403(per_code.DELETE_REPORT)            

        try:
            instance = Report.objects.filter(**kwargs, delete_flag=False).first()
            if not instance:
                return self.cus_response_empty_data(type=ec.REPORT)

            # Delete status, flag
            instance.delete_flag = True
            instance.status = 'X'
            # this uid is created first in \shared\data\integration_app.json
            instance.updated_by = "65838386-c439-44b4-8ee6-68f134eb5bc2"
            instance.updated_at=timezone.now()

            instance.save()
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))
        
        return self.cus_response_deleted()
    
        
"""
Image Link detail view class - For HIS(4.1)
"""   
class External_ImageLinkView(CustomAPIView):
    """
    Get a images link that has been reported or not yet
    ?accession=xxx
    """

    queryset = User.objects.all()
    authentication_classes = ()

    @swagger_auto_schema(
        operation_summary='Get Image link',
        operation_description='Get Image link',
        tags=[swagger_tags.REPORT_HIS],
        query_serializer= ser.GetImageLinkSerializers,
        manual_parameters=[
            openapi.Parameter('x-auth-key', openapi.IN_HEADER, 
                              description="Custom Header",
                              type=openapi.TYPE_STRING),
        ],
    )
    def get(self, request, *args, **kwargs):
        # Get and check external app. Headers: x-auth-key
        if request.META.get('HTTP_X_AUTH_KEY'):
            user = self.check_integration_token(request.META.get('HTTP_X_AUTH_KEY'))
        else:
            user = request.user

        has_permission = CheckPermission(per_code.VIEW_IMAGE, user.id).check()
        if not has_permission and not user.is_superuser:
            return self.cus_response_403(per_code.VIEW_IMAGE)   

        # Get accession_no from query params: /?accession=XX   
        accession=request.query_params.get('accession')

        data= {}
        try:
            # Get pacsdb.study by accession_no
            with connections["pacs_db"].cursor() as cursor:
                cursor.execute("select study_iuid from study where accession_no=%s",[accession])
                results = cursor.fetchall()

                if results is None or len(results) <= 0:
                    return self.cus_response_empty_data(type=ec.REPORT)
                
                # if results is not None:
                data= [{
                    'image_link':get_image_link(request, item[0])
                } for item in results]
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))
        
        return self.response_success(data=data)     


"""
Image Link detail view class - For HIS(4.2)
"""   
class External_ImageLinkByACNProcedure(CustomAPIView):
    """
    Get a image link that has been reported
    kwargs = accession_no
    """

    queryset = User.objects.all()
    authentication_classes = ()

    @swagger_auto_schema(
        operation_summary='Get Image link By ACN and Procedure',
        operation_description='Get Image link By ACN and Procedure',
        tags=[swagger_tags.REPORT_HIS],
        manual_parameters=[
            openapi.Parameter('x-auth-key', openapi.IN_HEADER, 
                              description="Custom Header",
                              type=openapi.TYPE_STRING),
        ],
    )
    def get(self, request, *args, **kwargs):
        # Get and check external app. Headers: x-auth-key
        if request.META.get('HTTP_X_AUTH_KEY'):
            user = self.check_integration_token(request.META.get('HTTP_X_AUTH_KEY'))
        else:
            user = request.user

        has_permission = CheckPermission(per_code.VIEW_IMAGE, user.id).check()
        if not has_permission and not user.is_superuser:
            return self.cus_response_403(per_code.VIEW_IMAGE)   

        accession_no=kwargs['accession_no']
        procedure_code=kwargs['procedure_code']

        try:
            queryset = Procedure.objects.all() \
                .select_related('procedure_type').filter(procedure_type__code=procedure_code) \
                .select_related('order').filter(order__accession_no=accession_no, order__delete_flag=False)

            if len(queryset) <= 0:
                return self.cus_response_empty_data(ec.REPORT)
            
            return self.response_success(data={'image_link':get_image_link(request, queryset[0].study_iuid)}  )
   
        except Procedure.DoesNotExist:
            return self.cus_response_empty_data(ec.REPORT)
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))    
       