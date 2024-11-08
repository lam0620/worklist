import logging


from django.db import connections
from drf_yasg.utils import swagger_auto_schema

from third_parties.contribution.api_view import CustomAPIView

from library.constant import error_codes as ec
from library.constant import module_code as module_code
from library.constant import permission_code as per_code
from library.constant import swagger_tags

from apps.report import serializers as ser
from apps.report.models import ( User)
from apps.account.permission import CheckPermission

logger = logging.getLogger(__name__)

        
"""
Study detail view
"""   
class StudyDetailView(CustomAPIView):
    """
    Get a study
    ?accession=xxx
    """

    # queryset = User.objects.all()
    authentication_classes = ()

    @swagger_auto_schema(
        operation_summary='Get study detail',
        operation_description='Get study detail',
        tags=[swagger_tags.REPORT_STUDY],
        query_serializer= ser.GetStudySerializers,
    )
    def get(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_ORDER)

        # Get accession from query params: /?accession=XX   
        accession=request.query_params.get('accession')

        data= {}
        try:
            # Get pacsdb.study by accession_no
            with connections["pacs_db"].cursor() as cursor:
                cursor.execute("select study_iuid from study where accession_no=%s",[accession])
                results = cursor.fetchall()

                if results is None or len(results) <= 0:
                    return self.cus_response_empty_data()
                
                # if results is not None:
                data= [{
                    'study_iuid':item[0]
                } for item in results]
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))
        
        return self.response_success(data=data)     

