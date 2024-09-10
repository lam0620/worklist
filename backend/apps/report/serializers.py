from rest_framework import serializers

from library.constant import error_codes as ec

from apps.report.utils import is_valid_gender,is_valid_modality_type, \
                is_valid_report_template_type, is_valid,convert_str_to_datetime


"""
HIS PACS integration serializers
"""
class CreatePatientSerializers(serializers.Serializer):
    pid = serializers.CharField(required=True)
    fullname = serializers.CharField(required=True)
    dob = serializers.CharField(required=True)

    gender = serializers.CharField(required=True)

    # allow_blank=True to prevent error "is required"
    address = serializers.CharField(required=False, allow_blank=True)
    tel = serializers.CharField(required=False, allow_blank=True)
    insurance_no = serializers.CharField(required=False, allow_blank=True)

    def validate_gender(self, value): # noqa
        if not is_valid_gender(value):
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'gender',
                                               'detail':"'"+ value+"' is invalid"})
        
class CreateProcedureTypeSerializers(serializers.Serializer):
    code = serializers.CharField(required=True)
    name = serializers.CharField(required=True)

class GetOrderSerializers(serializers.Serializer):
    accession = serializers.CharField(required=False)

    
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
    order_no = serializers.CharField(required=True)    

    is_insurance_applied = serializers.BooleanField(required=True)
    is_urgent = serializers.BooleanField(required=True)
    
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
        if not is_valid(value, ['I','O', 'U']):
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
class GetReportSerializers(serializers.Serializer):
    study_iuid = serializers.CharField(required=True)

class CreateReportSerializers(serializers.Serializer):
    accession_no = serializers.CharField(required=True)
    study_iuid = serializers.CharField(required=True)
    findings = serializers.CharField(required=True)
    conclusion = serializers.CharField(required=True)
    status = serializers.CharField(required=True)
    
    radiologist_id = serializers.CharField(required=True)
    # Report by studyInstanceUid case/no mwl => no procedure need
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
    fullname = serializers.CharField(required=True)
    type = serializers.CharField(required=True)

    user_id = serializers.CharField(required=False, allow_blank=True)
    doctor_no = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.CharField(required=False)
    title = serializers.CharField(required=False, allow_blank=True)
    # sign = image's file name
    sign = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=True)

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

class UpdateDoctorSerializers(serializers.Serializer):
    fullname = serializers.CharField(required=True)
    type = serializers.CharField(required=True)
    doctor_no = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.CharField(required=False)
    user_id = serializers.CharField(required=False, allow_blank=True)
    sign = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=True)

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
        
# class GetDoctorSerializers(serializers.Serializer):
#     user_id = serializers.CharField(required=False)
#     type = serializers.CharField(required=False)

class GetImageLinkSerializers(serializers.Serializer):
    accession = serializers.CharField(required=True)

class GetReportTemplateSerializers(serializers.Serializer):
    modality = serializers.CharField(required=True)


class CreateReportTemplateSerializers(serializers.Serializer):
    name = serializers.CharField(required=True)
    findings = serializers.CharField(required=True)
    conclusion = serializers.CharField(required=True)

    type = serializers.CharField(required=True)
    modality = serializers.CharField(required=True)

    def validate_modality(self, value): # noqa
        if not is_valid_modality_type(value):
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'modality',
                                               'detail':"'"+ value+"' is invalid"})
        return value
    
    def validate_type(self, value): # noqa
        if not is_valid_report_template_type(value):
            raise serializers.ValidationError({'code': ec.INVALID, 
                                               'item': 'type',
                                               'detail':"'"+ value+"' is invalid"})
        return value
    
class UpdateReportTemplateSerializers(serializers.Serializer):
    findings = serializers.CharField(required=True)
    conclusion = serializers.CharField(required=True)