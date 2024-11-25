import logging

from django.utils import timezone

from django.db import transaction,connections
from drf_yasg.utils import swagger_auto_schema

from third_parties.contribution.api_view import CustomAPIView

from rest_framework.decorators import parser_classes

from library.constant import error_codes as ec
from library.constant import module_code as module_code
from library.constant import permission_code as per_code
from library.constant import swagger_tags

from apps.account.permission import CheckPermission

from apps.report.report_base_view import ReportBaseView
from apps.report.worklist_base_view import WorklistBaseView
from apps.report import serializers as ser
from apps.report.models import (
    Doctor, Report, ReportTemplate, User, Procedure,
)

logger = logging.getLogger(__name__)



"""
Report class
"""
class ReportView(ReportBaseView, WorklistBaseView):
    queryset = Report.objects.all()
    # uncomment if no need to check permission 
    # authentication_classes = ()

    # for search box (?search=xxx). which you want to search. 
    search_fields = ['accession_no', 'radiologist__fullname']
    # for query string (?type=xxx)
    filter_fields = ['study_iuid']

    """
    Get a report
    kwargs = study_iuid
    """
    @swagger_auto_schema(
        operation_summary='Get reports',
        operation_description='Get reports',
        # query_serializer=ser.GetReportSerializers,
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
            # study_iuid=request.query_params.get('study_iuid')
            # # Get report by study_iuid and status != 'X' (deleted)
            # report = Report.objects.filter(study_iuid=study_iuid, delete_flag = False).first()
            reports = self.filter_queryset(self.get_queryset())
            # if report is None:
            #     return self.cus_response_empty_data(ec.REPORT)
            data = [self.get_pure_report_json(request, report) for report in reports]

                        
        except Report.DoesNotExist:
            return self.cus_response_empty_data(ec.REPORT)
                    
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))
        
        # Get latest report
        page = self.paginate_queryset(data)
        return self.get_paginated_response(page)    
    
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
        api_version = request.META.get('HTTP_X_API_VERSION')
        if api_version != "X":  
            user = request.user
            is_per = CheckPermission(per_code.ADD_REPORT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.ADD_REPORT)
            updatedBy = user.id

        logger.info('Creating report.....');
        # logger.info("Report data: %s",json.dumps(request.data))

        serializer = ser.CreateReportSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Data after validation
        data = serializer.validated_data

        try:
            with transaction.atomic():
                procedure = None
                # Check if 'procedure_id' exists
                if 'procedure_id' in data and data['procedure_id']:
                    procedure = Procedure.objects.get(pk=data['procedure_id'])
                
                if not updatedBy:
                    updatedBy = data['radiologist_id']

                report_new = Report.objects.create(
                    accession_no=data['accession_no'],
                    study_iuid=data['study_iuid'],
                    findings=data['findings'],
                    conclusion=data['conclusion'],
                    scan_protocol=data['scan_protocol'],

                    status=data['status'],
                   
                    radiologist = Doctor.objects.get(pk=data['radiologist_id']),
                    procedure = procedure,

                    created_by = updatedBy 
                )

                # Persist db
                report_new.save()

                # Update study_iuid to procedure
                procedure.study_iuid = data['study_iuid']
                if data['status'] == 'D':
                    procedure.status = 'IP' #Ingrogess
                else:   
                    procedure.status = 'CM' # Completed - reported

                procedure.updated_at = timezone.now()
                procedure.updated_by = updatedBy
                procedure.save()

                #return self.cus_response_created()
                # Get latest report
                if api_version == 'v2':
                    # A new json structure
                    return self._get_worklist_by_procid(pk = procedure.id)
                else:
                    return self.get_report_by_id(request, report_new.id)
            

        except Exception as e:
            logger.error(e, exc_info=True)
            code = ec.E_SYSTEM
            msg = str(e)

            if 'duplicate key value' in str(e):
                code = ec.E_RECORD_EXISTS
                msg = 'The report already exists. '+str(e)

            return self.response_NG(code, msg)
    

class ReportDetailView(ReportBaseView, WorklistBaseView):
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
        api_version = request.META.get('HTTP_X_API_VERSION')
        if api_version != "X":  
            user = request.user
            is_per = CheckPermission(per_code.EDIT_REPORT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.EDIT_REPORT)
            
            updatedBy = user.id
                    
        try:
            logger.info('Updating report.....');

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

                # Update study data for procdure
                proc = report.procedure
                if data['status'] == 'D':
                    proc.status = 'IP' #Ingrogess
                else:
                    proc.status = 'CM' # Completed - reported

                proc.updated_by = "3e3d4643-afc8-4926-98d5-fbef871ff887" # Admin user
                proc.updated_at = timezone.now()
                proc.save()                    

                logger.info('Updated the Procedure table with id: %s',proc.id)

                #return self.cus_response_updated()
            # Get latest report
                if api_version == 'v2':
                    # A new json structure
                    return self._get_worklist_by_procid(pk = proc.id)
                else:
                    return self.get_report_by_id(request, report.id)

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))


    @swagger_auto_schema(
        operation_summary='Delete the report by Id',
        operation_description='Delete the report by Id',
        tags=[swagger_tags.REPORT],
    )

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
            return self.response_NG(ec.E_SYSTEM, str(e))
        
        return self.cus_response_deleted()
    
class ReportByProcedureId(ReportBaseView):
    queryset = User.objects.all()
    #authentication_classes = ()

    """
    Get a report
    kwargs = accession_no and procedure_code
    """
    @swagger_auto_schema(
        operation_summary='Report Detail By Procdure Id',
        operation_description='Report Detail By Procdure Id',
        tags=[swagger_tags.REPORT],
    )
    def get(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_REPORT)

                # Get latest report        
        return self.get_report_by_id(request, proc_id=kwargs['proc_id'])
   
        
    
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
            return self.response_NG(ec.E_SYSTEM, str(e))
        
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
            return self.response_NG(ec.E_SYSTEM, str(e))     
        

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
            return self.response_NG(ec.E_SYSTEM, str(e))
        
    def _get_report_template_by_id(self, pk):
        try:
            item = ReportTemplate.objects.get(pk=pk)
            if item is None:
                return self.cus_response_empty_data('REPORT')
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))
        
        data = {'id': item.id,
                    'name':item.name,
                    'type':item.type,
                    'findings':item.findings,
                    'conclusion':item.conclusion
                }
        
        return self.response_success(data=data) 
    
   