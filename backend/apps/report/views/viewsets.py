from datetime import date, timedelta
import datetime
import logging

from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import action
from django.db.models.functions import ExtractYear

from django.db import transaction,connections
from drf_yasg.utils import swagger_auto_schema
from apps.report.report_base_view import ReportBaseView
from third_parties.contribution.api_view import CustomAPIView
from django.db.models import F, Prefetch
from django.db.models import Count
from drf_yasg import openapi

from library.constant import error_codes as ec
from library.constant import module_code as module_code
from library.constant import permission_code as per_code
from library.constant import swagger_tags

from apps.report import serializers as ser
from apps.report.models import (
    Doctor, Report, User, 
    Order,Patient,Procedure,ProcedureType
)
from apps.account.permission import CheckPermission
from apps.report.utils import  get_image_field_str,get_username


logger = logging.getLogger(__name__)



"""
Order class
"""

class StatsViewSet(viewsets.ModelViewSet, CustomAPIView):

    @swagger_auto_schema(
        operation_summary='Get doctors by order date',
        operation_description='Get doctors by order date',
        query_serializer=ser.StatsSerializers,
        tags=[swagger_tags.REPORT_STATS],
    )
    @action(detail=False, methods=['get'], url_path='order-doctors')
    def get_doctors_by_order_date(self, request, *args, **kwargs):
        """
        Get doctor list who did orders by range date (today, 7 days, 30 days)
        """
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_ORDER)

        serializers = ser.StatsSerializers(data=request.query_params)
        serializers.is_valid(raise_exception=True)
        data = serializers.validated_data

        data= {}
        try:
            type = '' if 'type' not in request.query_params else request.query_params['type']
            if type == 'today':
                # select count join on where
                items = Order.objects.values('referring_phys__doctor_no').\
                    filter(created_at__date=date.today()).annotate(count=Count('referring_phys')).\
                    values('referring_phys__doctor_no','referring_phys__fullname', 'count').\
                    order_by("referring_phys__doctor_no")
            elif type == '1week':
                min_date = date.today() - timedelta(days=7) #7 days ago
                items = Order.objects.values('referring_phys__doctor_no').\
                    filter(created_at__date__lte=date.today(), created_at__date__gt=min_date).annotate(count=Count('referring_phys')).\
                    values('referring_phys__doctor_no','referring_phys__fullname', 'count').\
                    order_by("referring_phys__doctor_no")
            elif type == '1month':
                min_date = date.today() - timedelta(days=30) #300 days ago
                items = Order.objects.values('referring_phys__doctor_no').\
                    filter(created_at__date__lte=date.today(), created_at__date__gt=min_date).annotate(count=Count('referring_phys')).\
                    values('referring_phys__doctor_no','referring_phys__fullname', 'count').\
                    order_by("referring_phys__doctor_no")
            else:
                return self.response_NG(ec.SYSTEM_ERR, "type is invalid. Value must be one of ['today','1week','1month']")
        

           #doctors = Doctor.objects.select_related('referring_phys__id').filter(delete_flag=False, created_at__date=date.today())


            data = [{
                     'doctor_no':item['referring_phys__doctor_no'],
                     'fullname':item['referring_phys__fullname'],
                     'count':item['count']} for item in items]

            return self.response_success(data=data)                             
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
        
    @swagger_auto_schema(
        operation_summary='Get orders by year',
        operation_description='Get orders by year',
        query_serializer=ser.StatsSerializers,
        tags=[swagger_tags.REPORT_STATS],
    )
    @action(detail=False, methods=['get'], url_path='orders')
    def get_orders_by_year(self, request, *args, **kwargs):
        """
        Get doctor list who did orders by range date (today, 7 days, 30 days)
        """
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_ORDER)

        serializers = ser.StatsSerializers(data=request.query_params)
        serializers.is_valid(raise_exception=True)
        data = serializers.validated_data

        data= {}
        try:
            year = '' if 'year' not in request.query_params else request.query_params['year']

            # select count join on where
            # Don't know why but add order_by("created_at__month"), 'created_at' in group by is removed => sql correct
            items = Order.objects.filter(created_at__year=year).\
                    values('created_at__month').\
                    annotate(count=Count('created_at__month')).\
                    order_by("created_at__month")
            
            data = [{
                     'month':item['created_at__month'],
                     'count':item['count']} for item in items]

            return self.response_success(data=data)                             
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))


    @swagger_auto_schema(
        operation_summary='Get radiologist by report date',
        operation_description='Get radiologist by report date',
        query_serializer=ser.StatsSerializers,
        tags=[swagger_tags.REPORT_STATS],
    )
    @action(detail=False, methods=['get'], url_path='report-doctors')
    def get_doctors_by_report_date(self, request, *args, **kwargs):
        """
        Get doctor list who did reports by range date (today, 1week, 1month)
        """
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_ORDER)


        data= {}
        try:
            type = '' if 'type' not in request.query_params else request.query_params['type']
            if type == 'today':
                # select count join on where
                items = Report.objects.values('radiologist__doctor_no').\
                    filter(created_at__date=date.today()).\
                    exclude(status='D').\
                    annotate(count=Count('radiologist')).\
                    values('radiologist__doctor_no','radiologist__fullname', 'count').\
                    order_by("radiologist__doctor_no")
            elif type == '1week':
                min_date = date.today() - timedelta(days=7) #7 days ago
                items = Report.objects.values('radiologist__doctor_no').\
                    filter(created_at__date__lte=date.today(), created_at__date__gt=min_date).\
                    exclude(status='D').\
                    annotate(count=Count('radiologist')).\
                    values('radiologist__doctor_no','radiologist__fullname', 'count').\
                    order_by("radiologist__doctor_no")
            elif type == '1month':
                min_date = date.today() - timedelta(days=30) #300 days ago
                items = Report.objects.values('radiologist__doctor_no').\
                    filter(created_at__date__lte=date.today(), created_at__date__gt=min_date).\
                    exclude(status='D').\
                    annotate(count=Count('radiologist')).\
                    values('radiologist__doctor_no','radiologist__fullname', 'count').\
                    order_by("radiologist__doctor_no")
            else:
                return self.response_NG(ec.SYSTEM_ERR, "type is invalid. Value must be one of ['today','1week','1month']")
        

           #doctors = Doctor.objects.select_related('radiologist__id').filter(delete_flag=False, created_at__date=date.today())


            data = [{
                     'doctor_no':item['radiologist__doctor_no'],
                     'fullname':item['radiologist__fullname'],
                     'count':item['count']} for item in items]

            return self.response_success(data=data)                             
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        
    @swagger_auto_schema(
        operation_summary='Get reports by year',
        operation_description='Get orders by year',
        query_serializer=ser.StatsSerializers,
        tags=[swagger_tags.REPORT_STATS],
    )
    @action(detail=False, methods=['get'], url_path='reports')
    def get_reports_by_year(self, request, *args, **kwargs):
        """
        Get doctor list who did orders by range date (today, 1week, 1month)
        """
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_ORDER)

        serializers = ser.StatsSerializers(data=request.query_params)
        serializers.is_valid(raise_exception=True)
        data = serializers.validated_data

        data= {}
        try:
            year = '' if 'year' not in request.query_params else request.query_params['year']

            # select count join on where
            # Don't know why but add order_by("created_at__month"), 'created_at' in group by is removed => sql correct
            items = Report.objects.filter(created_at__year=year).\
                    exclude(status='D').\
                    values('created_at__month').\
                    annotate(count=Count('created_at__month')).\
                    order_by("created_at__month")
            
            data = [{
                     'month':item['created_at__month'],
                     'count':item['count']} for item in items]

            return self.response_success(data=data)                             
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))
        

    @swagger_auto_schema(
        operation_summary='Get studies by year',
        operation_description='Get studies by year',
        query_serializer=ser.StatsSerializers,
        tags=[swagger_tags.REPORT_STATS],
    )
    @action(detail=False, methods=['get'], url_path='studies')
    def get_studies_by_year(self, request, *args, **kwargs):
        """
        Get study list who did orders by range date (today, 1week, 1month)
        """
        # Get and check version to secure or not
        if request.META.get('HTTP_X_API_VERSION') != "X":  
            user = request.user
            is_per = CheckPermission(per_code.VIEW_ORDER, user.id).check()
            if not is_per and not user.is_superuser:
                return self.cus_response_403(per_code.VIEW_ORDER)

        serializers = ser.StatsSerializers(data=request.query_params)
        serializers.is_valid(raise_exception=True)
        data = serializers.validated_data

        data= {}
        try:
            year = '' if 'year' not in request.query_params else request.query_params['year']
            start_time = year + '-01-01T00:00:00'
            end_time = year + '-12-31T23:59:59.999999'

            # rejection_state = 2 (REJECTED)
            sql = """select EXTRACT('month' FROM created_time) as month, COUNT(EXTRACT('month' FROM created_time)) as count 
                    from study where created_time BETWEEN %s AND %s and rejection_state <> 2
                    GROUP BY EXTRACT('month' FROM created_time)"""
            
            # select count join on where
            # Get pacsdb.study by accession_no
            with connections["pacs_db"].cursor() as cursor:
                cursor.execute(sql, (start_time,end_time))
                results = self._dictfetchall(cursor)

                if results is not None:
                    data = [{
                     'month':item['month'],
                     'count':item['count']} for item in results]

            return self.response_success(data=data)                             
        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.SYSTEM_ERR, str(e))


    def _dictfetchall(self, cursor):
        """
        Return all rows from a cursor as a dict.
        Assume the column names are unique.
        """
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]