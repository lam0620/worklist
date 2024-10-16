import logging

from django.db.models import Prefetch
from third_parties.contribution.api_view import CustomAPIView

from apps.report.models import Order, Procedure, Report
from apps.report.utils import  get_image_field_str

logger = logging.getLogger(__name__)

class OrderBaseView(CustomAPIView):    
    def get_order_by_id(self, request, pk):
        try:
            procedure_prefetch = Prefetch(
                'procedure_set',
                queryset=Procedure.objects.select_related('procedure_type'),
                to_attr='procedure_list'
            )
            # Get order by id 
            queryset = self.filter_queryset(Order.objects.prefetch_related(procedure_prefetch).filter(pk=pk, delete_flag=False))

        except Order.DoesNotExist:
            return self.cus_response_empty_data('ORDER')
        
        # Get first (by pk so one only)
        order = queryset[0]
        return self.get_order_json(request, order)
    
    def get_order_json(self, request, order):
        """
        Get order data in json for order item
        """
                
        data = self.get_pure_order_json(order)
        #return data
        return self.response_success(data=data)       

    def get_pure_order_json(self, order):
        order_data = {
            'id': order.id,
            'accession_no': order.accession_no,
            'referring_phys_code': order.referring_phys.doctor_no,
            'referring_phys_name': order.referring_phys.fullname,
            'clinical_diagnosis': order.clinical_diagnosis,
            'order_time': order.order_time,
            'created_time':order.created_at.strftime('%d/%m/%Y %H:%M'),
            'modality_type': order.modality_type,
            'patient': {
                'pid':order.patient.pid,
                'fullname':order.patient.fullname,
                'gender':order.patient.gender,
                'dob':order.patient.dob,
                'tel':order.patient.tel,
                'address':order.patient.address,
                'insurance_no':order.patient.insurance_no
            },
            'procedures': [{'proc_id': proc.id,
                            'study_iuid':proc.study_iuid,
                            'code': proc.procedure_type.code, 
                            'name': proc.procedure_type.name,
                            'report':self.get_order_report_json(proc.id)} for proc in order.procedure_list]
        }

        return order_data


    def get_order_report_json(self, proc_id):
        """
        Get report data in json for order item
        """
        data = {}

        report = self.get_report_by_proc_id(proc_id)
        if report is not None:
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
                }                
            }

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