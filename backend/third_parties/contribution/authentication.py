import base64
import logging
from threading import local

import jwt
from config import settings
from django.utils import timezone
from library.constant.error_codes import (
    BEARER_TOKEN_NOT_FOUND, ERROR_CODE_MESSAGE, TOKEN_EXPIRED,
    
)
from rest_framework import exceptions
from rest_framework.authentication import (
    BaseAuthentication, get_authorization_header
)
from rest_framework.exceptions import AuthenticationFailed
from apps.account.models import User

logger = logging.getLogger(__name__)

_thread_locals = local()


def get_user_org():
    return getattr(_thread_locals, 'user_org', None)


class BaseTokenAuthentication(BaseAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        pass

    def get_bearer_token(self, request):
        auth = get_authorization_header(request).split()

        if not auth or auth[0].lower() != self.keyword.lower().encode():
            raise exceptions.AuthenticationFailed({
                'result': {
                    'status': "NG",
                    'code': ERROR_CODE_MESSAGE[BEARER_TOKEN_NOT_FOUND],
                    'msg': "Token Authentication Failed"
                },
                'data': {}
            })

        if len(auth) == 1 or len(auth) > 2:
            raise exceptions.AuthenticationFailed({
                 'result': {
                    'status': "NG",
                    'code': ERROR_CODE_MESSAGE[BEARER_TOKEN_NOT_FOUND],
                    'msg': "Token Authentication Failed"
                },
                'data': {}
            })
        try:
            token = auth[1].decode("utf-8")
            return token

        except Exception as e:  # noqa
            raise AuthenticationFailed({
                'result': {
                    'status': "NG",
                    'code': ERROR_CODE_MESSAGE[BEARER_TOKEN_NOT_FOUND],
                    'msg': str(e)
                },
                'data': {}
            })


class TokenAuthentication(BaseTokenAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        token = self.get_bearer_token(request)

        return self.check_token(token, request), None

    def check_token(self, token: str, request, is_dropdown=False):
        try:
            # decode JWT
            token_decode = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=settings.JWT_ALGORITHM
            )
            now = int(timezone.now().timestamp())
            # convert datetime to timestamp
            if now > token_decode['exp']:
                raise exceptions.AuthenticationFailed({
                    'result': {
                        'status': "NG",
                        'code': ERROR_CODE_MESSAGE[TOKEN_EXPIRED],
                        'msg': "The token already expired"
                    },
                    'data': {}
                })
            user = User.objects.get(id=token_decode['user_id'], is_active=True)
        
        except jwt.ExpiredSignatureError as e:
            raise exceptions.AuthenticationFailed({
                'result': {
                    'status': "NG",
                    'code': ERROR_CODE_MESSAGE[TOKEN_EXPIRED],
                    'msg': str(e)
                },
                'data': {}
            })

        except Exception as e:
            logger.error(e, exc_info=True)
            raise exceptions.AuthenticationFailed({
                'result': {
                    'status': "NG",
                    'code': ERROR_CODE_MESSAGE[BEARER_TOKEN_NOT_FOUND],
                    'msg': str(e)
                },
                'data': {}
            })
        if not user:
            raise exceptions.AuthenticationFailed({
                'result': {
                    'status': "NG",
                    'code': ERROR_CODE_MESSAGE[BEARER_TOKEN_NOT_FOUND],
                    'msg': "Login user is not exist"
                },
                'data': {}
            })

       

        return user
