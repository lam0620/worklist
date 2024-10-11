import re

from rest_framework import serializers

from apps.account.models import User, Role, Permission
from library.constant import error_codes as ec

EMAIL_REGEX = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"


class LoginSerializers(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True)


class CreateAccountSerializers(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.CharField(required=False, allow_blank=True)
    roles = serializers.ListField(child=serializers.UUIDField(required=False), required=False)

    def validate_username(self, value): # noqa
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError({'detail': ec.USERNAME_EXISTS, 'item': ec.USERNAME})
        return value

    def validate_email(self, value): # noqa
        if not value:
            return None
        if value and re.match(EMAIL_REGEX, value) is None:
            raise serializers.ValidationError({'detail': ec.EMAIL_INVALID})
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError({'detail': ec.USERNAME_EXISTS, 'item': ec.EMAIL})
        return value

    def validate_roles(self, value): # noqa
        if not Role.objects.filter(id__in=value).exists():
            raise serializers.ValidationError({'detail': ec.NOT_FOUND_CODE[ec.GROUP], 'item': ec.GROUP})
        return value


class UpdateAccountSerializers(serializers.Serializer):
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    roles = serializers.ListField(child=serializers.UUIDField(required=False), required=False)

    def validate_email(self, value):
        if not value:
            return None

        if re.match(EMAIL_REGEX, value) is None:
            raise serializers.ValidationError({'detail': ec.EMAIL_INVALID})
        if User.objects.filter(email=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError({'detail': ec.ERROR_CODE_MESSAGE[ec.FIELDS_EXISTS], 
                                               'item': ec.EMAIL,
                                               'detail':"'"+ value+"' already exists"})
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


class ResetPasswordSerializers(serializers.Serializer):
    user_id = serializers.UUIDField(required=True)
    password = serializers.CharField(required=True)
    