import os

from django.utils.translation import ugettext_lazy as _

PAGINATOR_PER_PAGE = 20

# --- Sort method ---
ORDER_BY_ASC = 1
ORDER_BY_DESC = 2

SORT_TYPE = {
    ORDER_BY_ASC: _('asc'),
    ORDER_BY_DESC: _('desc'),
}

SORT_TYPE_CHOICE = ((k, v) for k, v in SORT_TYPE.items())
SORT_TYPE_LIST = [(k, v) for k, v in SORT_TYPE.items()]

SORT_TYPE_TO_ID = {
    'asc': ORDER_BY_ASC,
    'desc': ORDER_BY_DESC
}

ROOT_PATH = os.path.dirname(os.path.abspath(__file__))
