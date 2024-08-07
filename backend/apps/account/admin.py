from django.contrib import admin

from apps.account.models import Role, Permission


@admin.register(Permission)
class CodePermissionAdmin(admin.ModelAdmin):
    search_fields = ('name', 'code')
    list_display = ('id', 'code', 'name',)
    ordering = ('code',)


@admin.register(Role)
class AdminRoleGroupAdmin(admin.ModelAdmin):
    search_fields = ('name', )
    list_display = ('name', 'delete_flag', 'created_at')
    ordering = ('-created_at',)
