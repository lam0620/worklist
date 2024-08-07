from apps.account.models import Role, UserRole, RolePermission


class CheckPermission:
    def __init__(self, codename, user_id):
        self.user_id = user_id
        self.codename = codename.lower()

    def check(self):
        """
        Check if the user has the specified permission.

        Returns:
            bool: True if the user has the permission, False otherwise.
        """
        try:
            return RolePermission.objects.filter(
                role__userrole__user__id=self.user_id,
                permission__code=self.codename
            ).exists()
        except UserRole.DoesNotExist:
            return False
        except RolePermission.DoesNotExist:
            return False
        except Role.DoesNotExist:
            return False
        except Exception as e: # noqa
            return False
