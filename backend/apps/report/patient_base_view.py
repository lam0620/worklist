import logging


from apps.report.models import Patient
from third_parties.contribution.api_view import CustomAPIView
from apps.report import serializers as ser

logger = logging.getLogger(__name__)

class PatientBaseView(CustomAPIView):    

    def get_patient_by_id(self, pk):
        try:
            item = Patient.objects.get(pk=pk)
            if item is None:
                return self.cus_response_empty_data()
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG('SYSTEM_ERR', str(e))
        
        
        data = self.patient2json(item)
        return self.response_success(data=data) 
    
    def patient2json(self, item):
        serializer = ser.CreatePatientSerializers(item)
        data = serializer.data
        data['id'] = item.id
        
        # # Expose username
        # if item.user_id:
        #     data['username'] = item.user.username

        return data