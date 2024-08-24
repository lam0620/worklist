from datetime import datetime
import logging

from django.utils import timezone

from django.db import transaction,connections
from drf_yasg.utils import swagger_auto_schema
from apps.report.get_report_view import GetReportView
from third_parties.contribution.api_view import CustomAPIView
from django.db.models import F, Prefetch
from drf_yasg import openapi

from apps.report import serializers as ser
from apps.report.models import (
    Doctor, Report, ReportTemplate, User, 
    Order,Patient,Procedure,ProcedureType
)
from apps.account.permission import CheckPermission
from apps.account.utils import  convert_return_data_format, convert_str_to_datetime
from apps.report.utils import  get_image_link
from apps.shared.utils import CusResponse
from library.constant import error_codes as ec
from library.constant import module_code as module_code
from library.constant import permission_code as per_code
from library.constant import swagger_tags
from rest_framework import serializers

logger = logging.getLogger(__name__)



"""
HIS PACS integration class
"""

class OrderView(GetReportView):
    queryset = User.objects.all()
    # Call overwrite here to skip authenticate or don't call request.user
    authentication_classes = ()

    """
    Get list of order
    """
    @swagger_auto_schema(
        operation_summary='Get all orders',
        operation_description='Get all orders',
        tags=[swagger_tags.REPORT_ORDER],
    )
    def get(self, request, *args, **kwargs):
        # user = request.user
        # is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

        procedure_prefetch = Prefetch(
            'procedure_set',
            queryset=Procedure.objects.select_related('procedure_type'),
            to_attr='procedure_list'
        )
        queryset = self.filter_queryset(Order.objects.prefetch_related(procedure_prefetch))
        orders_data = []
        for order in queryset:
            order_data = {
                'accession_no': order.accession_no,
                'req_phys_code': order.referring_phys.doctor_no,
                'req_phys_name': order.referring_phys.fullname,
                'clinical_diagnosis': order.clinical_diagnosis,
                'order_time': order.order_time,
                'modality_type': order.modality_type,
                'patient': {
                    'pid':order.patient.pid,
                    'fullname':order.patient.fullname,
                    'gender':order.patient.gender,
                    'dob':order.patient.dob,
                    'tel':order.patient.tel,
                    'address':order.patient.address,
                    'insurance_no':order.patient.insurance_no
                },
                'procedures': [{'proc_id': proc.id,
                                'study_iuid':proc.study_iuid,
                                'code': proc.procedure_type.code, 
                                'name': proc.procedure_type.name} for proc in order.procedure_list]
            }
            orders_data.append(order_data)

        page = self.paginate_queryset(orders_data)
        return self.get_paginated_response(page)

    """
    Create new an order - For HIS(1)
    """
    @swagger_auto_schema(
        operation_summary='Create new an order',
        operation_description='Create new an order',
        request_body=ser.CreateOrderSerializers,
        tags=[swagger_tags.REPORT_ORDER],
        manual_parameters=[
            openapi.Parameter('x-auth-key', openapi.IN_HEADER, 
                              description="Custom Header",
                              type=openapi.TYPE_STRING),
        ],
    )
    def post(self, request):
        # user = request.user
        # is_per = CheckPermission(per_code.ADD_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

        # Get and check external app. Headers: x-auth-key
        if request.META.get('HTTP_X_AUTH_KEY'):
            user = self.check_integration_token(request.META.get('HTTP_X_AUTH_KEY'))
        else:
            user = request.user

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
            return self.response_NG(ec.SYSTEM_ERR, str(e))
    

    
class OrderByACN(GetReportView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Get list of order
    """
    @swagger_auto_schema(
        operation_summary='Order Detail by AccessionNumber',
        operation_description='Order Detail by AccessionNumber',
        tags=[swagger_tags.REPORT_ORDER],
    )
    def get(self, request, *args, **kwargs):
        # user = request.user
        # is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

        # procedure and procedure_type queries
        procedure_prefetch = Prefetch(
            'procedure_set',
            queryset=Procedure.objects.select_related('procedure_type'),
            to_attr='procedure_list'
        )

        try:
            order = Order.objects.prefetch_related(procedure_prefetch).get(**kwargs, delete_flag=False)
        except Order.DoesNotExist:
            return self.cus_response_empty_data(ec.REPORT)
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        order_data = {
            'accession_no': order.accession_no,
            'req_phys_code': order.referring_phys.doctor_no,
            'req_phys_name': order.referring_phys.fullname,
            'clinical_diagnosis': order.clinical_diagnosis,
            'order_time': order.order_time,
            'modality_type': order.modality_type,
            'is_insurance_applied': order.is_insurance_applied,
            'patient': {
                'pid':order.patient.pid,
                'fullname':order.patient.fullname,
                'gender':order.patient.gender,
                'dob':order.patient.dob,
                'tel':order.patient.tel,
                'address':order.patient.address,
                'insurance_no':order.patient.insurance_no
            },
            'procedures': [{'proc_id': proc.id,
                            'study_iuid':proc.study_iuid,
                            'code': proc.procedure_type.code, 
                            'name': proc.procedure_type.name,
                            'report':self._get_report_json(proc.id)} for proc in order.procedure_list]
        }
        return self.response_success(data=order_data)
    
    def _get_report_json(self, proc_id):
        data = {}

        report = self.get_report_by_proc_id(proc_id)
        if report is not None:
            created_time = report.created_at.strftime('%d/%m/%Y %H:%M')
            data = {
                'id': report.id,
                'accession_no': report.accession_no,
                'study_iuid': report.study_iuid,
                'findings': report.findings,
                'conclusion': report.conclusion,
                'status': report.status,
                'created_time':created_time,
                'radiologist': {
                    "id":report.radiologist.id,
                    'doctor_no':report.radiologist.doctor_no,
                    'fullname':report.radiologist.fullname,
                    'sign':report.radiologist.sign,
                    'title':report.radiologist.title,
                }                
            }

        return data

# =============== Report class ==================
class ReportView(GetReportView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Get a report
    kwargs = study_iuid
    """
    @swagger_auto_schema(
        operation_summary='Get reports',
        operation_description='Get reports',
        query_serializer=ser.GetReportSerializers,
        tags=[swagger_tags.REPORT],
    )
    def get(self, request, *args, **kwargs):
        try:
            study_iuid=request.query_params.get('study_iuid')
            # Get report by study_iuid and status != 'X' (deleted)
            report = Report.objects.filter(study_iuid=study_iuid, delete_flag = False).first()
            if report is None:
                return self.cus_response_empty_data(ec.REPORT)
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        # Get latest report
        return self.get_report_json(request, report)
    
    """
    Create new a report
    """
    @swagger_auto_schema(
        operation_summary='Create new a report',
        operation_description='Create new a report',
        request_body=ser.CreateReportSerializers,
        tags=[swagger_tags.REPORT],
    )
    def post(self, request):
        # user = request.user
        # is_per = CheckPermission(per_code.ADD_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

        logger.info('Creating report.....');
        serializer = ser.CreateReportSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Data after validation
        data = serializer.validated_data

        try:
            with transaction.atomic():
                procedure = None
                # Check if 'procedure_id' is not exist
                if 'procedure_id' in data and data['procedure_id']:
                    procedure = Procedure.objects.get(pk=data['procedure_id'])
                
                report_new = Report.objects.create(
                    accession_no=data['accession_no'],
                    study_iuid=data['study_iuid'],
                    findings=data['findings'],
                    conclusion=data['conclusion'],
                    status=data['status'],
                   
                    radiologist = Doctor.objects.get(pk=data['radiologist_id']),
                    procedure = procedure,

                    created_by = data['radiologist_id']
                )

                # Persist db
                report_new.save()

                # Update study_iuid to procedure
                procedure.study_iuid = data['study_iuid']
                procedure.updated_at = timezone.now()
                procedure.save()

                #return self.cus_response_created()
                # Get latest report
                return self.get_report_by_id(request, report_new.id)
                # return self.response_success(data=new_data)
            

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
    

    
"""
Report detail view class - For HIS(2)
"""   
class ReportByACNProcedure(GetReportView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Get a report
    kwargs = accession_no and procedure_code
    """
    @swagger_auto_schema(
        operation_summary='Report Detail By ACN and Procdure',
        operation_description='Report Detail By ACN and Procdure',
        tags=[swagger_tags.REPORT],
        manual_parameters=[
            openapi.Parameter('x-auth-key', openapi.IN_HEADER, 
                              description="Custom Header",
                              type=openapi.TYPE_STRING),
        ],
    )
    def get(self, request, *args, **kwargs):
        # user = request.user
        # is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

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
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
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

    
    # def _get_report(self, proc_id):
    #     report = None
    #     try:
    #         report=Report.objects.get(procedure_id=proc_id)
    #     except Report.DoesNotExist:
    #         logger.warn("Report not exist", exc_info=True)
    #     return report    
    

class ReportById(GetReportView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Get a report
    kwargs = study_iuid
    """
    @swagger_auto_schema(
        operation_summary='Get Detail Report by Id',
        operation_description='Get Detail Report by Id',
        tags=[swagger_tags.REPORT],
    )
    def get(self, request, *args, **kwargs):
        # Get latest report
        
        return self.get_report_by_id(request, kwargs['pk'])

    @swagger_auto_schema(
        operation_summary='Update the report by id',
        operation_description='Update the report by id',
        request_body=ser.UpdateReportSerializers,
        tags=[swagger_tags.REPORT],
    )
    def put(self, request, *args, **kwargs):
        # user = request.user
        try:
            report = Report.objects.get(**kwargs, delete_flag = False)
            if not report:
                return self.cus_response_empty_data(ec.REPORT)

            serializer = ser.UpdateReportSerializers(data=request.data, instance=report)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            with transaction.atomic():
                for key, value in data.items():
                    setattr(report, key, value)

                # instance.updated_by = user.id
                report.updated_at = timezone.now()
                report.save()
                
                #return self.cus_response_updated()
            # Get latest report
            return self.get_report_by_id(request, report.id)

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
    
    """
     - For HIS(3) and internal use
    """
    @swagger_auto_schema(
        operation_summary='Delete the report by Id',
        operation_description='Delete the report by Id',
        tags=[swagger_tags.REPORT],
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
        # user = request.user
        # is_per = CheckPermission(per_code.DELETE_ACCOUNT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

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
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        return self.cus_response_deleted()
    

"""
Doctor list view class
"""   
class DoctorListView(CustomAPIView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Get a doctor
    kwargs = accession_no and procedure_code
    """
    @swagger_auto_schema(
        operation_summary='Get doctors',
        operation_description='Get doctors',
        tags=[swagger_tags.REPORT_DOCTOR],
    )
    def get(self, request, *args, **kwargs):
        # user = request.user
        # is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

        # P: referring physician, R: radilogist    
        type=kwargs['type']

        data= {}
        try:
            doctors = Doctor.objects.filter(type=type, is_active = True)
            data = [{'id': item.id,
                     'doctor_no':item.doctor_no,
                     'fullname':item.fullname,
                     'title':item.title,
                     'sign':item.sign} for item in doctors]
            
        except Doctor.DoesNotExist:
            return self.cus_response_empty_data(ec.REPORT)
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        return self.response_success(data=data)


"""
Doctor view class
"""   
class DoctorView(CustomAPIView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Create new a doctor
    """
    @swagger_auto_schema(
        operation_summary='Create new a doctor',
        operation_description='Create new a doctor',
        request_body=ser.CreateDoctorSerializers,
        tags=[swagger_tags.REPORT_DOCTOR],
    )
    def post(self, request):
        # user = request.user
        # is_per = CheckPermission(per_code.ADD_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

        serializer = ser.CreateDoctorSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Data after validation
        data = serializer.validated_data

        try:
            with transaction.atomic():
               
                doctor_new = Doctor.objects.create(
                    doctor_no=data['doctor_no'],
                    fullname=data['fullname'],
                    type=data['type'],
                    gender=data['gender'],
                    title=data['title'],
                    sign=data['sign']
                    # created_by = ''
                )

                # Persist db
                doctor_new.save()

                data = {'id': doctor_new.id}
                return self.cus_response_created(data)

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))       
        

"""
Image Link detail view class - For HIS(4)
"""   
class ImageLinkByACNProcedure(CustomAPIView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Get a image link
    kwargs = accession_no
    """
    @swagger_auto_schema(
        operation_summary='Get Image link By ACN and Procedure',
        operation_description='Get Image link By ACN and Procedure',
        tags=[swagger_tags.REPORT],
        manual_parameters=[
            openapi.Parameter('x-auth-key', openapi.IN_HEADER, 
                              description="Custom Header",
                              type=openapi.TYPE_STRING),
        ],
    )
    def get(self, request, *args, **kwargs):
        # user = request.user
        # is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

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
            return self.response_NG(ec.SYSTEM_ERR, str(e))        

        
        
"""
Image Link detail view class - For HIS(4)
"""   
class ImageLinkByACN(CustomAPIView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Get a image link
    kwargs = accession_no
    """
    @swagger_auto_schema(
        operation_summary='Get Image link By ACN',
        operation_description='Get Image link By ACN ',
        tags=[swagger_tags.REPORT],
        manual_parameters=[
            openapi.Parameter('x-auth-key', openapi.IN_HEADER, 
                              description="Custom Header",
                              type=openapi.TYPE_STRING),
        ],
    )
    def get(self, request, *args, **kwargs):
        # user = request.user
        # is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

        # Get and check external app. Headers: x-auth-key
        if request.META.get('HTTP_X_AUTH_KEY'):
            user = self.check_integration_token(request.META.get('HTTP_X_AUTH_KEY'))
        else:
            user = request.user

        has_permission = CheckPermission(per_code.VIEW_IMAGE, user.id).check()
        if not has_permission and not user.is_superuser:
            return self.cus_response_403(per_code.VIEW_IMAGE)   

        accession_no=kwargs['accession_no']
        # procedure_code=kwargs['procedure_code']
        data= {}
        try:
            # Get pacsdb.study by accession_no
            with connections["pacs_db"].cursor() as cursor:
                cursor.execute("select study_iuid from study where accession_no=%s",[accession_no])

                result = cursor.fetchone()

                if result is not None:
                    data= {
                        'accession_no':accession_no,
                        'image_link':get_image_link(request, result[0])
                    }
        # except Order.DoesNotExist:
        #     return self.cus_response_empty_data(ec.REPORT)
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        return self.response_success(data=data)
    

"""
Report tempalte list view class
"""   
# class ReportTemplateListView(CustomAPIView):
#     queryset = User.objects.all()
#     authentication_classes = ()

#     """
#     Get a doctor
#     kwargs = accession_no and procedure_code
#     """
#     @swagger_auto_schema(
#         operation_summary='Get report templates',
#         operation_description='Get report templates',
#         tags=[swagger_tags.REPORT_TEMPLATE],
#     )
#     def get(self, request, *args, **kwargs):
#         # user = request.user
#         # is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
#         # if not is_per and not user.is_superuser:
#         #     return self.cus_response_403()

#         # P: referring physician, R: radilogist    
#         modality=kwargs['modality']

#         data= {}
#         try:
#             tempaltes = ReportTemplate.objects.filter(modality=modality.upper(), delete_flag = False)
#             data = [{'id': item.id,
#                      'name':item.name,
#                      'type':item.type,
#                      'findings':item.findings,
#                      'conclusion':item.conclusion} for item in tempaltes]
            
#         except ReportTemplate.DoesNotExist:
#             return self.cus_response_empty_data(ec.REPORT)
        
#         except Exception as e:
#             logger.error(e, exc_info=True)
#             return self.response_NG(ec.SYSTEM_ERR, str(e))
        
#         return self.response_success(data=data)


"""
Report Template view class
"""   
class ReportTemplateView(CustomAPIView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Get a doctor
    kwargs = accession_no and procedure_code
    """
    @swagger_auto_schema(
        operation_summary='Get report templates',
        operation_description='Get report templates',
        query_serializer= ser.GetReportTemplateSerializers,
        tags=[swagger_tags.REPORT_TEMPLATE],
    )
    def get(self, request, *args, **kwargs):
        # user = request.user
        # is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

        # Get modality from query params: /?modality=XX   
        modality=request.query_params.get('modality')

        data= {}
        try:
            tempaltes = ReportTemplate.objects.filter(modality=modality.upper(), delete_flag = False)
            data = [{'id': item.id,
                     'name':item.name,
                     'type':item.type,
                     'findings':item.findings,
                     'conclusion':item.conclusion} for item in tempaltes]
            
        except ReportTemplate.DoesNotExist:
            return self.cus_response_empty_data(ec.REPORT)
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        return self.response_success(data=data)
    
    """
    Create new a doctor
    """
    @swagger_auto_schema(
        operation_summary='Create new a report template',
        operation_description='Create new a report template',
        request_body=ser.CreateReportTemplateSerializers,
        tags=[swagger_tags.REPORT_TEMPLATE],
    )
    def post(self, request):
        # user = request.user
        # is_per = CheckPermission(per_code.ADD_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

        serializer = ser.CreateReportTemplateSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Data after validation
        data = serializer.validated_data

        try:
            with transaction.atomic():
               
                template_new = ReportTemplate.objects.create(
                    name=data['name'],
                    type=data['type'],
                    findings=data['findings'],
                    conclusion=data['conclusion'],
                    modality=data['modality']
                    # created_by = ''
                )

                # Persist db
                template_new.save()

                data = {'id': template_new.id}
                return self.cus_response_created(data)

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))     
        

class ReportTemplateDetailView(CustomAPIView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Get a report
    kwargs = study_iuid
    """
    @swagger_auto_schema(
        operation_summary='Get Detail Report template by Id',
        operation_description='Get Detail Report template by Id',
        tags=[swagger_tags.REPORT_TEMPLATE],
    )
    def get(self, request, *args, **kwargs):
        # Get latest report
        
        return self._get_report_template_by_id(kwargs['pk'])

    @swagger_auto_schema(
        operation_summary='Update the report templateby id',
        operation_description='Update the report template by id',
        request_body=ser.UpdateReportTemplateSerializers,
        tags=[swagger_tags.REPORT_TEMPLATE],
    )
    def put(self, request, *args, **kwargs):
        # user = request.user
        try:
            report = ReportTemplate.objects.get(**kwargs, delete_flag = False)
            if not report:
                return self.cus_response_empty_data(ec.REPORT)

            serializer = ser.UpdateReportTemplateSerializers(data=request.data, instance=report)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            with transaction.atomic():
                for key, value in data.items():
                    setattr(report, key, value)

                # instance.updated_by = user.id
                report.updated_at = timezone.now()
                report.save()
                
                #return self.cus_response_updated()
            # Get latest report
            return self._get_report_template_by_id(report.id)

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
    def _get_report_template_by_id(self, pk):
        try:
            item = ReportTemplate.objects.get(pk=pk)
            if item is None:
                return self.cus_response_empty_data('REPORT')
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG('SYSTEM_ERR', str(e))
        
        data = {'id': item.id,
                    'name':item.name,
                    'type':item.type,
                    'findings':item.findings,
                    'conclusion':item.conclusion
                }
        
        return self.response_success(data=data) 
    
   