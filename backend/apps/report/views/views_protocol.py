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

from apps.report import serializers as ser
from apps.report.models import (
    ScanProtocol,
)

logger = logging.getLogger(__name__)

       
    
"""
Scan Protocol view class
"""   
class ScanProtocolView(CustomAPIView):
    queryset = ScanProtocol.objects.all()
    # uncomment if no need to check permission 
    # authentication_classes = ()

    # for search box (?search=xxx). which you want to search. 
    search_fields = ['name']
    # for query string (?type=xxx)
    filter_fields = ['modality']

    """
    Get Scan Protocols
    kwargs = accession_no and procedure_code
    """
    @swagger_auto_schema(
        operation_summary='Get Scan Protocols',
        operation_description='Get Scan Protocols',
        tags=[swagger_tags.REPORT_SCAN_PROTOCOL],
    )
    def get(self, request, *args, **kwargs):
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_REPORT)

        data= {}
        try:
            protocols = self.filter_queryset(self.get_queryset())
            data = [{'id': item.id,
                     'name':item.name,
                     'regular':item.regular,
                     'by_medicine':item.by_medicine,
                     'by_disease':item.by_disease,
                     'modality':item.modality} for item in protocols]
            
        except ScanProtocol.DoesNotExist:
            return self.cus_response_empty_data()
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))
        
        if len(data) == 0:
            return self.cus_response_empty_data()
        
        return self.response_success(data=data)
    
    """
    Create new a protocol
    """
    @swagger_auto_schema(
        operation_summary='Create new a protocol',
        operation_description='Create new a protocol',
        request_body=ser.CreateScanProtocolSerializers,
        tags=[swagger_tags.REPORT_SCAN_PROTOCOL],
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

        serializer = ser.CreateScanProtocolSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Data after validation
        data = serializer.validated_data

        try:
            with transaction.atomic():
               
                item = ScanProtocol.objects.create(
                    name=data['name'],
                    regular=data['regular'],
                    by_medicine=data['by_medicine'],
                    by_disease=data['by_disease'],
                    modality=data['modality'],
                    created_by = updatedBy
                )

                # Persist db
                item.save()

                data = {'id': item.id}
                return self.cus_response_created(data)

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))     
        

class ScanProtocolDetailView(CustomAPIView):
    #queryset = ScanProtocol.objects.all()
    # uncomment if no need to check permission 
    # authentication_classes = ()

    """
    Get a ScanProtocol
    kwargs = study_iuid
    """
    @swagger_auto_schema(
        operation_summary='Get Detail ScanProtocol by Id',
        operation_description='Get Detail ScanProtocol by Id',
        tags=[swagger_tags.REPORT_SCAN_PROTOCOL],
    )
    def get(self, request, *args, **kwargs):
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_REPORT)
                    
        # Get latest report        
        return self._get_protocol_by_id(kwargs['pk'])

    @swagger_auto_schema(
        operation_summary='Update the scan protocol by id',
        operation_description='Update the scan protocol by id',
        request_body=ser.UpdateScanProtocolSerializers,
        tags=[swagger_tags.REPORT_SCAN_PROTOCOL],
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
            report = ScanProtocol.objects.get(**kwargs, delete_flag = False)
            if not report:
                return self.cus_response_empty_data(ec.REPORT)

            serializer = ser.UpdateScanProtocolSerializers(data=request.data, instance=report)
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
            return self._get_protocol_by_id(report.id)

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))
        
    def _get_protocol_by_id(self, pk):
        try:
            item = ScanProtocol.objects.get(pk=pk)
            if item is None:
                return self.cus_response_empty_data('REPORT')
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))
        
        data = {'id': item.id,
                    'name':item.name,
                    'regular':item.regular,
                    'by_medicine':item.by_medicine,
                    'by_disease':item.by_disease,
                    'modality':item.modality
                }
        
        return self.response_success(data=data) 
    
   