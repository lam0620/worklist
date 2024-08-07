SWAGGER_SETTINGS = {
    'LOGIN_URL': '/',
    'LOGOUT_URL': '/logout',
    'DEFAULT_MODEL_DEPTH': -1,
    'USE_SESSION_AUTH': False,
    'SHOW_COMMON_EXTENSIONS': False,
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header'
        }
    },
    'SUPPORTED_SUBMIT_METHODS': ['get', 'post', 'put', 'delete', 'patch'],
}
