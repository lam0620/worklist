import json
import logging

from django.utils import timezone

from django.db import transaction,connections
from drf_yasg.utils import swagger_auto_schema

from rest_framework.parsers import MultiPartParser,JSONParser
from rest_framework.decorators import parser_classes

from library.constant import error_codes as ec
from library.constant import module_code as module_code
from library.constant import permission_code as per_code
from library.constant import swagger_tags

from apps.account.permission import CheckPermission

from apps.report.doctor_base_view import DoctorBaseView
from apps.report import serializers as ser
from apps.report.models import (
    Doctor, User
)

from apps.report.utils import  get_image_field_str,get_username

logger = logging.getLogger(__name__)


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
