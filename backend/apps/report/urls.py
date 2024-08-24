from django.urls import path

from apps.report.views import (
    ImageLinkView, ReportTemplateDetailView, ReportTemplateView, ReportView, ReportById, ReportByACNProcedure,
    OrderView,OrderByACN,DoctorView,DoctorListView,ImageLinkByACNProcedure
)

urlpatterns = [

    # HIS PACS integration api
    # His use api
    # 1. Create order. /orders
    # 2. Get report by acn + procedure code. /reports/<accession_no>/<procedure_code>
    # 3. Delete report. /reports/<uuid:pk>
    # 4. Get image link. /images/<accession_no>/<procedure_code>

    # Order
    path('orders', OrderView.as_view(), name='Order'),
    path('orders/acn/<accession_no>', OrderByACN.as_view(), name='Order Detail by AccessionNumber'),

    # Report
    path('reports', ReportView.as_view(), name='Report'),
    path('reports/<uuid:pk>', ReportById.as_view(), name='Report Detail by Id'),
    path('reports/<accession_no>/<procedure_code>', ReportByACNProcedure.as_view(), name='Report Detail by AccessionNumber and procedure code'),
    # reports?study_iuid=xxx also existing. pattern /reports

    #Image
    # images?accession=xxx 
    # images that has been reported or not yet
    path('images', ImageLinkView.as_view(), name='Image link'),
    # images that has been reported
    path('images/<accession_no>/<procedure_code>', ImageLinkByACNProcedure.as_view(), name='Image link'),

    #Radiologist
    path('doctors/<type>', DoctorListView.as_view(), name='Doctor List'),
    path('doctors', DoctorView.as_view(), name='Doctor'),

    #Report template
    path('report-templates', ReportTemplateView.as_view(), name='ReportTemplate'),
    path('report-templates/<uuid:pk>', ReportTemplateDetailView.as_view(), name='ReportTemplate Detail'),
    # report-templates?modality=xx aslo existing in the pattern /report-templates
]
