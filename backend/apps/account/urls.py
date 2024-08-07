from django.urls import path

from apps.account.views import (
    AccountDetailView, AccountUser, AccountView, AuthRefreshToken,
    AdminRoleGroupDetailView, AdminRoleGroupView, AuthLogin,
    ChangePassword, CodePermissionDetail, CodePermissionView, 
    StatusCheck,
    ReportView, ReportById, ReportByStudyUID,ReportByACNProcedure,
    OrderView,OrderByACN,DoctorView,ImageLinkByACNProcedure
)

urlpatterns = [
    # Auth
    path('auth/login', AuthLogin.as_view(), name='AuthLogin'),
    path('auth/refresh-token', AuthRefreshToken.as_view(), name='AuthLogin'),
    path('auth/change-password', ChangePassword.as_view(), name='ChangePassword'),

    # Account admin
    path('accounts', AccountView.as_view(), name='AccountView'),
    path('accounts/<uuid:pk>', AccountDetailView.as_view(), name='AccountDetailView'),
    path('me', AccountUser.as_view(), name='AccountUser'),

    # Role and Permission
    path('groups', AdminRoleGroupView.as_view(), name='AdminRoleGroupView'),
    path('groups/<uuid:pk>', AdminRoleGroupDetailView.as_view(), name='AdminRoleGroupDetailView'),
    path('permissions', CodePermissionView.as_view(), name='CodePermissionView'),
    path('permissions/<uuid:pk>', CodePermissionDetail.as_view(), name='CodePermissionDetail'),


    # Status check
    path('status', StatusCheck.as_view(), name='StatusCheck'),

    # HIS PACS integration api
    # Order
    path('orders', OrderView.as_view(), name='Order'),
    path('orders/acn/<accession_no>', OrderByACN.as_view(), name='Order Detail by AccessionNumber'),

    # Report
    path('reports', ReportView.as_view(), name='Report'),
    path('reports/study/<study_iuid>', ReportByStudyUID.as_view(), name='Report Detail by StudyInstanceUID'),
    path('reports/<accession_no>/<procedure_code>', ReportByACNProcedure.as_view(), name='Report Detail by AccessionNumber and procedure code'),

    path('reports/<uuid:pk>', ReportById.as_view(), name='Report Detail by Id'),

    #Image
    path('images/<accession_no>', ImageLinkByACNProcedure.as_view(), name='Image link'),

    #Radiologist
    path('doctors/<type>', DoctorView.as_view(), name='Doctor'),
]
