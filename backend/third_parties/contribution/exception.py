from config import settings
from rest_framework import status
from rest_framework.exceptions import (
    APIException, AuthenticationFailed, ValidationError, NotFound, NotAuthenticated
)
from rest_framework.views import exception_handler
from library.constant.error_codes import INVALID_PAGE, UUID_NOT_VALID
from rest_framework.response import Response


class CustomizeAPIException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'A server error occurred.'
    default_code = 'error'

    def __init__(
            self,
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=None
    ):
        self.status_code = status_code
        self.detail = detail


def handler_validation_error(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        data = convert_error_validation(response.data, "NG")
        response.data = {
            'result': data,
            'data': {}
        }
    else:
        response = Response(data={
            'result': {
                'status': "NG",
                'code': UUID_NOT_VALID,
                'msg': ""
            },
            'data': {}
        })
    return response


def convert_error_validation(dict_error, status_code=None):
    data = {'code': '', 'item': "", 'msg':''}
    for field, value in dict_error.items():
        if isinstance(value, str):
            data['code'] = value
            data['msg'] = value
        elif isinstance(value, list):
            if isinstance(value[0], dict):
                for err in value:
                    if isinstance(err, dict):
                        tmp = {}
                        convert_dict_errors(err, tmp)
                        data['code'] = tmp.get('code')
                        data['item'] = tmp.get('item')
                        data['msg'] = tmp.get('detail')
            else:
                data['code'] = value[0].code
                data['item'] = field
                data['msg'] = value[0]
        elif isinstance(value, dict):
            tmp = {}
            convert_dict_errors(value, tmp)
            # key = list(tmp.keys())[0]
            # if (key != "code"):
            #     data['code'] = tmp.get('code')
            #     data['item'] = key #tmp.get('item')
            #     data['msg'] = tmp[key] #tmp.get('detail')
            # else:
            data['code'] = tmp.get('code')
            data['item'] = tmp.get('item')
            data['msg'] = tmp.get('detail')                   
        else:
            data['code'] = value.get('code')
            data['item'] = value.get('item')
            data['msg'] = tmp.get('detail')
    if status_code:
        data.update({
            'status': status_code
        })
    # data.update({
    #     "msg": ""
    # })
    return data


def convert_errors(dict_error, status_code=None):
    data = {'errors': {}}
    for field, value in dict_error.items():
        if field in settings.KEY_NOT_CONVERT_EXCEPTIONS:
            data['errors'].update({field: value})
        elif field not in settings.KEY_NOT_EXCEPTIONS:
            if isinstance(value, str):
                data['errors'].update({field: value})
            elif isinstance(value, list):
                if isinstance(value[0], dict):
                    for err in value:
                        if isinstance(err, dict):
                            tmp = {}
                            convert_dict_errors(err, tmp)
                            data['errors'].update(tmp)
                else:
                    data['errors'].update({field: value[0]})
            elif isinstance(value, dict):
                tmp = {}
                convert_dict_errors(value, tmp)
                data['errors'].update(tmp)
            else:
                data['errors'].update({field: value})
        else:
            data.update({field: value})
    if status_code:
        data.update({
            'status': status_code
        })
    return data


def convert_dict_errors(errors, tmp):
    for key, value in errors.items():
        if isinstance(value, str):
            tmp.update({key: value})
        elif isinstance(value, list):
            convert_list_error(value, key, tmp)
        elif isinstance(value, dict):
            convert_dict_errors(value, tmp)


def convert_list_error(error, key, tmp):
    for err in error:
        if isinstance(err, str):
            tmp.update({key: err})
        elif isinstance(err, list):
            tmp.update(convert_list_error(err, key, tmp))
        elif isinstance(err, dict):
            convert_dict_errors(err, tmp)


# def handler_validation_error(exc, context):
#     response = exception_handler(exc, context)

#     if response is not None:
#         error_data = {}
#         for temp in response.data:
#             error_data[temp] = response.data[temp][0] if len(response.data[temp]) > 0 else ''
#         response.data = {
#             'status': response.status_code,
#             'errors': error_data
#         }
#     return response


def handler_custom_api_exception(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            'status': response.status_code,
            'errors': {
                'detail': response.data.get('detail')
            }
        }
    return response


def handler_exception_authentication(exc, context):
    response = exception_handler(exc, context)

    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        response.status_code = status.HTTP_401_UNAUTHORIZED

    try:
        if exc.detail.get('status'):
            response.status_code = int(exc.detail.get('status'))
    except:  # noqa
        pass
    return response


def handler_exception_not_found(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            'result': {
                'status': "NG",
                'code': INVALID_PAGE,
                'msg': ""
            },
            'data': {}
        }
    return response


HANDLER_EXCEPTION = {
    CustomizeAPIException.__name__: handler_custom_api_exception,
    ValidationError.__name__: handler_validation_error,
    AuthenticationFailed.__name__: handler_exception_authentication,
    NotFound.__name__: handler_exception_not_found
}


def customize_exception_handler(exc, context):
    func_gateway = HANDLER_EXCEPTION.get(
        exc.__class__.__name__
    )
    if not func_gateway:
        response = exception_handler(exc, context)
        if not settings.DEBUG and response is not None:
            response.data = {
                'status': response.status_code,
                'errors': {
                    'detail': "A server error occurred."
                }
            }
        else:
            return response
    else:
        response = func_gateway(exc, context)

    return response
