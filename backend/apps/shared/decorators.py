from django.http import Http404

from apps.shared.utils import check_uuid


def validate_pk(func):
    def inner(cls, request, *args, **kwargs):
        if 'pk' in kwargs:
            if not check_uuid(kwargs['pk']):
                raise Http404
        return func(cls, request, *args, **kwargs)

    return inner


def flex_field_serializer_decorator(klass, params):
    class WrapperFlexFieldSerializer(klass):
        def __init__(self, *args, **kwargs):
            if isinstance(params, dict):
                kwargs.update(params)

            super(klass, self).__init__(*args, **kwargs)

    return WrapperFlexFieldSerializer
