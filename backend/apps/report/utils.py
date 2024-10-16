import logging
import datetime
import urllib

logger = logging.getLogger(__name__)


"""
Convert YYYYMMDDHHMMSS (%Y%m%d%H%M%S) date string to datetime
"""
def convert_str_to_datetime(date_str:str, format_str = '%Y%m%d%H%M%S'):
    return datetime.datetime.strptime(date_str, format_str)

def is_valid_str_datetime(date_str:str, format_str = '%Y%m%d%H%M%S'):
    try:
        datetime.datetime.strptime(date_str, format_str)
    except:
        return False

    return True
    
def get_image_link(request, studyInstanceUID):
    # return request.scheme +"://" + request.get_host() + "/viewer?StudyInstanceUIDs="+studyInstanceUID
    # Parse url, get hostname only
    host_port = urllib.parse.urlparse(request.scheme +"://" + request.get_host());
    return request.scheme +"://" + host_port.hostname + "/viewer?StudyInstanceUIDs="+studyInstanceUID

def is_valid(value, list):
    if value in list:
        return True
    return False

def is_valid_gender(value):
    if value in ('M', 'F', 'O', 'U'):
        return True
    return False

def is_valid_modality_type(value):
    if value in ('MR', 'CT', 'DX', 'CR', 'DR', 'XA', 'US'):
        return True
    return False

def is_valid_report_template_type(value):
    if value in ('system', 'custom'):
        return True
    return False

def get_image_field_str(image_field):
    new_value = ''
    if image_field:
        new_value = image_field.url
    return new_value    

def get_username(user):
    if user:
        return user.username
    return ""