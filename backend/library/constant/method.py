METHOD_GET = "GET"
METHOD_POST = "POST"
METHOD_PUT = 'PUT'
METHOD_DELETE = 'DELETE'
METHOD_PATCH = 'PATCH'
METHOD_OPTIONS = 'OPTIONS'

METHOD_TYPE = {
    METHOD_GET: 'GET',
    METHOD_POST: 'POST',
    METHOD_PUT: 'PUT',
    METHOD_DELETE: 'DELETE',
    METHOD_PATCH: 'PATCH',
    METHOD_OPTIONS: 'OPTIONS'
}

METHOD_TYPE_CHOICE = ((k, v) for k, v in METHOD_TYPE.items())
METHOD_TYPE_LIST = [(k, v) for k, v in METHOD_TYPE.items()]

PATH_TYPE_SWAGGER = 'swagger'
PATH_TYPE_DB = 'db'

FILTER_TYPE_SWAGGER_AND_DB = 1
FILTER_TYPE_SWAGGER = 2
FILTER_TYPE_DB = 3
FILTER_TYPE_PATH = {
    FILTER_TYPE_SWAGGER_AND_DB: 'swagger_and_db',
    FILTER_TYPE_SWAGGER: PATH_TYPE_SWAGGER,
    FILTER_TYPE_DB: PATH_TYPE_DB
}

# Type filter
TYPE_PRE_WEEK = 1
TYPE_CURRENT_WEEK = 2
TYPE_PRE_MONTH = 3
TYPE_CURRENT_MONTH = 4
TYPE_CURRENT_YEAR = 7

# Type filter user login
TYPE_TO_DAY = 1
TYPE_3_DAY = 3
TYPE_7_DAY = 7

# Type filter
TYPE_TRIAL_PROCESS = 1
TYPE_CONTRACT = 2
TYPE_EXPIRE = 3
TYPE_TRIAL_CONTRACT = 4
TYPE_TRIAL_EXPIRE = 5
TYPE_PUR_SUB = 6
