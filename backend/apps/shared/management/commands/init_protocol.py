
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Load init data'

    def handle(self, *args, **kwargs):
        main_url = "apps/shared/data/"

        # Add initial data file here
        list_data = [
            "init_protocol.json",
        ]
        for data in list_data:
            call_command("loaddata", main_url + data)
