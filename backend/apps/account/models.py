from uuid import uuid4

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.db import models
from third_parties.contribution.managers import AccountManager, ObjectManager
from apps.shared.models import BaseModels

"""
 Add new model/table, run:  python manage.py migrate
 Modify fieds in model/table, run:  python manage.py makemigrations
 Then run: python manage.py migrate account <first number retured at makemigrations command>

 Create initial data, run: python manage.py init_data
"""

class User(AbstractBaseUser, BaseModels):
    username_validator = UnicodeUsernameValidator()
    username = models.CharField(
        verbose_name='username',
        max_length=150,
        unique=True,
        help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.',
        validators=[username_validator]
    )
    first_name = models.CharField(verbose_name='first name', max_length=80, blank=True, null=True)
    last_name = models.CharField(verbose_name='last name', max_length=150, blank=True, null=True)
    email = models.EmailField(verbose_name='email address', null=True, blank=True, unique=True)
    avatar_color = models.CharField(max_length=30, blank=True, null=True, verbose_name='avatar color')
    is_staff = models.BooleanField(verbose_name='staff status', default=False)
    is_active = models.BooleanField(default=True, verbose_name='active')
    is_superuser = models.BooleanField(default=False,
        help_text=(
            'Designates that this user has all permissions without '
            'explicitly assigning them.'
        )
    )

    EMAIL_FIELD = 'email'
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']


    objects = ObjectManager()
    object = AccountManager()

    def __str__(self):
        return u'{} {}'.format(self.last_name, self.first_name)

    class Meta:
        db_table = 'user'
        verbose_name = 'User'
        ordering = ('-created_at',)
        default_permissions = ()
        permissions = ()


class Permission(BaseModels):
    code = models.CharField(verbose_name='code', max_length=80, blank=True, null=True)
    name = models.CharField(verbose_name='name', max_length=120, blank=True, null=True)
    description = models.CharField(verbose_name='description', max_length=255, blank=True, null=True)
    tag = models.CharField(verbose_name='tag', max_length=50, blank=True, null=True)
    
    objects = ObjectManager()

    def __str__(self):
        return self.code

    class Meta:
        db_table = 'permission'
        verbose_name = 'Mã quyền'
        default_permissions = ()
        ordering = ('-created_at',)
        permissions = ()


class Role(BaseModels):
    name = models.CharField(verbose_name='name', max_length=150, blank=True, null=True)
    description = models.CharField(verbose_name='description', max_length=255, blank=True, null=True)

    objects = ObjectManager()

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'role'
        verbose_name = 'Nhóm quyền'
        ordering = ('-created_at',)
        default_permissions = ()
        permissions = ()


class UserRole(BaseModels):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    objects = ObjectManager()

    def __str__(self):
        return self.id

    class Meta:
        db_table = 'users_roles'
        verbose_name = 'Admin User Role Group'
        default_permissions = ()
        permissions = ()


class RolePermission(BaseModels):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    objects = ObjectManager()

    def __str__(self):
        return self.id

    class Meta:
        db_table = 'roles_permissions'
        verbose_name = 'Admin User Role Group'
        default_permissions = ()
        permissions = ()
