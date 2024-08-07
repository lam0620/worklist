from uuid import uuid4

from django.db import models
from django.utils import timezone

class BaseModels(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    created_at = models.DateTimeField(verbose_name='date created', default=timezone.now, editable=False)
    created_by = models.UUIDField(blank=True, null=True, verbose_name='created by')
    updated_at = models.DateTimeField(verbose_name='date modified', auto_now=True, editable=False, null=True)
    updated_by = models.UUIDField(blank=True, null=True, verbose_name='updated by')
    delete_flag = models.BooleanField(default=False, verbose_name='delete')

    class Meta:
        abstract = True