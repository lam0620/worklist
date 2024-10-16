import logging

from django.utils import timezone

from drf_yasg.utils import swagger_auto_schema
from django.db import transaction

from library.constant import error_codes as ec
from library.constant import module_code as module_code
from library.constant import permission_code as per_code
from library.constant import swagger_tags

from apps.account.permission import CheckPermission

from apps.report.patient_base_view import PatientBaseView
from apps.report import serializers as ser
from apps.report.models import (
    Patient
)


logger = logging.getLogger(__name__)



    
"""
Patient view class
"""   
class PatientView(PatientBaseView):
    queryset = Patient.objects.all()
    # uncomment if no need to check permission 
    # authentication_classes = ()

    # for search box (?search=xxx). which you want to search. 
    search_fields = ['fullname', 'pid']
    # for query string (?type=xxx)
    # filter_fields = ['type', 'user_id', 'is_active']

    """
    Get patients
    """
    @swagger_auto_schema(
        operation_summary='Get patients',
        operation_description='Get patients',
        tags=[swagger_tags.REPORT_PATIENT],
    )
    def get(self, request, *args, **kwargs):
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_PATIENT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_PATIENT)

        data= {}
        try:
            patients = self.filter_queryset(self.get_queryset())

            data = [{'id': item.id,
                     'pid':item.pid,
                     'fullname':item.fullname,
                     'gender':item.gender,
                     'dob':item.dob,
                     'address':item.address,
                     'tel':item.tel,
                     'insurance_no':item.insurance_no} for item in patients]

                        
        except Patient.DoesNotExist:
            return self.cus_response_empty_data(ec.REPORT)
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        # return self.response_success(data=data)
        page = self.paginate_queryset(data)
        return self.get_paginated_response(page)    
    
    

class PatientDetailView(PatientBaseView):
    queryset = Patient.objects.all()
    # uncomment if no need to check permission 
    # authentication_classes = ()

    """
    Get a patient
    kwargs = pk
    """
    @swagger_auto_schema(
        operation_summary='Get patient by Id',
        operation_description='Get patient by Id',
        tags=[swagger_tags.REPORT_PATIENT],
    )
    def get(self, request, *args, **kwargs):
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_PATIENT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_PATIENT)
                    
        # Get latest Patient
        return self.get_patient_by_id(kwargs['pk'])

    @swagger_auto_schema(
        operation_summary='Update the patient by id',
        operation_description='Update the patient by id',
        request_body=ser.UpdatePatientSerializers,
        tags=[swagger_tags.REPORT_PATIENT],
    )
    def put(self, request, *args, **kwargs):
        updatedBy = None
        # Get and check version to secure or not        
        if request.META.get('HTTP_X_API_VERSION') != "X":          
            user = request.user   
            is_per = CheckPermission(per_code.EDIT_PATIENT, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.EDIT_PATIENT)
            updatedBy = user.id
            

        patient = Patient.objects.get(**kwargs)
        if not patient:
            return self.cus_response_empty_data()

        serializer = ser.UpdatePatientSerializers(data=request.data, instance=patient)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        try:
            with transaction.atomic():
                for key, value in data.items():
                    setattr(patient, key, value)

                patient.updated_by = updatedBy
                patient.updated_at = timezone.now()
                patient.save()
                
                #return self.cus_response_updated()
            # Get latest patient
            return self.get_patient_by_id(patient.id)

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))

