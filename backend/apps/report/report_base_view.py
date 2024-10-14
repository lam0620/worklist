import logging

from apps.report.models import Report
from apps.report.utils import  get_image_link,get_image_field_str
from third_parties.contribution.api_view import CustomAPIView

logger = logging.getLogger(__name__)

class ReportBaseView(CustomAPIView):    
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
        """
        Get report data in json for report item
        """
                
        data = self.get_pure_report_json(request, report)
        #return data
        return self.response_success(data=data)       

    def get_pure_report_json(self, request, report):
        """
        Get pure report data in json for report item
        """
                
        procedure_json= {}
        patient_json = {}

        # Make sure report.procedure exist
        if report.procedure:
            procedure = report.procedure
            patient = report.procedure.order.patient

            procedure_json = {
                'proc_id':procedure.id,
                'code':procedure.procedure_type.code,
                'name':procedure.procedure_type.name
            }

            patient_json = {
                    'pid':patient.pid,
                    'fullname':patient.fullname,
                    'gender':patient.gender,
                    'dob':patient.dob
            }

        created_time = report.created_at.strftime('%d/%m/%Y %H:%M')
        data = {
            'id': report.id,
            'accession_no': report.accession_no,
            'study_iuid': report.study_iuid,
            'findings': report.findings,
            'conclusion': report.conclusion,
            'status': report.status,
            'created_time':created_time,
            'radiologist': {
                "id":report.radiologist.id,
                'doctor_no':report.radiologist.doctor_no,
                'fullname':report.radiologist.fullname,
                'sign':get_image_field_str(report.radiologist.sign),
                'title':report.radiologist.title,
            },
            'patient':patient_json,
            'procedure': procedure_json,
            'image_link': get_image_link(request, report.study_iuid)
        }
        #return data
        return data


    def get_report_by_proc_id(self, proc_id):
        report = None
        try:
            report=Report.objects.get(procedure_id=proc_id, delete_flag = False)
        except Report.DoesNotExist:
            logger.warn("Report not exist", exc_info=True)

        except Exception as e:
            logger.error(e)
            
        return report  