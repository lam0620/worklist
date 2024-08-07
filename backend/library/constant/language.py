from django.utils.translation import ugettext_lazy as _

LANGUAGES = (
    ('vi', _('Vietnamese')),
    ('en', _('English'))
)

LANGUAGE_TYPE_VIETNAMESE = 1
LANGUAGE_TYPE_ENGLISH = 2

LANGUAGE_TYPE = {
    LANGUAGE_TYPE_VIETNAMESE: _('Vietnamese'),
    LANGUAGE_TYPE_ENGLISH: _('English'),
}
LANGUAGE_TYPE_CHOICE = ((k, v) for k, v in LANGUAGE_TYPE.items())
LANGUAGE_TYPE_LIST = [(k, v) for k, v in LANGUAGE_TYPE.items()]

LANGUAGES_TO_ID = {
    'vi': LANGUAGE_TYPE_VIETNAMESE,
    'en': LANGUAGE_TYPE_ENGLISH
}

ID_TO_LANGUAGES = {
    LANGUAGE_TYPE_VIETNAMESE: 'vi',
    LANGUAGE_TYPE_ENGLISH: 'en'
}
