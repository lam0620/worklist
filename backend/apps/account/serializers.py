import re

from rest_framework import serializers

from apps.account.models import User, Role, Permission
from library.constant import error_codes as ec

from apps.account.utils import is_valid_gender,is_valid_modality_type,is_valid,convert_str_to_datetime
EMAIL_REGEX = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"


class LoginSerializers(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True)


class CreateAccountSerializers(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.CharField(required=True)
    roles = serializers.ListField(child=serializers.UUIDField(required=False), required=False)

    def validate_username(self, value): # noqa
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError({'detail': ec.USERNAME_EXISTS, 'item': ec.USERNAME})
        return value

    def validate_email(self, value): # noqa
        if re.match(EMAIL_REGEX, value) is None:
            raise serializers.ValidationError({'detail': ec.EMAIL_INVALID})
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError({'detail': ec.USERNAME_EXISTS, 'item': ec.EMAIL})
        return value

    def validate_roles(self, value): # noqa
        if not Role.objects.filter(id__in=value).exists():
            raise serializers.ValidationError({'detail': ec.NOT_FOUND_CODE[ec.GROUP], 'item': ec.GROUP})
        return value


class UpdateAccountSerializers(serializers.Serializer):
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.CharField(required=False)
    roles = serializers.ListField(child=serializers.UUIDField(required=False), required=False)

    def validate_email(self, value):
        if re.match(EMAIL_REGEX, value) is None:
            raise serializers.ValidationError({'detail': ec.EMAIL_INVALID})
        if User.objects.filter(email=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError({'detail': ec.ERROR_CODE_MESSAGE[ec.FIELDS_EXISTS], 'item': ec.EMAIL})
        return value
    
    def validate_roles(self, value): # noqa
        if not Role.objects.filter(id__in=value).exists():
            raise serializers.ValidationError({'detail': ec.NOT_FOUND_CODE[ec.GROUP], 'item': ec.GROUP})
        return value


class UpdateAccountAdminSerializers(serializers.Serializer):
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)


class ChangePasswordSerializers(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'detail': ec.PASSWORD_NOT_MATCH})
        return data


class CreateAccountGroup(serializers.Serializer):
    name = serializers.CharField(required=True)
    permissions = serializers.ListField(child=serializers.UUIDField(required=False), required=False)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_name(self, value): # noqa
        if Role.objects.filter(name=value).exists():
            raise serializers.ValidationError({'detail': ec.ERROR_CODE_MESSAGE[ec.GROUP_NAME_EXISTS], 'item': ec.GROUP_NAME})
        return value

    def validate_permissions(self, value): # noqa
        if not Permission.objects.filter(id__in=value).exists():
            raise serializers.ValidationError({'detail': ec.NOT_FOUND_CODE[ec.PERMISSION], 'item': ec.PERMISSION})
        return value


class UpdateAccountGroup(serializers.Serializer):
    name = serializers.CharField(required=False)
    permissions = serializers.ListField(child=serializers.UUIDField(required=False), required=False)
    users = serializers.ListField(child=serializers.UUIDField(required=False), required=False)

    def validate_users(self, value): # noqa
        if not User.objects.filter(id__in=value).exists():
            raise serializers.ValidationError({'detail': ec.NOT_FOUND_CODE[ec.USER], 'item': ec.USER})
        return value

    def validate_permissions(self, value):  # noqa
        if not Permission.objects.filter(id__in=value).exists():
            raise serializers.ValidationError({'detail': ec.NOT_FOUND_CODE[ec.PERMISSION], 'item': ec.PERMISSION})
        return value
    
    def validate_name(self, value):
        if Role.objects.filter(name=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError({'detail': ec.ERROR_CODE_MESSAGE[ec.GROUP_NAME_EXISTS], 'item': ec.GROUP})
        return value


class CodePermissionSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    code = serializers.CharField(required=True)


class DeleteAccountGroup(serializers.Serializer):
    ids_group = serializers.ListField(child=serializers.UUIDField(required=True), required=True)

    def validate_ids_group(self, value):
        if not Role.objects.filter(id__in=value).exists():
            raise serializers.ValidationError({'detail': ec.NOT_FOUND_CODE[ec.GROUP], 'item': ec.GROUP})
        return value

class DeleteAccount(serializers.Serializer):
    ids_user = serializers.ListField(child=serializers.UUIDField(required=True), required=True)

    def validate_ids_account(self, value):
        if not User.objects.filter(id__in=value).exists():
            raise serializers.ValidationError({'detail': ec.NOT_FOUND_CODE[ec.USER], 'item': ec.USER})
        return value
    
class RefreshTokenSerializers(serializers.Serializer):
    refresh_token = serializers.CharField(required=True)

"""
HIS PACS integration serializers
"""
class CreatePatientSerializers(serializers.Serializer):
    pid = serializers.CharField(required=True)
    fullname = serializers.CharField(required=True)
    gender = serializers.CharField(required=True)
    dob = serializers.CharField(required=True)

    address = serializers.CharField(required=False)
    insurance_no = serializers.CharField(required=False)

    def validate_gender(self, value): # noqa
        if not is_valid_gender(value):
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'gender',
                                               'detail':"'"+ value+"' is invalid"})
        
class CreateProcedureTypeSerializers(serializers.Serializer):
    code = serializers.CharField(required=True)
    name = serializers.CharField(required=True)

class CreateOrderSerializers(serializers.Serializer):
    accession_no = serializers.CharField(required=True)
    req_dept_code = serializers.CharField(required=True)
    req_dept_name = serializers.CharField(required=True)
    referring_phys_code = serializers.CharField(required=True)
    referring_phys_name = serializers.CharField(required=True)
    clinical_diagnosis = serializers.CharField(required=True)
    patient_class = serializers.CharField(required=True)
    # order_time = serializers.DateTimeField(required=True)
    order_time = serializers.CharField(required=True)
    modality_type = serializers.CharField(required=True)
    order_no = serializers.CharField(required=False)
    
    is_insurance_applied = serializers.BooleanField(required=False)
    is_urgent = serializers.BooleanField(required=False)
    
    procedures = serializers.ListField(child=CreateProcedureTypeSerializers(), required=True)
    patient = CreatePatientSerializers(required=False)


    def validate_order_time(self, value): # noqa
        try:
            new_value = convert_str_to_datetime(value)
        except:    
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'order_time',
                                               'detail':"'"+ value+"' is invalid"})            
        return new_value
    
    def validate_patient_class(self, value): # noqa
        if not is_valid(value, ['I','O']):
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'patient_class',
                                               'detail':"'"+ value+"' is invalid"})
        return value

    def validate_modality_type(self, value): # noqa
        if not is_valid_modality_type(value):
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'modality_type',
                                               'detail':"'"+ value+"' is invalid"})
        return value
    
 
    # def validate(self, data): # noqa
    #     if data['dob']:
            
class CreateReportSerializers(serializers.Serializer):
    accession_no = serializers.CharField(required=True)
    study_iuid = serializers.CharField(required=True)
    findings = serializers.CharField(required=True)
    conclusion = serializers.CharField(required=True)
    status = serializers.CharField(required=True)
    
    radiologist_id = serializers.CharField(required=True)
    procedure_id = serializers.CharField(required=False)

    def validate_status(self, value): # noqa
        if not is_valid(value, ['D','F']):
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'status',
                                               'detail':"'"+ value+"' is invalid"})
        return value
    

    def validate(self, data):
        if not data['findings'] or not data['conclusion']:
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'findings or conclusion',
                                               'detail':"'findings' or 'conclusion' is empty"})
        return data

class UpdateReportSerializers(serializers.Serializer):
    findings = serializers.CharField(required=True)
    conclusion = serializers.CharField(required=True)
    status = serializers.CharField(required=True)
    
    # radiologist_id = serializers.CharField(required=True)

    def validate_status(self, value): # noqa
        if not is_valid(value, ['D','F', 'C']):
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'status',
                                               'detail':"'"+ value+"' is invalid"})
        return value
    

    def validate(self, data):
        if not data['findings'] or not data['conclusion']:
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'findings or conclusion',
                                               'detail':"'findings' or 'conclusion' is empty"})
        return data

class CreateDoctorSerializers(serializers.Serializer):
    doctor_no = serializers.CharField(required=True)
    fullname = serializers.CharField(required=True)
    gender = serializers.CharField(required=True)
    type = serializers.CharField(required=True)

    def validate_type(self, value): # noqa
        if not is_valid(value, ['P','R']):
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'type',
                                               'detail':"'"+ value+"' is invalid"})
        return value

    def validate_gender(self, value): # noqa
        if not is_valid_gender(value):
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'gender',
                                               'detail':"'"+ value+"' is invalid"})
