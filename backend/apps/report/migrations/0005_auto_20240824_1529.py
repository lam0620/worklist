# Generated by Django 3.2.4 on 2024-08-24 15:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('report', '0004_auto_20240824_1519'),
    ]

    operations = [
        migrations.AlterField(
            model_name='patient',
            name='address',
            field=models.EmailField(blank=True, max_length=254, null=True, verbose_name='address'),
        ),
        migrations.AlterField(
            model_name='patient',
            name='dob',
            field=models.CharField(blank=True, max_length=8, null=True, verbose_name='dob'),
        ),
        migrations.AlterField(
            model_name='patient',
            name='insurance_no',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='insurance number'),
        ),
        migrations.AlterField(
            model_name='patient',
            name='tel',
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name='Tel'),
        ),
    ]
