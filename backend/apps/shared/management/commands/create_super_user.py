import random
from django.conf import settings
from django.core.management.base import BaseCommand, CommandParser
from django.core.management import call_command
from apps.account.models import User


class Command(BaseCommand):
    help = 'Create super user'

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument('username', type=str)
        parser.add_argument('password', type=str)
        parser.add_argument('email', type=str)
        parser.add_argument('first_name', type=str)
        parser.add_argument('last_name', type=str)

    def handle(self, *args, **kwargs):
        try:
            kwargs['avatar_color'] = random.choice(settings.AVATAR_COLORS)
            kwargs['is_superuser'] = True
            kwargs['is_staff'] = True
            kwargs['is_active'] = True
            super_user = User.objects.create(
                username=kwargs['username'],
                email=kwargs['email'],
                first_name=kwargs['first_name'],
                last_name=kwargs['last_name'],
                avatar_color=kwargs['avatar_color'],
                is_superuser=kwargs['is_superuser'],
                is_staff=kwargs['is_staff'],
                is_active=kwargs['is_active'],
            )
            super_user.set_password(kwargs['password'])
            super_user.save()
            self.stdout.write(self.style.SUCCESS('Super user created successfully'))
        except Exception as e:
            self.stdout.write(self.style.ERROR('Failed to create super user'))
            self.stdout.write(self.style.ERROR(e))