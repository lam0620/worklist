from django.urls import path

from apps.account.views import (
    AccountDetailView, AccountUser, AccountView, AuthRefreshToken,
    AdminRoleGroupDetailView, AdminRoleGroupView, AuthLogin,
    ChangePassword, CodePermissionDetail, CodePermissionView, StatusCheck, AccountResetPassword
)

urlpatterns = [
    # Auth
    path('auth/login', AuthLogin.as_view(), name='AuthLogin'),
    path('auth/refresh-token', AuthRefreshToken.as_view(), name='AuthLogin'),
    path('auth/change-password', ChangePassword.as_view(), name='ChangePassword'),

    # Account admin
    path('accounts', AccountView.as_view(), name='AccountView'),
    path('accounts/reset-password', AccountResetPassword.as_view(), name='ResetPassword'),
    path('accounts/<uuid:pk>', AccountDetailView.as_view(), name='AccountDetailView'),
    path('me', AccountUser.as_view(), name='AccountUser'),

    # Role and Permission
    path('groups', AdminRoleGroupView.as_view(), name='AdminRoleGroupView'),
    path('groups/<uuid:pk>', AdminRoleGroupDetailView.as_view(), name='AdminRoleGroupDetailView'),
    path('permissions', CodePermissionView.as_view(), name='CodePermissionView'),
    path('permissions/<uuid:pk>', CodePermissionDetail.as_view(), name='CodePermissionDetail'),


    # Status check
    path('status', StatusCheck.as_view(), name='StatusCheck'),



]
