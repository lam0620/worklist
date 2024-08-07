from apps.account.models import Role, RolePermission


def get_account_permissions(account_id):
    """
    Retrieves a distinct list of permission codes associated with an account's roles.
    """
    permissions = RolePermission.objects.filter(
        role__userrole__user__id=account_id,
    ).values_list('permission__code', flat=True).distinct()
    return list(permissions)

def get_account_roles(account_id):
    """
    Retrieves a distinct list of role names associated with an account.
    """
    roles = Role.objects.filter(
        userrole__user__id=account_id,
    ).values_list('name', flat=True).distinct()
    return list(roles)
