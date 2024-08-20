import logging
import datetime
import urllib

from typing import Dict, Union, List

from apps.account.models import (
    RolePermission, UserRole, Permission
)

logger = logging.getLogger(__name__)


def func_get_dict_code_permission():
    result = {}
    queryset = Permission.objects.all()
    for item in queryset:
        result[item.code] = item

    return result



def func_check_permission(user_id, code):
    role_group_list = UserRole.objects.filter(user_id=user_id).values_list('group__id', flat=True)
    code_per = RolePermission.objects.filter(
        group_id__in=list(role_group_list)
    ).values_list('code_permission__code', flat=True)

    code_per = list(dict.fromkeys(code_per))
    if code in code_per:
        return True
    return False


def convert_return_data_format(data: Union[Dict, List[Dict]], error: bool, code: str, msg:str="") -> (
        Dict)[str, Union[Dict[str, str], dict, List[dict]]]:
    """
    Convert the return data format.

    Args:
        data (Any): The data to be returned.
        error (bool): Indicates if there was an error.
        code (str): The error code.

    Returns:
        Dict[str, Any]: The converted data format.

    """
    if error:
        return {
            "result": {
                "status": "NG",
                "code": code,
                "msg": msg,
            },
            "data": data,
        }
    else:
        return {
            "result": {
                "status": "OK",
                "code": code,
                "msg": msg,
            },
            "data": data,
        }

"""
Convert YYYYMMDDHHMMSS (%Y%m%d%H%M%S) date string to datetime
"""
def convert_str_to_datetime(date_str:str, format_str = '%Y%m%d%H%M%S'):
    return datetime.datetime.strptime(date_str, format_str)
