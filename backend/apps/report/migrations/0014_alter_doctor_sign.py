# Generated by Django 3.2.4 on 2024-09-11 12:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('report', '0013_report_unique_report_procedure'),
    ]

    operations = [
        migrations.AlterField(
            model_name='doctor',
            name='sign',
            field=models.ImageField(blank=True, null=True, upload_to='signs/', verbose_name='sign'),
        ),
    ]