from django.db import models


class BaseManage(models.Manager):
    def get_queryset(self):
        return super(BaseManage, self).get_queryset().filter(is_delete=False)


class ObjectsManage(models.Manager):
    def get_queryset(self):
        return super(ObjectsManage, self).get_queryset().filter()
