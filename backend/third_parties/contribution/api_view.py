from asyncio import exceptions
from datetime import date
import json
import datetime
from copy import deepcopy
from typing import Union

from apps.report.models import IntegrationApp
from rest_framework.exceptions import AuthenticationFailed
from config.settings import DATETIME_INPUT_OUTPUT_FORMAT
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import QuerySet
from django.utils import translation
from library.constant import error_codes as ec
from library.constant.error_codes import ERROR_CODE_MESSAGE
from library.constant.language import (
    ID_TO_LANGUAGES, LANGUAGE_TYPE_VIETNAMESE, LANGUAGES_TO_ID
)
from library.functions import datetime_to_string
from rest_framework import generics, status
from rest_framework.parsers import JSONParser
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from third_parties.contribution.authentication import TokenAuthentication
from third_parties.contribution.exception import (
    CustomizeAPIException, convert_errors
)
from third_parties.contribution.paginator import CustomResultsSetPagination
from third_parties.contribution.serializers import EmptyRequestSerializer
from apps.account.utils import convert_return_data_format

import logging
# Get an instance of a logger
logger = logging.getLogger(__name__)

class DjangoOverRideJSONEncoder(DjangoJSONEncoder):
    """
    JSONEncoder subclass that knows how to encode date/time and decimal types.
    """

    def default(self, o):
        # See "Date Time String Format" in the ECMA-262 specification.
        if isinstance(o, datetime.datetime):
            r = datetime_to_string(o, DATETIME_INPUT_OUTPUT_FORMAT)
            return r
        else:
            return super(DjangoOverRideJSONEncoder, self).default(o)


class CustomAPIView(generics.GenericAPIView):
    authentication_classes = (TokenAuthentication,)
    permission_classes = ()
    parser_classes = (JSONParser,)
    pagination_class = CustomResultsSetPagination
    serializer_class = EmptyRequestSerializer

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.user = None
        # self.lang = DEFAULT_LANGUAGE_ID
        # self.lang_code = ID_TO_LANGUAGES[DEFAULT_LANGUAGE_ID]

    def dispatch(self, *args, **kwargs):

        return super().dispatch(*args, **kwargs)

    def initial(self, request, *args, **kwargs):
        self.renderer_classes = (JSONRenderer,)

        self.parse_common_params(request)
        translation.activate(self.lang_code)

    def parse_common_params(self, request):
        self.lang_code = request.META.get('HTTP_LANGUAGE', ID_TO_LANGUAGES.get(LANGUAGE_TYPE_VIETNAMESE))
        self.lang = LANGUAGES_TO_ID.get(self.lang_code, LANGUAGE_TYPE_VIETNAMESE)

    @staticmethod
    def _response(data, status_code=status.HTTP_200_OK, count=None):
        res = {
            'result':{
                'status': "OK",
                'code': "",
                "msg": ""
            },
            'data': data,
        }
        if count:
            res.update({
                'count': count
            })
        return Response(json.loads(json.dumps(res, cls=DjangoOverRideJSONEncoder)), status=status_code)
    

    def response_NG(status_code=200, code="", msg=""):
        res = {
            'result':{
                'status': "NG",
                'code': code,
                "msg": msg
            }
        }
        # return Response(res, status=status, content_type="application/json")
        return Response(json.loads(json.dumps(res, cls=DjangoOverRideJSONEncoder)), status=200)
    
    def response_item_NG(status_code=200, code="", item="", msg=""):
        res = {
            'result':{
                'status': "NG",
                'code': code,
                'item': item,
                "msg": msg
            }
        }
        # return Response(res, status=status, content_type="application/json")
        return Response(json.loads(json.dumps(res, cls=DjangoOverRideJSONEncoder)), status=200)
    
    def paginate_list(self, data):
        return self.paginator.paginate_list(data, self.request)

    def response_paging(self, queryset, serializer_response=None):
        if isinstance(queryset, QuerySet):
            if not queryset.query.select:
                queryset = queryset.values()

            page = self.paginate_queryset(queryset)
            return self.__response_paging(page, serializer_response)

        elif isinstance(queryset, list):
            if hasattr(self.paginator, 'page'):
                return self.__response_paging(queryset, serializer_response)
            else:
                result = self.paginate_list(queryset)
                return self.__response_paging(result, serializer_response)

    def __response_paging(self, data, serializer_response=None):
        if data is not None:
            if serializer_response:
                serializer = serializer_response(data, many=True)
                return self.get_paginated_response(serializer.data)
            else:
                return self.get_paginated_response(data)

        return self._response({
            'status': 200,
            'result': [],
            'next': 0,
            'previous': 0,
            'page_size': 0,
            'count': 0,

        })

    def response_success(self, data, serializer_response=None, status_code=status.HTTP_200_OK, count=None):
        if self.request.query_params.get('page'):
            return self.response_paging(data, serializer_response)

        if not isinstance(data, (list, dict)):
            raise TypeError(f'Object of type {data.__class__.__name__} '
                            f'is not JSON serializable')

        if serializer_response:
            ser = serializer_response(data=data, many=True if isinstance(data, list) else False)
            if not ser.is_valid():
                raise Exception(
                    f'Serializer {serializer_response.__name__} is not valid', ser.errors
                )
            data = ser.data
        return self._response(data, status_code, count=count)

    def http_exception(self, error_code=None, description=None, status_code=status.HTTP_400_BAD_REQUEST):
        raise CustomizeAPIException(
            status_code=status_code,
            detail=ERROR_CODE_MESSAGE.get(error_code, '') if not description else description
        )

    def cus_response(self, data, status=None, is_errors=False):
        if is_errors:
            data = convert_errors(data, status_code=status)
        else:
            # data.update({
            #     'status': status if status else status.HTTP_200_OK
            # })
            if 'results' in data:
                result = data['results']
                del data['results']
                data.update({
                    'result': result
                })
        return Response(data, status=status, content_type="application/json")

    def cus_response_internal(self, response: dict):
        """
            response:
            {
                'errors': {'detail': 'Mã công ty đã tồn tại'},
                'status': 400
            }
        """
        if response.get('status'):
            return self.cus_response(response, status=response.get('status'))
        return self.cus_response_500()

    def cus_response_403(self, msg_code = ''):
        return self.cus_response(convert_return_data_format(code=ec.NOT_HAVE_PERMISSION, error=True, data={}, msg="You don't have permission: "+msg_code), 
                                 status=status.HTTP_403_FORBIDDEN)

    def cus_response_created(self, data={}):
        return self.cus_response(convert_return_data_format(
            code=ec.CREATE_SUCCESS, error=False, data=data, msg='Created successfully'), status=status.HTTP_201_CREATED
        )

    def cus_response_deleted(self):
        return self.cus_response(convert_return_data_format(
            code=ec.DELETE_SUCCESS, error=False, data={}, msg='Deleted successfully'), status=status.HTTP_200_OK
        )

    def cus_response_updated(self):
        return self.cus_response(convert_return_data_format(
            code=ec.UPDATE_SUCCESS, error=False, data={}, msg='Updated successfully'), status=status.HTTP_200_OK
        )

    def cus_response_404(self, type=None):
        return self.cus_response(convert_return_data_format(
            code=ec.NOT_FOUND_CODE[type], error=True, data={}), status=status.HTTP_404_NOT_FOUND
        )

    def cannot_delete(self):
        return self.cus_response(convert_return_data_format(
            code=ec.CANNOT_DELETE, error=True, data={}), status=status.HTTP_200_OK
        )

    def cus_response_500(self):
        return self.cus_response({
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR,
            'detail': ec.ERROR_CODE_MESSAGE[ec.HTTP_500_INTERNAL_SERVER_ERROR]
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def cus_response_empty_data(self, type=None):
        """
        OK empty data response
        """
        return self.cus_response(convert_return_data_format(
            code=ec.DATA_NOT_FOUND, error=False, data={},msg=ec.DATA_NOT_FOUND_MSG), 
            status=status.HTTP_200_OK            
        )
    
    def nested(
            self,
            objects: Union[dict, list],
            map_with_key: str,
            children_fields: dict,
            children_list: list = None,
            key_child_map_parent=None
    ):
        
        objects_cp = deepcopy(objects)

        if isinstance(objects, dict):
            object_list = [objects_cp]
        else:
            object_list = list(objects_cp)

        if not isinstance(children_fields, dict):
            raise Exception('fields type is dict')

        if len(children_fields) < 1:
            return objects_cp

        if not objects_cp:
            return objects_cp

        for key in children_fields:
            assert isinstance(children_fields[key], (list, set)), 'children is type list'
            assert len(children_fields[key]) > 0, 'children is not null'

        if children_list:
            data_result = self.__nest_child_to_parent(
                parent_list=object_list,
                map_with_key=map_with_key,
                children_fields=children_fields,
                children_list=children_list,
                key_child_map_parent=key_child_map_parent
            )
        else:
            data_result = self.__nest_me(
                objects=object_list,
                map_with_key=map_with_key,
                fields=children_fields
            )
        if isinstance(objects, dict):
            return data_result[0] if data_result else {}
        else:
            return data_result

    def __nest_me(
            self,
            objects: list,
            map_with_key: str,
            fields: dict
    ):

        all_key_child = []
        for key_child, value_child in fields.items():
            all_key_child += list(value_child)

        nest_level_data = list(
            map(
                lambda x: self.__nest_level(
                    data_item=x, all_key_child=all_key_child,
                    fields=fields, map_with_key=map_with_key
                ),
                objects
            )
        )

        key_in_parent = set()
        data_parent = dict()

        for temp in list(nest_level_data):
            if temp[map_with_key] not in key_in_parent:
                key_in_parent.add(temp[map_with_key])
                data_parent.update({
                    temp[map_with_key]: temp
                })

            else:
                for key_field, value_field in fields.items():
                    if key_field not in temp and key_field not in data_parent[temp[map_with_key]]:
                        if isinstance(value_field, list):
                            data_parent[temp[map_with_key]].update({key_field: []})
                        else:
                            data_parent[temp[map_with_key]].update({key_field: {}})
                    else:
                        if not temp[key_field]:
                            continue

                        if isinstance(value_field, list):
                            if temp[key_field][0] not in data_parent[temp[map_with_key]][key_field]:
                                data_parent[temp[map_with_key]][key_field].append(temp[key_field][0])
                        else:
                            data_parent[temp[map_with_key]][key_field] = temp[key_field]

        return list(data_parent.values())

    def __nest_child_to_parent(self, parent_list, map_with_key: str,
                               children_fields: dict, children_list: list = None,
                               key_child_map_parent=None):

        all_key_child = []
        for key_child, value_child in children_fields.items():
            all_key_child += list(value_child)
        # rm_child_key = {map_with_key, key_child_map_parent} if key_child_map_parent else {map_with_key}
        # all_key_child = list(set(all_key_child) - rm_child_key)
        nest_level_data = list(
            map(
                lambda x: self.__nest_level(
                    data_item=x,
                    all_key_child=all_key_child,
                    fields=children_fields,
                    map_with_key=map_with_key,
                ),
                children_list
            )
        )

        for parent in parent_list:
            for child in nest_level_data:
                if key_child_map_parent:
                    if parent[map_with_key] == child[key_child_map_parent]:
                        self.__nest_type(parent=parent, child=child, children_fields=children_fields)
                else:
                    if parent[map_with_key] == child[map_with_key]:
                        self.__nest_type(parent=parent, child=child, children_fields=children_fields)
        return parent_list

    @staticmethod
    def __nest_type(parent, child, children_fields):
        for key_field, value_field in children_fields.items():

            if key_field not in child:
                if isinstance(value_field, list):
                    if key_field not in parent:
                        parent.update({
                            key_field: []
                        })
                else:
                    parent.update({
                        key_field: {}
                    })
            else:
                if not child[key_field]:
                    if key_field not in parent:
                        parent.update({
                            key_field: [] if isinstance(child[key_field], list) else {}
                        })

                elif isinstance(value_field, list):
                    if key_field not in parent:
                        parent.update({
                            key_field: [child[key_field][0]]
                        })
                    elif child[key_field][0] not in parent[key_field]:
                        parent[key_field].append(child[key_field][0])
                else:
                    parent.update({
                        key_field: child[key_field]
                    })

    @staticmethod
    def __nest_level(data_item: dict, all_key_child: list, fields: dict, map_with_key: str):
        child_temp = {}
        parent_temp = {}
        for key_temp, value_temp in data_item.items():
            if key_temp in all_key_child:
                for key_field, value_field in fields.items():
                    if key_temp in value_field:
                        if key_field not in child_temp:
                            child_temp.update({
                                key_field: {}
                            })
                        child_temp[key_field].update({
                            key_temp: value_temp
                        })
                if key_temp == map_with_key:
                    parent_temp.update({
                        key_temp: value_temp
                    })
            else:
                parent_temp.update({
                    key_temp: value_temp
                })

        for key_field, value_field in fields.items():
            if isinstance(value_field, list):
                temp_data_child = [child_temp[key_field]] if key_field in child_temp else []
            else:
                temp_data_child = child_temp[key_field] if key_field in child_temp else {}
            parent_temp.update({
                key_field: temp_data_child
            })

        return parent_temp
    

    def check_integration_token(self, token):
        try:
            now = date.today()
            app = IntegrationApp.objects.get(token=token)

            if not app:
                logger.error("The integration app token is not exist")
                raise AuthenticationFailed({
                    'result': {
                        'status': "NG",
                        'code': '',
                        'msg': "The integration app token is not exist"
                    },
                    'data': {}
                })        


            logger.info("Integaration app: " + app.name)
            if not app.is_active:
                logger.error("The integration app is not activated yet")

                raise AuthenticationFailed({
                    'result': {
                        'status': "NG",
                        'code': '',
                        'msg': "The integration app is not activated yet"
                    },
                    'data': {}
                })                
            # convert datetime to timestamp
            if now > app.expired_date:
                logger.error("The integration token already expired")

                raise AuthenticationFailed({
                    'result': {
                        'status': "NG",
                        'code': '',
                        'msg': "The integration token already expired"
                    },
                    'data': {}
                })
            
            return app.representer
        
        except IntegrationApp.DoesNotExist:
            logger.error("The integration app token is not exist")
            raise AuthenticationFailed({
                'result': {
                    'status': "NG",
                    'code': '',
                    'msg': "The integration app token is not exist"
                },
                'data': {}
            })
    
 
                
