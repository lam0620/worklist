import coreapi
import coreschema
from django.core.paginator import InvalidPage
from django.utils.encoding import force_str
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.pagination import PageNumberPagination

from rest_framework.response import Response


class CustomResultsSetPagination(PageNumberPagination):
    page_size_query_param = 'pageSize'

    is_page_query_param = 'isPage'
    is_page_query_description = 'If false is not have paging, show all data'

    def get_schema_fields(self, view):
        assert coreapi is not None, 'coreapi must be installed to use `get_schema_fields()`'
        assert coreschema is not None, 'coreschema must be installed to use `get_schema_fields()`'
        fields = [
            coreapi.Field(
                name=self.page_query_param,
                required=False,
                location='query',
                schema=coreschema.Integer(
                    title='Page',
                    description=force_str(self.page_query_description)
                )
            )
        ]
        if self.page_size_query_param is not None:
            fields.append(
                coreapi.Field(
                    name=self.page_size_query_param,
                    required=False,
                    location='query',
                    schema=coreschema.Integer(
                        title='Page size',
                        description=force_str(self.page_size_query_description)
                    )
                )
            )
        if self.is_page_query_param is not None:
            fields.append(
                coreapi.Field(
                    name=self.is_page_query_param,
                    required=False,
                    location='query',
                    schema=coreschema.Boolean(
                        title='Is page',
                        description=force_str(self.is_page_query_description)
                    )
                )
            )
        return fields

    def get_schema_operation_parameters(self, view):
        parameters = [
            {
                'name': self.page_query_param,
                'required': False,
                'in': 'query',
                'description': force_str(self.page_query_description),
                'schema': {
                    'type': 'integer',
                },
            },
        ]
        if self.page_size_query_param is not None:
            parameters.append(
                {
                    'name': self.page_size_query_param,
                    'required': False,
                    'in': 'query',
                    'description': force_str(self.page_size_query_description),
                    'schema': {
                        'type': 'integer',
                    },
                },
            )
        if self.is_page_query_param is not None:
            parameters.append(
                {
                    'name': self.is_page_query_param,
                    'required': False,
                    'in': 'query',
                    'description': force_str(self.is_page_query_description),
                    'schema': {
                        'type': 'boolean',
                    },
                },
            )
        return parameters

    def paginate_queryset(self, queryset, request, view=None):
        if request.query_params.get('isPage', 'true') != 'false':
            self.is_page = True
            page_size = self.get_page_size(request)
            if not page_size:
                return None

            paginator = self.django_paginator_class(queryset, page_size)
            page_number = self.get_page_number(request, paginator)

            try:
                self.page = paginator.page(page_number)
            except InvalidPage as exc:
                msg = self.invalid_page_message.format(
                    page_number=page_number, message=str(exc)
                )
                raise NotFound(msg)

            if paginator.num_pages > 1 and self.template is not None:
                # The browsable API should display pagination controls.
                self.display_page_controls = True

            self.request = request
            return list(self.page)
        else:
            self.is_page = False
            return list(queryset)

    def get_paginated_response(self, data):
        if self.is_page:
            return Response(data={
                'result': {
                    'status': "OK",
                    'code': "",
                    "msg": ""
                },
                'data': data,
                'next': self.page.next_page_number() if self.page.has_next() else 0,
                'previous': self.page.previous_page_number() if self.page.has_previous() else 0,
                'count': self.page.paginator.count,
                'page_size': self.page.paginator.per_page,  # self.page_size,
            }, status=status.HTTP_200_OK)
        else:
            return Response(data={
                'count': len(data),
                'data': data,
                'result': {
                    'status': "OK",
                    'code': "",
                    "msg": ""
                },
            }, status=status.HTTP_200_OK)

    def paginate_list(self, data, request):
        page_size = self.get_page_size(request)
        paginator = self.django_paginator_class(data, page_size)
        page_number = self.get_page_number(request, paginator)

        try:
            self.page = paginator.page(page_number)
        except InvalidPage as exc:
            msg = self.invalid_page_message.format(
                page_number=page_number, message=str(exc)
            )
            raise NotFound(msg)

        if paginator.num_pages > 1 and self.template is not None:
            # The browsable API should display pagination controls.
            self.display_page_controls = True

        self.request = request
        return list(self.page)
