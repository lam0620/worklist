from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Dump data code permission'

    def handle(self, *args, **kwargs):
        main_url = "apps/shared/data/"
        list_data = [
            {"file": "code_permission.json", "app": "account.codepermission"},

        ]
        for data in list_data:
            with open(main_url + data['file'], 'w') as f:
                call_command("dumpdata", data['app'], indent=4, stdout=f, database='admin')
