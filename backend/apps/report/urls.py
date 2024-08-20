from django.urls import path

from apps.report.views import (
    ReportView, ReportById, ReportByStudyUID,ReportByACNProcedure,
    OrderView,OrderByACN,DoctorView,DoctorListView,ImageLinkByACNProcedure
)

urlpatterns = [

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
    path('images/<accession_no>/<procedure_code>', ImageLinkByACNProcedure.as_view(), name='Image link'),

    #Radiologist
    path('doctors/<type>', DoctorListView.as_view(), name='Doctor List'),
    path('doctors', DoctorView.as_view(), name='Doctor'),
]
