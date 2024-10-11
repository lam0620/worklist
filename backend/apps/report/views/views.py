import logging

from django.utils import timezone

from django.db import transaction,connections
from drf_yasg.utils import swagger_auto_schema
from apps.report.doctor_base_view import DoctorBaseView
from apps.report.report_base_view import ReportBaseView
from third_parties.contribution.api_view import CustomAPIView
from django.db.models import F, Prefetch
from drf_yasg import openapi

from rest_framework.parsers import MultiPartParser,JSONParser
from rest_framework.decorators import parser_classes

from library.constant import error_codes as ec
from library.constant import module_code as module_code
from library.constant import permission_code as per_code
from library.constant import swagger_tags

from apps.report import serializers as ser
from apps.report.models import (
    Doctor, Report, ReportTemplate, User, 
    Order,Patient,Procedure,ProcedureType
)
from apps.account.permission import CheckPermission
from apps.report.utils import  get_image_field_str,get_username


logger = logging.getLogger(__name__)



"""
Order class
"""

class OrderView(ReportBaseView):
    queryset = User.objects.all()
    # Call overwrite here to skip authenticate or don't call request.user
    # uncomment if no need to check permission 
    # authentication_classes = ()

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
        if accession =='':
            return self.response_item_NG(ec.SYSTEM_ERR, 'accession', "Accession number is empty")
    
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
                                'name': proc.procedure_type.name,
                                'report':self.get_order_report_json(proc.id)} for proc in order.procedure_list]
            }
            orders_data.append(order_data)

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
   

class OrderByACNView(ReportBaseView):
    queryset = User.objects.all()
    # uncomment if no need to check permission 
    # authentication_classes = ()

    """
    Get list of order
    """
    @swagger_auto_schema(
        operation_summary='Order Detail by AccessionNumber',
        operation_description='Order Detail by AccessionNumber',
        tags=[swagger_tags.REPORT_ORDER],
    )
    def get(self, request, *args, **kwargs):
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_ORDER)

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
                            'report':self.get_order_report_json(proc.id)} for proc in order.procedure_list]
        }
        return self.response_success(data=order_data)
    
# =============== Report class ==================
class ReportView(ReportBaseView):
    queryset = User.objects.all()
    # uncomment if no need to check permission 
    # authentication_classes = ()

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
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_REPORT)
                    
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
        updatedBy = None
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.ADD_REPORT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.ADD_REPORT)
            updatedBy = user.id

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
                
                if not updatedBy:
                    updatedBy = data['radiologist_id']

                report_new = Report.objects.create(
                    accession_no=data['accession_no'],
                    study_iuid=data['study_iuid'],
                    findings=data['findings'],
                    conclusion=data['conclusion'],
                    status=data['status'],
                   
                    radiologist = Doctor.objects.get(pk=data['radiologist_id']),
                    procedure = procedure,

                    created_by = updatedBy 
                )

                # Persist db
                report_new.save()

                # Update study_iuid to procedure
                procedure.study_iuid = data['study_iuid']
                procedure.updated_at = timezone.now()
                procedure.updated_by = updatedBy
                procedure.save()

                #return self.cus_response_created()
                # Get latest report
                return self.get_report_by_id(request, report_new.id)
                # return self.response_success(data=new_data)
            

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
    

class ReportById(ReportBaseView):
    queryset = User.objects.all()
    # uncomment if no need to check permission 
    # authentication_classes = ()

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
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_REPORT)
                    
        # Get latest report        
        return self.get_report_by_id(request, kwargs['pk'])

    @swagger_auto_schema(
        operation_summary='Update the report by id',
        operation_description='Update the report by id',
        request_body=ser.UpdateReportSerializers,
        tags=[swagger_tags.REPORT],
    )
    def put(self, request, *args, **kwargs):
        updatedBy = None
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.EDIT_REPORT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.EDIT_REPORT)
            
            updatedBy = user.id
                    
        try:
            report = Report.objects.get(**kwargs, delete_flag = False)
            if not report:
                return self.cus_response_empty_data(ec.REPORT)

            updatedBy = report.radiologist.id
            serializer = ser.UpdateReportSerializers(data=request.data, instance=report)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            with transaction.atomic():
                for key, value in data.items():
                    setattr(report, key, value)

                report.updated_by = updatedBy
                report.updated_at = timezone.now()
                report.save()
                
                #return self.cus_response_updated()
            # Get latest report
            return self.get_report_by_id(request, report.id)

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
       
    def delete(self, request, *args, **kwargs):
        """
        Delete the report.
        If deleting from UI, updated_by is login user
        If deleting from integration app, updated_by is HIS user.
        """
        updatedBy = None
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.DELETE_REPORT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.DELETE_REPORT) 
            updatedBy = user.id     

        try:
            instance = Report.objects.get(**kwargs, delete_flag=False)
            if not instance:
                return self.cus_response_empty_data(type=ec.REPORT)

            if not updatedBy:
                updatedBy = instance.radiologist.id

            # Delete status, flag
            instance.delete_flag = True
            instance.status = 'X'
            # this uid is created first in \shared\data\integration_app.json
            instance.updated_by = updatedBy
            instance.updated_at=timezone.now()

            instance.save()
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        return self.cus_response_deleted()
    
"""
Doctor view class
"""   
class DoctorView(DoctorBaseView):
    queryset = Doctor.objects.all()
    # uncomment if no need to check permission 
    # authentication_classes = ()

    # for search box (?search=xxx). which you want to search. 
    search_fields = ['fullname', 'doctor_no']
    # for query string (?type=xxx)
    filter_fields = ['type', 'user_id', 'is_active']

    parser_classes = [MultiPartParser, JSONParser]

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
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_DOCTOR, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_DOCTOR)

        data= {}
        try:
            doctors = self.filter_queryset(self.get_queryset())

            data = [{'id': item.id,
                     'user_id':item.user_id,
                     'doctor_no':item.doctor_no,
                     'type':item.type,
                     'fullname':item.fullname,
                     'gender':item.gender,
                     'title':item.title,
                     'is_active':item.is_active,
                     'username':get_username(item.user),
                     'sign':get_image_field_str(item.sign)} for item in doctors]

                        
        except Doctor.DoesNotExist:
            return self.cus_response_empty_data(ec.REPORT)
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        # return self.response_success(data=data)
        page = self.paginate_queryset(data)
        return self.get_paginated_response(page)    
    
    """
    Create new a doctor
    """
    @swagger_auto_schema(
        operation_summary='Create new a doctor',
        operation_description='Create new a doctor',
        request_body=ser.CreateDoctorSerializers,
        tags=[swagger_tags.REPORT_DOCTOR]
    )
    # @parser_classes((MultiPartParser,))
    def post(self, request):
        updatedBy = None
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.ADD_DOCTOR, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.ADD_DOCTOR)
            updatedBy = user.id

        serializer = ser.CreateDoctorSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Data after validation
        data = serializer.validated_data

        try:
            with transaction.atomic():
               
                doctor_new = Doctor.objects.create(
                    user_id=data['user_id'],
                    doctor_no=data['doctor_no'],
                    fullname=data['fullname'],
                    type=data['type'],
                    gender=data['gender'],
                    title=data['title'],
                    # tel=data['tel'],
                    # address=data['address'],
                    sign=data['sign'],
                    is_active=data['is_active'],
                    created_by = updatedBy
                )

                # Persist db
                doctor_new.save()

                data = {'id': doctor_new.id}
                return self.cus_response_created(data)

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))       
  
    @swagger_auto_schema(
        operation_summary="Activate/Deactivate doctors",
        operation_description='Activate/Deactivate doctors',
        request_body=ser.ADectivateDoctorListSerializer,
        tags=[swagger_tags.REPORT_DOCTOR],
    )
    def patch(self, request):
        user = request.user
        is_per = CheckPermission(per_code.EDIT_DOCTOR, user.id).check()
        if not is_per and not user.is_superuser:
            return self.cus_response_403()

        serializers = ser.ADectivateDoctorListSerializer(data=request.data)
        serializers.is_valid(raise_exception=True)
        data = serializers.validated_data

        try:
            with transaction.atomic():
                Doctor.objects.filter(id__in=data['ids_doctor']).update(is_active=data['is_active'], updated_by=user.id)
            return self.cus_response_updated('Activate/Deactivate successfully')
        except Exception as e:
            logger.error(e, exc_info=True)
        return self.cus_response_500()
    

class DoctorDetailView(DoctorBaseView):
    queryset = User.objects.all()
    # uncomment if no need to check permission 
    # authentication_classes = ()
    parser_classes = [MultiPartParser, JSONParser]

    """
    Get a report
    kwargs = pk
    """
    @swagger_auto_schema(
        operation_summary='Get Detail Doctor by Id',
        operation_description='Get Detail Doctor by Id',
        tags=[swagger_tags.REPORT_DOCTOR],
    )
    def get(self, request, *args, **kwargs):
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_DOCTOR, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_DOCTOR)
                    
        # Get latest Doctor
        return self.get_doctor_by_id(kwargs['pk'])

    @swagger_auto_schema(
        operation_summary='Update the doctor by id',
        operation_description='Update the doctor by id',
        request_body=ser.UpdateDoctorSerializers,
        tags=[swagger_tags.REPORT_DOCTOR],
    )
    def put(self, request, *args, **kwargs):
        updatedBy = None
        # Get and check version to secure or not        
        if request.META.get('HTTP_X_API_VERSION') != "X":          
            user = request.user   
            is_per = CheckPermission(per_code.EDIT_DOCTOR, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.EDIT_DOCTOR)
            updatedBy = user.id
            

        doctor = Doctor.objects.get(**kwargs)
        if not doctor:
            return self.cus_response_empty_data()

        serializer = ser.UpdateDoctorSerializers(data=request.data, instance=doctor)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        try:
            with transaction.atomic():
                for key, value in data.items():
                    # No update "sign" if it isnot passed in data
                    if key != 'sign' or 'sign' in request.data:
                        setattr(doctor, key, value)

                doctor.updated_by = updatedBy
                doctor.updated_at = timezone.now()
                doctor.save()
                
                #return self.cus_response_updated()
            # Get latest doctor
            return self.get_doctor_by_id(doctor.id)

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))

    @swagger_auto_schema(
        operation_summary='Activate/Deactivate the doctor',
        operation_description='Activate/Deactivate the doctor',
        request_body=ser.PatchDoctorSerializers,
        tags=[swagger_tags.REPORT_DOCTOR],
    )
    def patch(self, request, *args, **kwargs):
        updatedBy = None
        # Get and check version to secure or not        
        if request.META.get('HTTP_X_API_VERSION') != "X":          
            user = request.user   
            is_per = CheckPermission(per_code.EDIT_DOCTOR, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.EDIT_DOCTOR)
            updatedBy = user.id
            
        try:
            doctor = Doctor.objects.get(**kwargs)
            if not doctor:
                return self.cus_response_empty_data()

            # partial=True for patch method
            serializer = ser.PatchDoctorSerializers(data=request.data, instance=doctor, partial=True)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            if 'sign' in request.data and not request.data['sign']:
                data['sign'] = None
                
            with transaction.atomic():
                for key, value in data.items():
                    setattr(doctor, key, value)

                doctor.updated_by = updatedBy
                doctor.updated_at = timezone.now()
                doctor.save()
                
                #return self.cus_response_updated()
            # Get latest doctor
            return self.get_doctor_by_id(doctor.id)

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
    
"""
Report Template view class
"""   
class ReportTemplateView(CustomAPIView):
    queryset = User.objects.all()
    # uncomment if no need to check permission 
    # authentication_classes = ()

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
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_REPORT_TEMPLATE, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_REPORT_TEMPLATE)

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
        updatedBy = None
        # Get and check version to secure or not        
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.ADD_REPORT_TEMPLATE, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.ADD_REPORT_TEMPLATE)
            updatedBy = user.id

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
                    modality=data['modality'],
                    created_by = updatedBy
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
    # uncomment if no need to check permission 
    # authentication_classes = ()

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
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_REPORT_TEMPLATE, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_REPORT_TEMPLATE)
                    
        # Get latest report        
        return self._get_report_template_by_id(kwargs['pk'])

    @swagger_auto_schema(
        operation_summary='Update the report templateby id',
        operation_description='Update the report template by id',
        request_body=ser.UpdateReportTemplateSerializers,
        tags=[swagger_tags.REPORT_TEMPLATE],
    )
    def put(self, request, *args, **kwargs):
        updatedBy = None
        # Get and check version to secure or not        
        if request.META.get('HTTP_X_API_VERSION') != "X":          
            user = request.user   
            is_per = CheckPermission(per_code.EDIT_REPORT_TEMPLATE, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.EDIT_REPORT_TEMPLATE)
            updatedBy = user.id
            
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

                report.updated_by = updatedBy
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
    
   