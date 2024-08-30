import logging

from django.utils import timezone

from django.db import transaction,connections
from drf_yasg.utils import swagger_auto_schema
from apps.report.get_report_view import GetReportView
from third_parties.contribution.api_view import CustomAPIView
from django.db.models import F, Prefetch
from drf_yasg import openapi

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
from apps.report.utils import  get_image_link


logger = logging.getLogger(__name__)



"""
Order class
"""

class OrderView(GetReportView):
    queryset = User.objects.all()
    # Call overwrite here to skip authenticate or don't call request.user
    authentication_classes = ()

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

        # user = request.user
        # is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

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
    
   