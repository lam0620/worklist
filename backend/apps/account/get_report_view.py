import logging

from apps.account.models import Report
from apps.account.utils import  get_image_link
from third_parties.contribution.api_view import CustomAPIView

logger = logging.getLogger(__name__)

class GetReportView(CustomAPIView):    
    def get_report_by_id(self, request, pk):
        try:
            # id=kwargs['id']
            # Get report by id and status != 'X' (deleted)
            report = Report.objects.filter(pk=pk).exclude(status='X').first()
            if report is None:
                return self.cus_response_empty_data('REPORT')
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG('SYSTEM_ERR', str(e))
        
        return self.get_report_json(request, report)
    
    def get_report_json(self, request, report):
        procedure= {}
        # Make sure report.procedure exist
        if report.procedure:
            procedure = {
                'proc_id':report.procedure.id,
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
                "id":report.radiologist.id,
                'doctor_no':report.radiologist.doctor_no,
                'fullname':report.radiologist.fullname,
                'sign':report.radiologist.sign,
                'title':report.radiologist.title,
            },
            'procedure': procedure,
            'image_link': get_image_link(request, report.study_iuid)
        }
        #return data
        return self.response_success(data=data)       

    def get_report_by_proc_id(self, proc_id):
        report = None
        try:
            report=Report.objects.get(procedure_id=proc_id)
        except Report.DoesNotExist:
            logger.warn("Report not exist", exc_info=True)
        return report     