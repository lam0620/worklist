# import logging
# import os
#
# from django.db import transaction
# from django.http import Http404
# from django.utils.decorators import method_decorator
# from django.utils.translation import ugettext_lazy as _
# from django.views.decorators.vary import vary_on_cookie
# from rest_framework import status
# from rest_framework.exceptions import ValidationError
#
# from apps.shared.decorators import validate_pk
# from apps.shared.utils import CusResponse
#
# logger = logging.getLogger(__name__)
#
#
# class ListMixins:
#     def list(self, request, check_perm={}, *args, **kwargs):
#         queryset = self.filter_queryset(
#             self.get_queryset().filter(**kwargs, is_delete=False)
#         )
#         page = self.paginate_queryset(queryset)
#         if page is not None:
#             serializer = self.serializer_class(page, many=True)
#             return self.get_paginated_response(serializer.data)
#         serializer = self.serializer_class(queryset, many=True)
#         return CusResponse({
#             'result': serializer.data, 'status': status.HTTP_200_OK
#         }, status=status.HTTP_200_OK)
#
#
# class CreateMixins:
#     def create(self, request, check_perm={}, *args, **kwargs):
#         if hasattr(request, 'user_login'):
#             serializer = self.serializer_create(data=request.data)
#             serializer.is_valid(raise_exception=True)
#             instance = self.perform_create(serializer, request.user_login)
#             if not isinstance(instance, Exception):
#                 result_data = self.serializer_class(instance).data
#                 return CusResponse({
#                     'status': status.HTTP_201_CREATED,
#                     'result': result_data
#                 }, status=status.HTTP_201_CREATED)
#             elif isinstance(instance, ValidationError):
#                 raise instance
#             return CusResponse({
#                 'status': status.HTTP_500_INTERNAL_SERVER_ERROR,
#                 'detail': _("An unexpected error occurred, the update was not changed.")
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR, is_errors=True)
#         return CusResponse({
#             'status': status.HTTP_403_FORBIDDEN,
#             'detail': _('Login was expired. Please login and try again.')
#         }, status=status.HTTP_403_FORBIDDEN, is_errors=True)
#
#     @classmethod
#     def perform_create(cls, serializer, user_login=None):
#         try:
#             with transaction.atomic():
#                 instance = serializer.save(user_created=user_login['id'])
#             return instance
#         except Exception as e:
#             logger.error(e, exc_info=True)
#             return e
#
#
# class RetrieveMixins:
#     @method_decorator(vary_on_cookie)
#     def retrieve(self, request, check_perm={}, auth_pass=False,  *args, **kwargs):
#         if hasattr(request, 'user_login') or auth_pass:
#             instance = self.filter_queryset(self.get_queryset().filter(**kwargs, is_delete=False)).first()
#             if instance:
#                 serializer = self.serializer_class(instance)
#                 return CusResponse({'result': serializer.data}, status=status.HTTP_200_OK)
#             raise Http404
#         return CusResponse({
#             'status': status.HTTP_403_FORBIDDEN,
#             'detail': _('Login was expired. Please login and try again.')
#         }, status=status.HTTP_403_FORBIDDEN, is_errors=True)
#
#
# class DestroyMixins:
#     def destroy(self, request, check_perm={}, is_many=False, *args, **kwargs):
#         if hasattr(request, 'user_login'):
#             if not is_many:
#                 instance = self.filter_queryset(self.get_queryset().filter(**kwargs, is_delete=False)).first()
#                 if instance:
#                     state = self.perform_destroy(
#                         instance,
#                         purge=check_perm.get('purge', False),
#                         remove_file=check_perm.get('remove_file', False)
#                     )
#                     if state:
#                         return CusResponse({
#                             'status': status.HTTP_204_NO_CONTENT,
#                             'detail': _('The information was successfully deleted.')
#                         }, status=status.HTTP_204_NO_CONTENT
#                         )
#                     return CusResponse({
#                         'status': status.HTTP_500_INTERNAL_SERVER_ERROR,
#                         'detail': _('An unexpected error occurred, the update was not changed.')
#                     }, status=status.HTTP_500_INTERNAL_SERVER_ERROR
#                     )
#                 raise Http404
#         return CusResponse({
#             'status': status.HTTP_403_FORBIDDEN,
#             'detail': _('Login was expired. Please login and try again.')
#         }, status=status.HTTP_403_FORBIDDEN, is_errors=True)
#
#     @classmethod
#     def perform_destroy(cls, instance, purge=False, remove_file=False):
#         try:
#             with transaction.atomic():
#                 if purge:
#                     if remove_file:
#                         if os.path.isfile(instance.file_path):
#                             os.remove(instance.file_path)
#                     instance.delete()
#                     return True
#                 else:
#                     instance.is_delete = True
#                     instance.save(update_fields=['is_delete'])
#             return True
#         except Exception as e:
#             print(e)
#         return False
