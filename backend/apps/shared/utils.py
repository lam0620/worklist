import json
import logging
import os
import random
import re
import string
from datetime import datetime, timedelta
from uuid import UUID, uuid4

import validators
from django.conf import settings
from django.db.models import ManyToOneRel
from django.utils.translation import ugettext_lazy as _
from rest_framework.response import Response
from third_parties.contribution.exception import convert_errors

logger = logging.getLogger(__name__)


def CusResponse(data, status=None, is_errors=False):
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

# other


def remove_special_chars(char):
    return char.strip().translate({ord(c): '' for c in '!@#$%^&*()[]{};:,./<>?\|`~-=_+"'})


def upload_logo_dir(instance, filename):
    now = datetime.now()
    path = os.path.join(settings.MEDIA_ROOT, str(
        instance.org), 'logo', str(instance.id), str(now.month))
    path_media = os.path.join(
        str(instance.org), 'logo', str(instance.id), str(now.month))
    try:
        os.makedirs(path)
    except Exception:
        pass

    return os.path.join(path_media, filename)


def format_message(api, method, status, username, user_id, body=None, message=None, org=None, data=None):
    try:
        result = {
            'api_name': api.__class__.__name__,
            'api_method': method,
            'api_status': status,
            'api_content': body,
            'user': '{}-{}-{}'.format(username, user_id, org),
            'message': str(message),
            'data': str(data)
        }
        return json.dumps(result)
    except Exception as e:
        print(e)


# uuid
def check_uuid(text, version=4):
    try:
        UUID(str(text), version=4)
        return True
    except Exception:
        return False


def convert_uuid(text, version=4):
    try:
        if isinstance(text, str):
            return UUID(str(text), version=4)
        if check_uuid(text, 4):
            return text
    except Exception as e:
        logger.error(e, exc_info=True)
    return None


# reference
def list_field_change(func):
    def inner(cls, instance, validate_data):
        field_change = []
        if isinstance(validate_data, dict):
            for key, value in validate_data.items():
                data = getattr(instance, key)
                if data != value:
                    setattr(instance, key, value)
                    field_change.append(key)
            return func(cls, instance, validate_data, field_change)
        raise ValueError(_('Validate data not dict'))

    return inner


# service check master data
def service_check_master_data(instance):
    for rel in instance._meta.get_fields():
        if type(rel) == ManyToOneRel:
            name_related = rel.get_accessor_name()
            objects = getattr(instance, name_related).all()
            if objects:
                return False
    return True


def check_slug(_value):
    if _value:
        if validators.slug(_value):
            return True
    return False


# json
class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            # if the obj is uuid, we simply return the value of uuid
            return obj.hex
        elif isinstance(obj, datetime):
            return obj.strftime(settings.REST_FRAMEWORK.get('DATETIME_FORMAT', '%Y-%m-%d %H:%M:%S'))
        return json.JSONEncoder.default(self, obj)


def create_range_datetime(start_datetime, end_datetime, step):
    range_datetime = [start_datetime]
    date_modified = start_datetime

    while date_modified < end_datetime:
        date_modified += timedelta(days=step)
        range_datetime.append(date_modified)
    return range_datetime


def my_random_string(string_length=6):
    """Returns a random string of length string_length."""
    random = str(uuid4())
    random = random.upper()
    random = random.replace("-", "")
    return random[0:string_length]


def remove_vietnamese_tones(str):
    str = re.sub(r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a', str)
    str = re.sub(r'[ÀÁẠẢÃĂẰẮẶẲẴÂẦẤẬẨẪ]', 'A', str)
    str = re.sub(r'[èéẹẻẽêềếệểễ]', 'e', str)
    str = re.sub(r'[ÈÉẸẺẼÊỀẾỆỂỄ]', 'E', str)
    str = re.sub(r'[òóọỏõôồốộổỗơờớợởỡ]', 'o', str)
    str = re.sub(r'[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]', 'O', str)
    str = re.sub(r'[ìíịỉĩ]', 'i', str)
    str = re.sub(r'[ÌÍỊỈĨ]', 'I', str)
    str = re.sub(r'[ùúụủũưừứựửữ]', 'u', str)
    str = re.sub(r'[ƯỪỨỰỬỮÙÚỤỦŨ]', 'U', str)
    str = re.sub(r'[ỳýỵỷỹ]', 'y', str)
    str = re.sub(r'[ỲÝỴỶỸ]', 'Y', str)
    str = re.sub(r'[Đ]', 'D', str)
    str = re.sub(r'[đ]', 'd', str)
    return str


def convert_text_to_url(str):
    str = remove_vietnamese_tones(str).replace(" ", "-").lower()
    return str


def general_random_text(length=10):
    letters = string.ascii_letters + string.digits
    random_string = ''.join(random.choice(letters) for i in range(length))
    return random_string
