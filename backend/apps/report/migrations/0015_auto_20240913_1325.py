# Generated by Django 3.2.4 on 2024-09-13 13:25

import apps.report.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('report', '0014_alter_doctor_sign'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='report',
            name='unique_report_procedure',
        ),
        migrations.AlterField(
            model_name='doctor',
            name='sign',
            field=models.ImageField(blank=True, null=True, upload_to=apps.report.models.rename_sign, verbose_name='sign'),
        ),
        migrations.AddConstraint(
            model_name='report',
            constraint=models.UniqueConstraint(condition=models.Q(('delete_flag', False)), fields=('procedure',), name='unique_procedure_deleteflag(false)'),
        ),
    ]
