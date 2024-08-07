import requests
import json
import logging

from django.conf import settings
from urllib.parse import urlencode
from rest_framework import status

logger = logging.getLogger(__name__)

# response = ServerAPI(
#     api_url=API_CBASE_SERVICE_URL_V1 + 'users/get-user-by-data-type',
#     payload=payload,
#     token=API_CBASE_SERVICE_TOKEN
# ).post()
#    if response and 'result' in response:
#         return response['result']
#     return response


class ServerAPI:
    def __init__(
            self,
            api_url,
            payload=None,
            token=None,
            token_internal=None
    ):
        # server URL
        headers = {'content-type': 'application/json'}

        if token:
            headers.update({'Authorization': f"Bearer {token}"})
        elif token_internal:
            headers.update({'Authorization': f"Bearer {token_internal}"})

        self.url = api_url
        self.headers = headers
        self.payload = {} if payload is None else payload

    def get(self, params=None):
        arr_result = {'status': 503}
        try:
            # call API to get data
            url = '{}?{}'.format(self.url, urlencode(self.payload)) if self.payload else self.url
            rest = requests.get(url, headers=self.headers, stream=True, timeout=5000, params=params)
            data = rest.json()
            return data if isinstance(data, dict) else {'status': 503}
        except Exception as e:
            logger.error(e)
            return arr_result

    def post(self):
        arr_result = {'status': 503}
        try:
            rest = requests.post(
                self.url,
                data=json.dumps(self.payload),
                headers=self.headers,
                timeout=5000
            )
            data = rest.json()
            return data if isinstance(data, dict) else {'status': 503}

        except Exception as e:
            logger.error(e)
            return arr_result

    def put(self):
        arr_result = {'status': 503}
        try:
            rest = requests.put(
                self.url, data=json.dumps(self.payload),
                headers=self.headers,
                timeout=5000
            )
            data = rest.json()
            return data if isinstance(data, dict) else arr_result

        except Exception as e:
            logger.error(e)
            return arr_result

    def patch(self):
        arr_result = {'status': 503}
        try:
            rest = requests.patch(
                self.url, data=json.dumps(self.payload),
                headers=self.headers,
                timeout=5000
            )
            data = rest.json()
            return data if isinstance(data, dict) else arr_result

        except Exception as e:
            logger.error(e)
            return arr_result

    def delete(self):
        arr_result = {'status': 503}
        try:
            rest = requests.delete(
                self.url, data=json.dumps(self.payload),
                headers=self.headers,
                timeout=5000
            )
            if rest.status_code == status.HTTP_204_NO_CONTENT:
                return {'status': rest.status_code}

            data = rest.json()
            return data if isinstance(data, dict) else {'status': 503}

        except Exception as e:
            logger.error(e)
            return arr_result
