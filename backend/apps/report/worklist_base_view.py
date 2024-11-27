import logging

import pandas as pd
import numpy as np

from django.db.models import F, Prefetch
from django.db import transaction,connections

from apps.report.models import Order, Procedure, Report
from third_parties.contribution.api_view import CustomAPIView
from apps.report import serializers as ser

from apps.report.utils import  get_image_field_str

logger = logging.getLogger(__name__)

class WorklistBaseView(CustomAPIView):    
    def _get_worklists(self, request):
        # SC, IP, CM, IM
        status=request.query_params.get('status')

        # Get orders
        queryset = self._get_orders(status)

        if not queryset.exists():
            return pd.DataFrame() # empty df

        data= {}
        # Init a Empty dataframe
        df_study = pd.DataFrame({'accession_no':[],
                                 'study_iuid':[],
                                 'study_time':[],
                                 'num_series':[],
                                 'num_instances':[]}) 
        
        # 2. Get studies
        df_study = self._get_studies(queryset, df_study)

        # 3. Convert queryset to json, merge df_study to df_merged
        df_merged = self._merge_df(queryset, df_study)
        #logger.debug('Number of rows after merging df_study: %s', len(df_merged))

        # Filter status = SC or IM in df. Do this because the status in procedure table is not latest data
        #if status and (status == 'SC' or status == 'IM'):
        # df_merged = df_merged[df_merged['proc_status'] == status]

        if status:
            list_status = status.split(',')
            df_merged = df_merged[df_merged['proc_status'].isin(list_status)]

        return df_merged
            
    def _get_include_no_order(self, request):    
        # Quick search
        quick_search_val=request.query_params.get('search')

        # Advanced search
        accession_no=request.query_params.get('accession_no')
        patient_name=request.query_params.get('patient_name')
        patient_pid=request.query_params.get('patient_pid')
        start_date=request.query_params.get('created_at_after') # from
        end_date=request.query_params.get('created_at_before') # to
        modality_type=request.query_params.get('modality_type')

        # SC, IP, CM, IM
        status=request.query_params.get('status')
        queryset = None

        logger.info('Quick Search?: %s', quick_search_val)

        queryset = self._get_orders(status)

        # Search by status but not found
        if status and not queryset.exists():
            return pd.DataFrame() # empty df

        data= {}
        # Init a Empty dataframe
        df_study = pd.DataFrame({'accession_no':[],
                                 'study_iuid':[],
                                 'study_time':[],
                                 'num_series':[],
                                 'num_instances':[],
                                 'modality_type':[]
                                 }) 
        
        # test dataframe
        # df_study = pd.DataFrame({'accession_no':['202411102','202411101'],
        #                         'study_time':['10/11/2024 13:59','10/11/2024 13:58']})

        # Get study data from pacs database
        try:
            list_accession_no = [order.accession_no for order in queryset]
                
            logger.info('Query pacs.study by accession_no: %s', list_accession_no)

            # Get pacsdb.study by accession_no
            with connections["pacs_db"].cursor() as cursor:
                
                if status:
                    # 1 study has many study_query_attrs, so add distinct
                    sql = """select distinct s.accession_no, s.study_iuid, s.created_time as study_created_time, sqa.num_series, sqa.num_instances,study_desc 
                                from study s 
                                left join study_query_attrs sqa on s.pk =sqa.study_fk 
                                where s.accession_no in %s and sqa.mods_in_study is not null
                            """
                    
                    cursor.execute(sql,[tuple(list_accession_no)])

                elif quick_search_val:
                    # Do Quick Search by params
                    # 1 study has many study_query_attrs, so add distinct
                    sql = """select distinct st.accession_no, st.study_iuid, st.created_time as study_created_time, sqa.num_series, sqa.num_instances,st.study_desc 
                            from study st 
                            join patient pa on pa.pk=st.patient_fk 
                            join patient_id pid on pa.pk=pid.patient_fk 
                            join person_name pn on pn.pk=pa.pat_name_fk 
                            left join study_query_attrs sqa on st.pk=sqa.study_fk 
                            where (UPPER(pid.pat_id) like UPPER(%(pid)s)) 
                                or (UPPER(pn.alphabetic_name) like UPPER(%(alp_name)s) or UPPER(pn.ideographic_name) like UPPER(%(ideo_name)s) or UPPER(pn.phonetic_name) like UPPER(%(ph_name)s)) 
                                or UPPER(st.accession_no) like UPPER(%(acn)s) 
                                or exists(select se.pk from series se where se.modality=%(modality)s and se.study_fk=st.pk)
                                and sqa.mods_in_study is not null
                                """
                    kwargs = {
                        'pid': '%'+quick_search_val+'%',
                        'alp_name': '%'+quick_search_val+'%',
                        'ideo_name': '%'+quick_search_val+'%',
                        'ph_name': '%'+quick_search_val+'%',
                        'acn': '%'+quick_search_val+'%',
                        'modality': '%'+quick_search_val+'%',                                                
                    }        
                    cursor.execute(sql, kwargs)                    
                else:    
                    where = """
                        where (pid.pat_id like %(pid)s or %(pid)s is null) 
                        and ((pn.alphabetic_name like %(name)s or %(name)s is null) 
                            or (pn.ideographic_name like %(name)s or %(name)s is null) 
                            or (pn.phonetic_name like %(name)s or %(name)s is null))
                        
                        and (st.accession_no like %(acn)s  or %(acn)s is null) 
                        and exists(select se.pk from series se 
                                    where (se.modality=%(modality)s or %(modality)s is null) 
                                    and se.study_fk=st.pk)
                        and sqa.mods_in_study is not null
                    """

                    if start_date and end_date:
                        where = where + " and st.study_date <> '*' and to_date(st.study_date, 'YYYYMMDD') between %(start_date)s and %(end_date)s "
                    elif start_date:
                        where = where + " and st.study_date <> '*' and to_date(st.study_date, 'YYYYMMDD') >= %(start_date)s "
                    elif end_date:        
                        where = where + " and st.study_date <> '*' and to_date(st.study_date, 'YYYYMMDD') <= %(end_date)s "
                    # Do Advanced Search by params
                    # 1 study has many study_query_attrs, so add distinct
                    sql = """select distinct st.accession_no, st.study_iuid, sqa.mods_in_study as modality_type,st.created_time as study_created_time, sqa.num_series, sqa.num_instances,st.study_desc 
                            from study st 
                            join patient pa on pa.pk=st.patient_fk 
                            join patient_id pid on pa.pk=pid.patient_fk 
                            join person_name pn on pn.pk=pa.pat_name_fk 
                            left join study_query_attrs sqa on st.pk=sqa.study_fk 
                            """
                    sql = sql + where

                    kwargs = {
                        'pid': None if not patient_pid else '%'+patient_pid+'%',
                        'name': None if not patient_name else '%'+patient_name+'%',
                        #'ideo_name': '' if not patient_name else '%'+patient_name+'%',
                        #'ph_name': '' if not patient_name else '%'+patient_name+'%',
                        'acn': None if not accession_no else '%'+accession_no+'%',
                        'modality': None if not modality_type else modality_type,    
                        'start_date': None if not start_date else start_date,
                        'end_date': None if not end_date else end_date,                                             
                    }                    
                    cursor.execute(sql, kwargs)

                results = cursor.fetchall()
                logger.info("Total rows of pacs.study are:  %s", len(results))

                # Convert Django's fetchall() result into a Pandas DataFrame
                column_names = [desc[0] for desc in cursor.description]
                df_study = pd.DataFrame(results, columns = column_names)

        except Exception as e:
            # No raise exception here
            logger.warning(e, exc_info=True)

        # Convert queryset to json, merge df_study to df_merged
        df_merged = self._merge_df(queryset, df_study)
        #logger.debug('Number of rows after merging df_study: %s', len(df_merged))

        # Search status = SC or IM in df. Do this because the status in procedure table is not latest data
        # if status and (status == 'SC' or status == 'IM'):
        #     df_merged = df_merged[df_merged['proc_status'] == status]

        # Filter in list
        if status:
            list_status = status.split(',')
            df_merged = df_merged[df_merged['proc_status'].isin(list_status)]

        return df_merged
    
    def _get_orders(self, status):
        queryset = None

        logger.info('New Search includes status?: %s', status)     
        # If status is passed in query_params, search in the Procedure
        if status:        
            list_status = status.split(',')
            logger.info('Search includes status?: %s', list_status)

            if 'SC' in list_status and 'IM' in list_status:
                pass
            elif 'IM' in list_status:
                # Change IM to SC
                # IM doesnot exist in procedure. So search by SC first, if SC that has image => IM
                # Then filter df_ by actual status (IM)
                list_status = list(map(lambda x: x.replace('IM', 'SC'), list_status))


            #list_status = status.split(',')
            # Search in procedure first
            queryset = Procedure.objects.filter(status__in=list_status)

            if not queryset.exists():
                return queryset
        
            # Get order id from procedure
            order_ids = [proc.order.id for proc in queryset]

            procedure_prefetch = Prefetch(
                'procedure_set',
                queryset=Procedure.objects.select_related('procedure_type'),
                to_attr='procedure_list'
            )
            # Search based on filter and order_ids (call filter() have to be before prefetch_related)
            queryset = self.filter_queryset(Order.objects.filter(pk__in=order_ids).prefetch_related(procedure_prefetch))            
            
         
        else:    
            procedure_prefetch = Prefetch(
                'procedure_set',
                queryset=Procedure.objects.select_related('procedure_type'),
                to_attr='procedure_list'
            )
            queryset = self.filter_queryset(Order.objects.prefetch_related(procedure_prefetch))

        logger.info("Total rows worklist are: %s", len(queryset))

        return queryset


    def _get_studies(self, queryset, df_study):
        # test dataframe
        # df_study = pd.DataFrame({'accession_no':['202411102','202411101'],
        #                         'study_time':['10/11/2024 13:59','10/11/2024 13:58']})

        # Get study data from pacs database
        try:
            list_accession_no = [order.accession_no for order in queryset]
                
            logger.info('Query pacs.study by accession_no: %s', list_accession_no)

            # Get pacsdb.study by accession_no
            with connections["pacs_db"].cursor() as cursor:
                # 1 study has many study_query_attrs, so add distinct
                sql = """select distinct s.accession_no, s.study_iuid, s.created_time as study_created_time, sqa.num_series, sqa.num_instances,study_desc 
                            from study s 
                            left join study_query_attrs sqa on s.pk =sqa.study_fk 
                            where s.accession_no in %s and sqa.mods_in_study is not null
                        """
                
                cursor.execute(sql,[tuple(list_accession_no)])
                results = cursor.fetchall()
                logger.info("Total rows of pacs.study are:  %s", len(results))

                # Convert Django's fetchall() result into a Pandas DataFrame
                column_names = [desc[0] for desc in cursor.description]
                df_study = pd.DataFrame(results, columns = column_names)

        except Exception as e:
            # No raise exception here
            logger.warning(e, exc_info=True)

        return df_study

    def _merge_df(self, queryset, df_study):
        orders_json = []

        # First, convert queryset to json to be able to get procedure data
        for order in queryset:
            for worklist in self._get_worklist_json(order):
                orders_json.append(worklist)

      
        # Convert json to dataframe
        df_order = pd.DataFrame.from_records(orders_json)

        # Don't merge study into orders if there are duplciated accession_no in orders
        # Because we don't know which study match with which order??
        
        # Get rows that duplicate accession_no
        df_duplciate_order = df_order[df_order.duplicated(subset=['accession_no'],keep=False)]
        logger.debug('Number of duplicated rows: %s', len(df_duplciate_order))
        # Get new df by removing duplicated rows
        df_new_order = df_order.drop_duplicates(subset=['accession_no'], keep=False) 
        logger.debug('Number of rows after drop duplicated: %s', len(df_new_order))

        # Merge df_study to df_new_order
        # outer: use union of keys from both frames, similar to a SQL full outer join; sort keys lexicographically.
        if len(df_new_order) == 0:
            df_merged = df_study
        else:    
            df_merged = df_new_order.merge(df_study, how='outer', on='accession_no', suffixes=('', '_dup'))
            
        logger.debug('Number of rows after merged df_study: %s', len(df_merged))

        # Add df_duplciate_order to df_merged and replace NaN to ''
        df_merged = pd.concat([df_merged, df_duplciate_order])#.replace([np.nan, -np.inf, pd.NaT], '')

        if 'created_time' in df_merged.columns :
            #print(df_merged['study_created_time'])
            # Format datetime to sort
            df_merged['created_time'] = pd.to_datetime(df_merged['created_time'], format='%d/%m/%Y %H:%M',errors='coerce')
        
            #print(df_merged.dtypes)
            # Sort latest created_time first
            #df_merged = df_merged.sort_values(by=['created_time'], ascending = False)

       
            # change the datetime format
            df_merged['created_time'] = df_merged['created_time'].dt.strftime('%d/%m/%Y %H:%M')
        else:
            logger.warning('There no created_time in dataframe')
            df_merged['created_time'] = ''


        # study_created_time is got from pacs.study
        if 'study_created_time' in df_merged.columns :
            df_merged['study_created_time'] = pd.to_datetime(df_merged['study_created_time'], format='%d/%m/%Y %H:%M',errors='coerce')
            df_merged['study_created_time'] = df_merged['study_created_time'].dt.strftime('%d/%m/%Y %H:%M')
        else:
            logger.warning('There no study_created_time in dataframe')
            df_merged['study_created_time'] = ''

        df_merged = df_merged.sort_values(by=['created_time','study_created_time'], ascending = False)

        if 'proc_status' in df_merged.columns :
            # Applying the condition to update status = 'IM' if current = SC and exists study_iuid
            df_merged["proc_status"] = np.where((df_merged["proc_status"] == 'SC') & (df_merged["study_iuid"].isnull() == False), 'IM', df_merged["proc_status"])

        if 'modality_type_dup' in df_merged.columns :
            # Set modality_type = st.modality_type if order.modality_type is empty
            df_merged["modality_type"] = np.where((df_merged["modality_type_dup"].isna() == False), df_merged["modality_type_dup"] , df_merged["modality_type"])
            #df_merged.loc[df_merged['modality_type_dup'] != '', 'modality_type'] = df_merged["modality_type_dup"]

        if 'proc_name' not in df_merged.columns :
            df_merged["proc_name"] =''

        if 'study_desc' in df_merged.columns :
            df_merged["proc_name"] = np.where(df_merged["proc_name"].isna() == False, df_merged["proc_name"], df_merged["study_desc"])
            #df_merged.loc[df_merged['proc_name'] == '', 'proc_name'] = df_merged["study_desc"]

        # Add df_duplciate_order to df_merged and replace NaN to ''
        return df_merged.replace([np.nan, -np.inf, pd.NaT], '')


    def _get_worklist_json(self, order):
        order_data = [{
            'id': order.id,
            'accession_no': order.accession_no,
            'referring_phys_code': order.referring_phys.doctor_no,
            'referring_phys_name': order.referring_phys.fullname,
            'clinical_diagnosis': order.clinical_diagnosis,
            # 'order_time': order.order_time,
            'created_time':order.created_at.strftime('%d/%m/%Y %H:%M'),
            'modality_type': order.modality_type,
            
            'pat_pid':order.patient.pid,
            'pat_fullname':order.patient.fullname,
            'pat_gender':order.patient.gender if order.patient.gender else 'U',
            'pat_dob':order.patient.dob,
            'pat_tel':order.patient.tel,
            'pat_address':order.patient.address,
            'pat_insurance_no':order.patient.insurance_no,

            'proc_id': proc.id,
            'proc_code': proc.procedure_type.code, 
            'proc_name': proc.procedure_type.name,

            'proc_study_iuid':proc.study_iuid,
            'proc_status':proc.status
                
        } for proc in order.procedure_list]        

        return order_data
 

    def _get_worklist_by_procid(self, pk):
        try:
            # select_related = list tables that related (foreignkey) with Procedure
            # order__patient means join patient table too (patient in order table)
            procedure = Procedure.objects.select_related('order','order__patient','order__referring_phys','procedure_type').get(pk = pk)

            if procedure is None:
                return self.cus_response_empty_data()
            
            order = procedure.order
            patient = order.patient

            # Empty data if this order has not report yet
            report_json = {}
            radiologist_json = {}
            try:
                report = Report.objects.select_related('radiologist').get(procedure=procedure.id)

                report_json = {
                    'id': report.id,
                    'findings': report.findings,
                    'conclusion': report.conclusion,
                    'scan_protocol':report.scan_protocol,
                    'status': report.status,
                    'created_time':report.created_at.strftime('%d/%m/%Y %H:%M'),
                }
                radiologist_json = {
                    "id":report.radiologist.id,
                    'code':report.radiologist.doctor_no,
                    'fullname':report.radiologist.fullname,
                    'sign':get_image_field_str(report.radiologist.sign),
                    'title':report.radiologist.title,
                }
            except Report.DoesNotExist:
                # Do  nothing
                pass   
                       
            procedure_json = {
                'proc_id':procedure.id,
                'status':procedure.status,
                'study_iuid':procedure.study_iuid,
                'code':procedure.procedure_type.code,
                'name':procedure.procedure_type.name
            }
            patient_json = {
                    'pid':patient.pid,
                    'fullname':patient.fullname,
                    'gender': patient.gender if patient.gender else 'U',
                    'dob':patient.dob,
                    'tel':patient.tel,
                    'address':patient.address,
                    'insurance_no':patient.insurance_no
            }
            

            referring_phys = {
                'code': order.referring_phys.doctor_no,
                'fullname': order.referring_phys.fullname,   
            }

            # Return data
            data = {
                'accession_no': order.accession_no,
                'modality_type': order.modality_type,
                'clinical_diagnosis': order.clinical_diagnosis,  
                'created_time':order.created_at.strftime('%d/%m/%Y %H:%M'),

                'referring_phys':referring_phys,
                'patient':patient_json,
                'procedure': procedure_json,
                'report':report_json,
                'radiologist': radiologist_json
        }
        except Procedure.DoesNotExist:
            return self.cus_response_empty_data()
                                        
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.response_NG(ec.E_SYSTEM, str(e))
        
        return self.response_success(data=data)            

    def log_queryset(self, queryset):
        orders_json = []

        # First, convert queryset to json to be able to get procedure data
        for order in queryset:
            for worklist in self._get_worklist_json(order):
                orders_json.append(worklist)      

        logger.info(orders_json)  