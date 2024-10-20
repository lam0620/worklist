from django.urls import path

from rest_framework import routers
from rest_framework.routers import DefaultRouter

from apps.report.views import (
    ReportTemplateDetailView, ReportTemplateView, ReportView, ReportDetailView,
    OrderView,OrderDetail, DoctorView,DoctorDetailView,
    PatientView,PatientDetailView,
    StatsViewSet
)
from apps.report.views import (
    External_ReportById, External_ReportByACNProcedure,
    External_OrderView,External_ImageLinkView,External_ImageLinkByACNProcedure
)
# from apps.report.views.views import OrderByACNView

urlpatterns = [

    # HIS PACS integration api
    # His use api
    # 1. Create order. /orders
    # 2. Get report by acn + procedure code. /reports/<accession_no>/<procedure_code>
    # 3. Delete report. /reports/<uuid:pk>
    # 4. Get image link. /images/<accession_no>/<procedure_code>
    path('ext/orders', External_OrderView.as_view(), name='Order for external'),
    path('ext/reports/<accession_no>/<procedure_code>', External_ReportByACNProcedure.as_view(), name='Report Detail by AccessionNumber and procedure code'),
    path('ext/reports/<uuid:pk>', External_ReportById.as_view(), name='Report Detail by Id'),

    # images?accession=xxx. images that has been reported or not yet
    path('ext/images', External_ImageLinkView.as_view(), name='Image link'),
    # images that has been reported
    path('ext/images/<accession_no>/<procedure_code>', External_ImageLinkByACNProcedure.as_view(), name='Image link'),
    ############# END API FOR HIS ###################

    ############# API FOR REPORT ###################
    # Order
    path('orders', OrderView.as_view(), name='Order'),
    # orders?accession=xxx also existing. pattern /orders
    path('orders/<uuid:pk>', OrderDetail.as_view(), name='Order Detail by Id'),

    # Report
    path('reports', ReportView.as_view(), name='Report'),
    path('reports/<uuid:pk>', ReportDetailView.as_view(), name='Report Detail by Id'),
    # path('reports/<accession_no>/<procedure_code>', ReportByACNProcedure.as_view(), name='Report Detail by AccessionNumber and procedure code'),
    # reports?study_iuid=xxx also existing. pattern /reports

    #Radiologist/Doctor
    # path('doctors/<type>', DoctorListView.as_view(), name='Doctor List'),
    path('doctors', DoctorView.as_view(), name='Doctor'),
    # doctors?type=R|P also existing. pattern /doctors
    # doctors?user_id=xxxx also existing. pattern /doctors
    path('doctors/<uuid:pk>', DoctorDetailView.as_view(), name='Doctor by Id'),

    # Patient
    path('patients', PatientView.as_view(), name='Patients'),
    path('patients/<uuid:pk>', PatientDetailView.as_view(), name='Patient by Id'),    

    #Report template
    path('report-templates', ReportTemplateView.as_view(), name='ReportTemplate'),
    path('report-templates/<uuid:pk>', ReportTemplateDetailView.as_view(), name='ReportTemplate Detail'),
    # report-templates?modality=xx aslo existing in the pattern /report-templates
]

router = DefaultRouter()
router.register('stats', StatsViewSet, basename='stats')
urlpatterns += router.urls