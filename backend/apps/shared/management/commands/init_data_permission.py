
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Load init data'

    def handle(self, *args, **kwargs):
        main_url = "apps/shared/data/"

        # Add initial data file here
        list_data = [
            "init_permissions.json",
            "init_roles.json",
            "init_user_role_permission_admin.json",
            "init_user_role_permission_bscd.json",
            "init_user_role_permission_bsdt.json",
            "init_user_role_permission_his.json",
            "init_user_role_permission_rad_mng.json",
            "init_user_role_permission_bod.json",
        ]
        for data in list_data:
            call_command("loaddata", main_url + data)
