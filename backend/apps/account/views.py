from datetime import timedelta
import logging
import random

from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from django.conf import settings
from django.contrib.auth.hashers import check_password
from django.db import transaction,connections
from drf_yasg.utils import swagger_auto_schema
from rest_framework.views import APIView
from third_parties.contribution.api_view import CustomAPIView
from django.db.models import F, Prefetch
from drf_yasg import openapi

from apps.account import serializers as ser
from apps.account.models import (
    Doctor, Report, User, RolePermission, Role,
    UserRole, Permission,
    Order,Patient,Procedure,ProcedureType
)
from apps.account.permission import CheckPermission
from apps.account.utils import  convert_return_data_format, convert_str_to_datetime,get_image_link
from apps.shared.services import get_account_permissions, get_account_roles
from apps.shared.utils import CusResponse
from library.constant import error_codes as ec
from library.constant import module_code as module_code
from library.constant import permission_code as per_code
from library.constant import swagger_tags
from rest_framework import serializers, status

logger = logging.getLogger(__name__)


class StatusCheck(APIView):

    @swagger_auto_schema(
        operation_summary='Kiểm tra trạng thái',
        operation_description='Kiểm tra trạng thái',
        tags=[swagger_tags.STATUS],
    )
    def get(self, request):
        return CusResponse({
            'status': status.HTTP_200_OK,
            'detail': 'success'
        }, status=status.HTTP_200_OK)


class AuthRefreshToken(APIView):

    @swagger_auto_schema(
        operation_summary='Làm mới token',
        operation_description='Làm mới token',
        request_body=ser.RefreshTokenSerializers,
        tags=[swagger_tags.AUTH],
    )
    def post(self, request):
        serializer = ser.RefreshTokenSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        refresh_token = validated_data.get('refresh_token')

        try:
            refresh = RefreshToken(refresh_token)
            access_token = refresh.access_token
            access_token.set_exp(lifetime=timedelta(days=settings.ACCESS_TOKEN_LIFETIME))
            access_token.set_iat()
            
            refresh.set_exp(lifetime=timedelta(days=settings.REFRESH_TOKEN_LIFETIME))
            refresh.set_iat()
            return CusResponse(convert_return_data_format(code="", error=False, data={
                'access_token': str(access_token),
                'refresh_token': str(refresh)
            }), status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(e, exc_info=True)
            return CusResponse(convert_return_data_format(code=ec.SERVER_ERROR, error=True, data={}),
                               status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AuthLogin(APIView):
    @swagger_auto_schema(
        operation_summary='Đăng nhập',
        operation_description='Đăng nhập tài khoản',
        request_body=ser.LoginSerializers,
        tags=[swagger_tags.AUTH],
    )
    def post(self, request):
        serializer = ser.LoginSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        username = validated_data.get('username')
        password = validated_data.get('password')

        user = User.objects.filter(username=username, is_active=True).first()
        with transaction.atomic():
            if not user:
                data = convert_return_data_format(code=ec.USER_NAME_PASSWORD_NOT_MATCH, error=True, data={})
                return CusResponse(data, status=status.HTTP_400_BAD_REQUEST)
            if not self.authenticate_login(user, password):
                data = convert_return_data_format(code=ec.USER_NAME_PASSWORD_NOT_MATCH, error=True, data={})
                return CusResponse(data, status=status.HTTP_400_BAD_REQUEST)

            token = self.generator_token(user)
            user.last_login = timezone.now()
            user.save()
            return CusResponse(convert_return_data_format(code="", error=False, data=token), status=status.HTTP_200_OK)


    @staticmethod
    def authenticate_login(user, password):
        if check_password(password, user.password):
            return True
        return False

    @staticmethod
    def generator_token(user):

        access_token_lifetime = timedelta(days=settings.ACCESS_TOKEN_LIFETIME)
        refresh_token_lifetime = timedelta(days=settings.REFRESH_TOKEN_LIFETIME)

        access_token = AccessToken.for_user(user)
        access_token.set_exp(lifetime= access_token_lifetime)

        refresh_token = RefreshToken.for_user(user)
        refresh_token.set_exp(lifetime= refresh_token_lifetime)

        return {
            'access_token': str(access_token),
            'refresh_token': str(refresh_token),
        }


class AccountUser(CustomAPIView):
    queryset = User.objects.all()

    @swagger_auto_schema(
        operation_summary='Lấy thông tin tài khoản đang đăng nhập',
        operation_description='Lấy thông tin tài khoản đang đăng nhập',
        tags=[swagger_tags.ADMIN],
    )
    def get(self, request):
        user = request.user
        permission_list = get_account_permissions(user.id)
        roles_list = get_account_roles(user.id)
        return self.cus_response({
            'result': {
                'code': '',
                'status': 'ok',
                'msg': ''
            },
            'data': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'username': user.username,
                'email': user.email,
                'avatar_color': user.avatar_color,
                'permissions': permission_list,
                'is_superuser': user.is_superuser,
                'roles': roles_list
            }
        }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary='Cập nhật thông tin tài khoản đang đăng nhập',
        operation_description='Cập nhật thông tin tài khoản đang đăng nhập',
        request_body=ser.UpdateAccountAdminSerializers,
        tags=[swagger_tags.ADMIN],
    )
    def put(self, request):
        user = request.user
        serializer = ser.UpdateAccountAdminSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        instance = User.objects.filter(id=user.id).first()
        for key, value in data.items():
            setattr(instance, key, value)
        instance.updated_by = user.id
        instance.save()

        return self.cus_response_updated()


class AccountView(CustomAPIView):
    queryset = User.objects.all()

    search_fields = ['username', 'email', 'first_name', 'last_name']

    filter_fields = ['username', 'email', 'first_name', 'last_name']


    @swagger_auto_schema(
        operation_summary='Lấy thông tin chi tiết tài khoản',
        operation_description='Lấy thông tin chi tiết tài khoản',
        tags=[swagger_tags.ADMIN],
    )
    def get(self, request, *args, **kwargs):
        user = request.user
        is_per = CheckPermission(per_code.VIEW_ACCOUNT, user.id).check()
        if not is_per and not user.is_superuser:
            return self.cus_response_403()

        user_roles_prefetch = Prefetch(
            'userrole_set',
            queryset=UserRole.objects.select_related('role'),
            to_attr='roles_list'
        )
        queryset = self.filter_queryset(User.objects.prefetch_related(user_roles_prefetch))
        users_data = []
        for user in queryset:
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar_color': user.avatar_color,
                'created_at': user.created_at,
                'roles': [{'id': role.role.id, 'name': role.role.name} for role in user.roles_list]
            }
            users_data.append(user_data)

        page = self.paginate_queryset(users_data)
        return self.get_paginated_response(page)

    @swagger_auto_schema(
        operation_summary='Tạo tài khoản user',
        operation_description='Tạo tài khoản user',
        request_body=ser.CreateAccountSerializers,
        tags=[swagger_tags.ADMIN],
    )
    def post(self, request):
        user = request.user
        is_per = CheckPermission(per_code.ADD_ACCOUNT, user.id).check()
        if not is_per and not user.is_superuser:
            return self.cus_response_403()

        serializer = ser.CreateAccountSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        avatar_color = random.choice(settings.AVATAR_COLORS)

        try:
            with transaction.atomic():
                user_new = User.objects.create(
                    email=data['email'],
                    username=data['username'],
                    first_name=data['first_name'],
                    last_name=data['last_name'],
                    avatar_color=avatar_color,
                    created_by=user.id
                )

                user_new.set_password(data['password'])
                user_new.save()
                if data.get('roles'):
                    UserRole.objects.bulk_create([
                        UserRole(
                            user=user_new,
                            role_id=item
                        ) for item in data['roles']
                    ])


                return self.cus_response_created()

        except Exception as e:
            logger.error(e, exc_info=True)
        return self.cus_response_500()
    
    @swagger_auto_schema(
        operation_summary="Xóa tài khoản",
        operation_description='Xóa tài khoản',
        request_body=ser.DeleteAccount,
        tags=[swagger_tags.ADMIN],
    )
    def delete(self, request):
        user = request.user
        is_per = CheckPermission(per_code.DELETE_ACCOUNT, user.id).check()
        if not is_per and not user.is_superuser:
            return self.cus_response_403()

        serializers = ser.DeleteAccount(data=request.data)
        serializers.is_valid(raise_exception=True)
        data = serializers.validated_data

        try:
            with transaction.atomic():
                User.objects.filter(id__in=data['ids_user']).exclude(is_superuser=True).update(delete_flag=True, updated_by=user.id)
            return self.cus_response_deleted()
        except Exception as e:
            logger.error(e, exc_info=True)
        return self.cus_response_500()


class AccountDetailView(CustomAPIView):
    queryset = User.objects.all()

    @swagger_auto_schema(
        operation_summary='Lấy thông tin chi tiết tài khoản',
        operation_description='Lấy thông tin chi tiết tài khoản',
        tags=[swagger_tags.ADMIN],
    )
    def get(self, request, *args, **kwargs):
        user = request.user
        if not (CheckPermission(per_code.VIEW_ACCOUNT, user.id).check() or user.is_superuser):
            return self.cus_response_403()
        user_prefetch = Prefetch(
            'userrole_set',
            queryset=UserRole.objects.select_related('role').all(),
            to_attr='prefetched_roles'
        )
        try:
            instance = User.objects.prefetch_related(user_prefetch).get(**kwargs)
        except User.DoesNotExist:
            return self.cus_response_404(ec.USER)
        
        roles = [{'id': role.role.id, 'name': role.role.name} for role in instance.prefetched_roles]
        data = {
            'id': instance.id,
            'username': instance.username,
            'email': instance.email,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'avatar_color': instance.avatar_color,
            'created_at': instance.created_at,
            'roles': list(roles)
        }

        return self.response_success(data=data)

    @swagger_auto_schema(
        operation_summary='Cập nhật chi tiết tài khoản',
        operation_description='Cập nhật chi tiết tài khoản',
        request_body=ser.UpdateAccountSerializers,
        tags=[swagger_tags.ADMIN],
    )
    def put(self, request, *args, **kwargs):
        user = request.user
        is_per = CheckPermission(per_code.EDIT_ACCOUNT, user.id).check()
        if not is_per and not user.is_superuser:
            return self.cus_response_403()

        instance = User.objects.filter(**kwargs).first()
        if not instance:
            return self.cus_response_404(ec.USER)

        serializer = ser.UpdateAccountSerializers(data=request.data, instance=instance)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        roles = data.pop('roles', [])

        try:
            with transaction.atomic():
                for key, value in data.items():
                    setattr(instance, key, value)
                instance.updated_by = user.id
                instance.save()
                
                if roles:
                    UserRole.objects.filter(user_id=instance.id).delete()
                    UserRole.objects.bulk_create([
                        UserRole(
                            user=instance,
                            role_id=item
                        ) for item in roles
                    ])

                return self.cus_response_updated()

        except Exception as e:
            logger.error(e, exc_info=True)
        return self.cus_response_500()

    @swagger_auto_schema(
        operation_summary='Xóa tài khoản admin',
        operation_description='Xóa tài khoản admin',
        tags=[swagger_tags.ADMIN],
    )
    def delete(self, request, *args, **kwargs):
        user = request.user
        is_per = CheckPermission(per_code.DELETE_ACCOUNT, user.id).check()
        if not is_per and not user.is_superuser:
            return self.cus_response_403()

        instance = User.objects.filter(**kwargs).first()
        if not instance:
            return self.cus_response_404(type=ec.USER)
        if instance.is_superuser:
            return self.cus_response({
                'result': {
                    'status': 'NG',
                    'code': ec.CANNOT_DELETE_SUPERUSER,
                    'msg': ''
                },
                'data': {}
            }, status=status.HTTP_200_OK)

        instance.delete_flag = True
        instance.updated_by = user.id
        instance.save()

        return self.cus_response_deleted()


class ChangePassword(CustomAPIView):
    queryset = User.objects.all()

    @swagger_auto_schema(
        operation_summary='Thay đổi mật khẩu',
        operation_description='Thay đổi mật khẩu tài khoản đang đăng nhập',
        request_body=ser.ChangePasswordSerializers,
        tags=[swagger_tags.AUTH],
    )
    def put(self, request, *args, **kwargs):
        user = request.user
        serializer = ser.ChangePasswordSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        instance = User.objects.filter(id=user.id).first()
        if 'old_password' in data:
            if not instance.check_password(data.get('old_password')): # noqa
                return self.cus_response(convert_return_data_format(code=ec.OLD_PASSWORD_INVALID, error=True, data={}),
                                         status=status.HTTP_400_BAD_REQUEST)
        instance.set_password(data.get('password'))
        instance.updated_by = user.id
        instance.save()

        return self.cus_response_updated()


class AdminRoleGroupView(CustomAPIView):
    queryset = Role.objects.all()

    search_fields = ['name']

    @swagger_auto_schema(
        operation_summary='Lấy danh sách nhóm quyền',
        operation_description='Lấy danh sách nhóm quyền',
        tags=[swagger_tags.ADMIN],
    )
    def get(self, request):
        user = request.user
        is_per = CheckPermission(per_code.VIEW_GROUP, user.id).check()

        if not is_per and not user.is_superuser:
            return self.cus_response_403()

        role_permissions_prefetch = Prefetch(
            'rolepermission_set',
            queryset=RolePermission.objects.select_related('permission').all(),
            to_attr='prefetched_permissions'
        )

        roles_with_permissions = self.filter_queryset(Role.objects.prefetch_related(role_permissions_prefetch))
        roles_data = []
        for role in roles_with_permissions:
            permissions = [{'id': perm.permission.id, 'name': perm.permission.name} for perm in role.prefetched_permissions]
            roles_data.append({
                'id': role.id,
                'name': role.name,
                'description': role.description,
                'created_at': role.created_at,
                'created_by': role.created_by,
                'permissions': permissions
            })

        page = self.paginate_queryset(roles_data)
        return self.get_paginated_response(page)

    @swagger_auto_schema(
        operation_summary='Tạo nhóm quyền',
        operation_description='Tạo nhóm quyền',
        request_body=ser.CreateAccountGroup,
        tags=[swagger_tags.ADMIN],
    )
    def post(self, request):
        user = request.user
        is_per = CheckPermission(per_code.ADD_GROUP, user.id).check()
        if not is_per and not user.is_superuser:
            return self.cus_response_403()

        serializers = ser.CreateAccountGroup(data=request.data) # noqa
        serializers.is_valid(raise_exception=True)
        data = serializers.validated_data

        try:
            with transaction.atomic():
                instance = Role.objects.create(
                    name=data['name'],
                    description=data.get('description', None),
                    created_by=user.id
                )
                permission_ids = data.get("permissions", [])
                permissions = Permission.objects.filter(id__in=permission_ids).in_bulk()
                group_per = [RolePermission(role=instance, permission_id=perm_id) for perm_id in permission_ids]
                permisson_info = [
                    {
                        'id': perm_id,
                        'name': permissions[perm_id].name,
                        'code': permissions[perm_id].code
                    }
                 for perm_id in permission_ids if perm_id in permission_ids
                ]
                RolePermission.objects.bulk_create(group_per)
                data = {
                    'id': instance.id,
                    'permissions': permisson_info,
                    'name': instance.name,
                    'created_at': instance.created_at.strftime(settings.DATETIME_FORMAT),
                    'created_by': instance.created_by
                }
                return self.cus_response_created(data=data)

        except Exception as e:
            logger.error(e, exc_info=True)
        return self.cus_response({
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR,
            'detail': status.HTTP_500_INTERNAL_SERVER_ERROR,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @swagger_auto_schema(
        operation_summary='Xóa nhóm quyền',
        operation_description='Xóa nhóm quyền',
        request_body= ser.DeleteAccountGroup,
        tags=[swagger_tags.ADMIN],
    )
    def delete(self, request):
        user = request.user
        is_per = CheckPermission(per_code.DELETE_GROUP, user.id).check()
        if not is_per and not user.is_superuser:
            return self.cus_response_403()

        serializers = ser.DeleteAccountGroup(data=request.data)
        serializers.is_valid(raise_exception=True)
        data = serializers.validated_data

        try:
            with transaction.atomic():
                Role.objects.filter(id__in=data['ids_group']).update(delete_flag=True, updated_by=user.id)
               
                return self.cus_response_deleted()
        except Exception as e:
            logger.error(e, exc_info=True)
        return self.cus_response_500()


class AdminRoleGroupDetailView(CustomAPIView):
    queryset = Role.objects.all()

    @swagger_auto_schema(
        operation_summary='Lấy chi tiết nhóm quyền',
        operation_description='Lấy chi tiết nhóm quyền',
        tags=[swagger_tags.ADMIN],
    )
    def get(self, request, *args, **kwargs):
        user = request.user
        is_per = CheckPermission(per_code.VIEW_GROUP, user.id).check()
        if not is_per and not user.is_superuser:
            return self.cus_response_403()

        instance = Role.objects.filter(**kwargs).values('id', 'name', 'description', 'created_at').first()

        if not instance:
            return self.cus_response_404(type=ec.GROUP)

        per_group = RolePermission.objects.filter(role_id=instance['id']).select_related('permission')
        user_group = UserRole.objects.filter(role_id=instance['id'], user__delete_flag=False).select_related('user')
        per_group_result = [{'id': item.permission.id, 'name': item.permission.name} for item in per_group]
        user_group_result = [
            {
                'id': item.user.id,
                'first_name': item.user.first_name,
                'last_name': item.user.last_name,
                'avatar_color': item.user.avatar_color,
                'username': item.user.username,
            } for item in user_group
        ]

        data = {
            'id': instance['id'],
            'name': instance['name'],
            'description': instance['description'],
            'created_at': instance['created_at'].strftime(settings.DATETIME_FORMAT),
            'permissions': per_group_result,
            'users': user_group_result,
        }
        res = {
            'result': {
                'code': '',
                'status': 'ok',
                'msg': ''
            },
            'data': data
        }
        return self.cus_response(data=res, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary='Cập nhật nhóm quyền',
        operation_description='Cập nhật nhóm quyền',
        request_body=ser.UpdateAccountGroup,
        tags=[swagger_tags.ADMIN],
    )
    def put(self, request, *args, **kwargs):
        user = request.user
        is_per = CheckPermission(per_code.EDIT_GROUP, user.id).check()
        if not is_per and not user.is_superuser:
            return self.cus_response_403()

        instance = Role.objects.filter(**kwargs).first()

        if not instance:
            return self.cus_response_404(type=ec.GROUP)

        serializer = ser.UpdateAccountGroup(data=request.data, instance=instance)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            with transaction.atomic():
                if data.get('name') and data.get('name') != instance.name:
                    instance.name = data['name']
                instance.updated_by = user.id
                instance.save()

                # handle group permission
                if 'permissions' in data:
                    new_group_perm = data['permissions']

                    old_group_perm = RolePermission.objects.filter(role_id=instance.id).values_list(
                        'permission__id', flat=True)

                    perm_ids_add = list(set(new_group_perm) - set(old_group_perm))
                    perm_ids_del = list(set(old_group_perm) - set(new_group_perm))
                    if perm_ids_add:
                        RolePermission.objects.bulk_create([RolePermission(
                            role=instance, permission_id=item
                        )
                            for item in perm_ids_add
                        ])
                    if perm_ids_del:
                        RolePermission.objects.filter(permission_id__in=perm_ids_del).delete()

                # Handle add user permission
                if 'users' in data:
                    new_user = data['users']
                    old_user = UserRole.objects.filter(role_id=instance.id).values_list('user__id',
                                                                                         flat=True)
                    user_ids_add = list(set(new_user) - set(old_user))
                    user_ids_del = list(set(old_user) - set(new_user))
                    if user_ids_add:
                        UserRole.objects.bulk_create([
                            UserRole(
                                role=instance, user_id=item
                            ) for item in user_ids_add
                        ])
                    if user_ids_del:
                        UserRole.objects.filter(user_id__in=user_ids_del).delete()
                

                return self.cus_response_updated()
        except Exception as e:
            logger.error(e, exc_info=True)
        return self.cus_response_500()

    @swagger_auto_schema(
        operation_summary='Xóa nhóm quyền',
        operation_description='Xóa nhóm quyền',
        tags=[swagger_tags.ADMIN],
    )
    def delete(self, request, *args, **kwargs):
        user = request.user
        is_per = CheckPermission(per_code.DELETE_GROUP, user.id).check()
        if not is_per and not user.is_superuser:
            return self.cus_response_403()

        instance = Role.objects.filter(**kwargs).first()

        if not instance:
            return self.cus_response_404(ec.GROUP)
        try:
            with transaction.atomic():
                instance.delete_flag = True
                instance.updated_by = user.id
                instance.save()

                return self.cus_response_deleted()
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.cus_response_500()


class CodePermissionView(CustomAPIView):
    queryset = Permission.objects.all()

    search_fields = ['name', 'code']

    @swagger_auto_schema(
        operation_summary='Lấy danh sách mã quyền',
        operation_description='Lấy danh sách mã quyền',
        tags=[swagger_tags.ADMIN],
    )
    def get(self, request):
        user = request.user
        is_per = CheckPermission(per_code.EDIT_GROUP, user.id).check()
        if not user.is_superuser and not is_per:
            return self.cus_response_403()
        query = self.filter_queryset(Permission.objects.values('id', 'name', 'code'))
        page = self.paginate_queryset(list(query))

        return self.get_paginated_response(page)

    @swagger_auto_schema(
        operation_summary='Tạo mã quyền',
        operation_description='Tạo mã quyền',
        request_body=ser.CodePermissionSerializer,
        tags=[swagger_tags.ADMIN],
    )
    def post(self, request):
        user = request.user
        is_per = CheckPermission(per_code.EDIT_GROUP, user.id).check()
        if not user.is_superuser and not is_per:
            return self.cus_response_403()
        serializers_data = ser.CodePermissionSerializer(data=request.data)
        serializers_data.is_valid(raise_exception=True)
        data = serializers_data.validated_data

        if Permission.objects.filter(code=data['code']).exists():
            raise serializers.ValidationError({'detail': ec.ERROR_CODE_MESSAGE[ec.CODE_HAS_EXISTS]})

        try:
            with transaction.atomic():
                Permission.objects.create(
                    name=data['name'],
                    code=data.get('code'),
                    created_by=user.id
                )
                return self.cus_response_created()

        except Exception as e:
            logger.error(e, exc_info=True)
        return self.cus_response_500()


class CodePermissionDetail(CustomAPIView):
    queryset = Permission.objects.all()

    @swagger_auto_schema(
        operation_summary='Chi tiết mã quyền',
        operation_description='Chi tiết mã quyền',
        tags=[swagger_tags.ADMIN],
    )
    def get(self, request, *args, **kwargs):
        user = request.user
        is_per = CheckPermission(per_code.EDIT_GROUP, user.id).check()
        if not user.is_superuser and not is_per:
            return self.cus_response_403()
        instance = Permission.objects.filter(**kwargs).values('id', 'name', 'code').first()
        if not instance:
            return self.cus_response_404(ec.PERMISSION)

        return self.response_success(data=instance)

    @swagger_auto_schema(
        operation_summary='Cập nhật mã quyền',
        operation_description='Cập nhật mã quyền',
        request_body=ser.CodePermissionSerializer,
        tags=[swagger_tags.ADMIN],
    )
    def put(self, request, *args, **kwargs):
        user = request.user
        is_per = CheckPermission(per_code.EDIT_GROUP, user.id).check()
        if not user.is_superuser :
            return self.cus_response_403()
        instance = Permission.objects.filter(**kwargs).first()

        if not instance:
            return self.cus_response_404(ec.PERMISSION)

        serializer_data = ser.CodePermissionSerializer(data=request.data)
        serializer_data.is_valid(raise_exception=True)
        data = serializer_data.validated_data

        if Permission.objects.filter(code=data['code']).exclude(id=instance.id).exists():
            return self.cus_response({
                'result': {
                    'status': 'NG',
                    'code': ec.ERROR_CODE_MESSAGE[ec.CODE_HAS_EXISTS],
                    'msg': ''
                },
                'data': {}
            }, status=status.HTTP_200_OK)

        try:
            with transaction.atomic():
                for key, value in data.items():
                    setattr(instance, key, value)
                instance.updated_by = user.id
                instance.save()
                return self.cus_response_updated()

        except Exception as e:
            logger.error(e, exc_info=True)
        return self.cus_response_500()

    @swagger_auto_schema(
        operation_summary='Xóa mã quyền',
        operation_description='Xóa mã quyền',
        tags=[swagger_tags.ADMIN],
    )
    def delete(self, request, *args, **kwargs):
        user = request.user
        is_per = CheckPermission(per_code.EDIT_GROUP, user.id).check()
        if not user.is_superuser and not is_per:
            return self.cus_response_403()
        instance = Permission.objects.filter(**kwargs).first()

        if RolePermission.objects.filter(code_permission=instance).exists():
            return self.cannot_delete()

        if not instance:
            return self.cus_response_404(ec.PERMISSION)
        try:
            with transaction.atomic():
                instance.delete_flag
                instance.updated_by = user.id
                instance.save()
                return self.cus_response_deleted()

        except Exception as e:
            logger.error(e, exc_info=True)
        return self.cus_response_500()


"""
HIS PACS integration class
"""

class OrderView(CustomAPIView):
    queryset = User.objects.all()
    # Call overwrite here to skip authenticate or don't call request.user
    authentication_classes = ()

    """
    Get list of order
    """
    @swagger_auto_schema(
        operation_summary='Get all orders',
        operation_description='Get all orders',
        tags=[swagger_tags.REPORT],
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
                    'address':order.patient.address,
                    'insurance_no':order.patient.insurance_no
                },
                'procedures': [{'code': proc.procedure_type.code, 'name': proc.procedure_type.name} for proc in order.procedure_list]
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
        tags=[swagger_tags.REPORT],
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


                return self.cus_response_created()

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
    

    
class OrderByACN(CustomAPIView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Get list of order
    """
    @swagger_auto_schema(
        operation_summary='Order Detail by AccessionNumber',
        operation_description='Order Detail by AccessionNumber',
        tags=[swagger_tags.REPORT],
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
            order = Order.objects.prefetch_related(procedure_prefetch).get(**kwargs)
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
                'address':order.patient.address,
                'insurance_no':order.patient.insurance_no
            },
            'procedures': [{'proc_id': proc.id,
                            'code': proc.procedure_type.code, 
                            'name': proc.procedure_type.name,
                            'report':self._get_report_json(proc.id)} for proc in order.procedure_list]
        }
        return self.response_success(data=order_data)
    
    def _get_report_json(self, proc_id):
        report = {}
        try:
            report=Report.objects.get(procedure_id=proc_id)
            if report is not None:
                report = {
                    'id': report.id,
                    'accession_no': report.accession_no,
                    'study_iuid': report.study_iuid,
                    'findings': report.findings,
                    'conclusion': report.conclusion,
                    'status': report.status,
                    'radiologist': {
                        'doctor_no':report.radiologist.doctor_no,
                        'fullname':report.radiologist.fullname
                    }                
                }
        except Report.DoesNotExist:
            logger.warn("Report not exist", exc_info=True)
        return report

class ReportView(CustomAPIView):
    queryset = User.objects.all()
    authentication_classes = ()


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

        serializer = ser.CreateReportSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Data after validation
        data = serializer.validated_data

        try:
            with transaction.atomic():
                proc_val = None
                # Check if 'procedure_id' is not exist
                if 'procedure_id' in data and data['procedure_id']:
                    proc_val = Procedure.objects.get(pk=data['procedure_id'])
                
                report_new = Report.objects.create(
                    accession_no=data['accession_no'],
                    study_iuid=data['study_iuid'],
                    findings=data['findings'],
                    conclusion=data['conclusion'],
                    status=data['status'],
                   
                    radiologist = Doctor.objects.get(pk=data['radiologist_id']),
                    procedure = proc_val,

                    created_by = data['radiologist_id']
                )

                # Persist db
                report_new.save()

                return self.cus_response_created()

        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
    

"""
Report detail view class
"""   
class ReportByStudyUID(CustomAPIView):
    queryset = User.objects.all()
    authentication_classes = ()

    """
    Get a report
    kwargs = study_iuid
    """
    @swagger_auto_schema(
        operation_summary='Report Detail By StudyInstanceUID',
        operation_description='Report Detail By StudyInstanceUID',
        tags=[swagger_tags.REPORT],
    )
    def get(self, request, *args, **kwargs):
        try:
            study_iuid=kwargs['study_iuid']
            # Get report by study_iuid and status != 'X' (deleted)
            report = Report.objects.filter(study_iuid=study_iuid).exclude(status='X').first()
            if report is None:
                return self.cus_response_empty_data(ec.REPORT)
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        procedure= {}
        # Make sure report.procedure exist
        if report.procedure:
            procedure = {
                'code':report.procedure.procedure_type.code,
                'name':report.procedure.procedure_type.name
            }


        data = {
            'id': report.id,
            'accession_no': report.accession_no,
            'study_iuid': report.study_iuid,
            'findings': report.findings,
            'conclusion': report.conclusion,
            'status': report.status,
            'radiologist': {
                'doctor_no':report.radiologist.doctor_no,
                'fullname':report.radiologist.fullname
            },
            'procedure': procedure,
        }
        return self.response_success(data=data)
    
"""
Report detail view class - For HIS(2)
"""   
class ReportByACNProcedure(CustomAPIView):
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
        procedure= {'code': proc.procedure_type.code, 
                    'name': proc.procedure_type.name} 

        # Get report
        data = {}
        report = self._get_report(proc.id)
        if report is None:
            return self.cus_response_empty_data(ec.REPORT)
        else:
            data = {
                'id': report.id,
                'accession_no': report.accession_no,
                'study_iuid': report.study_iuid,
                'findings': report.findings,
                'conclusion': report.conclusion,
                'status': report.status,
                'radiologist': {
                    'doctor_no':report.radiologist.doctor_no,
                    'fullname':report.radiologist.fullname
                },
                'procedure': procedure,
                'image_link': get_image_link(request, report.study_iuid)
            }

            return self.response_success(data=data)
    
    def _get_report(self, proc_id):
        report = None
        try:
            report=Report.objects.get(procedure_id=proc_id)
        except Report.DoesNotExist:
            logger.warn("Report not exist", exc_info=True)
        return report    
    

class ReportById(CustomAPIView):
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
        try:
            # id=kwargs['id']
            # Get report by id and status != 'X' (deleted)
            report = Report.objects.filter(**kwargs).exclude(status='X').first()
            if report is None:
                return self.cus_response_empty_data(ec.REPORT)
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        procedure= {}
        # Make sure report.procedure exist
        if report.procedure:
            procedure = {
                'code':report.procedure.procedure_type.code,
                'name':report.procedure.procedure_type.name
            }


        data = {
            'id': report.id,
            'accession_no': report.accession_no,
            'study_iuid': report.study_iuid,
            'findings': report.findings,
            'conclusion': report.conclusion,
            'status': report.status,
            'radiologist': {
                'doctor_no':report.radiologist.doctor_no,
                'fullname':report.radiologist.fullname
            },
            'procedure': procedure,
        }
        return self.response_success(data=data)

    @swagger_auto_schema(
        operation_summary='Update the report by id',
        operation_description='Update the report by id',
        request_body=ser.UpdateReportSerializers,
        tags=[swagger_tags.REPORT],
    )
    def put(self, request, *args, **kwargs):
        # user = request.user
        try:
            report = Report.objects.filter(**kwargs).first()
            if not report:
                return self.cus_response_empty_data(ec.REPORT)

            serializer = ser.UpdateReportSerializers(data=request.data, instance=report)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            with transaction.atomic():
                for key, value in data.items():
                    setattr(report, key, value)

                # instance.updated_by = user.id
                report.updated_by = timezone.now
                report.save()
                
                return self.cus_response_updated()

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
            instance = Report.objects.filter(**kwargs).first()
            if not instance:
                return self.cus_response_empty_data(type=ec.REPORT)

            # Delete status, flag
            instance.delete_flag = True
            instance.status = 'X'
            # this uid is created first in \shared\data\integration_app.json
            instance.updated_by = "65838386-c439-44b4-8ee6-68f134eb5bc2"
            instance.updated_at=timezone.now

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
        tags=[swagger_tags.REPORT],
    )
    def get(self, request, *args, **kwargs):
        # user = request.user
        # is_per = CheckPermission(per_code.VIEW_REPORT, user.id).check()
        # if not is_per and not user.is_superuser:
        #     return self.cus_response_403()

        # P: referring physician, R: radilogist    
        type=kwargs['type']
        # procedure_code=kwargs['procedure_code']
        data= {}
        try:
            doctors = Doctor.objects.filter(type=type)
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
        tags=[swagger_tags.REPORT],
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
                    # created_by = ''
                )

                # Persist db
                doctor_new.save()

                return self.cus_response_created()

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
        except Order.DoesNotExist:
            return self.cus_response_empty_data(ec.REPORT)
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        return self.response_success(data=data)