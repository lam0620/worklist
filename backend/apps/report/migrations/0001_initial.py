# Generated by Django 3.2.4 on 2024-08-20 16:12

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Doctor',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False, verbose_name='date created')),
                ('created_by', models.UUIDField(blank=True, null=True, verbose_name='created by')),
                ('updated_at', models.DateTimeField(editable=False, null=True, verbose_name='date modified')),
                ('updated_by', models.UUIDField(blank=True, null=True, verbose_name='updated by')),
                ('delete_flag', models.BooleanField(default=False, verbose_name='delete')),
                ('fullname', models.CharField(max_length=100, verbose_name='fullname')),
                ('doctor_no', models.CharField(max_length=100, unique=True, verbose_name='doctor no')),
                ('gender', models.CharField(blank=True, default='U', max_length=1, null=True, verbose_name='gender')),
                ('type', models.CharField(blank=True, max_length=1, null=True, verbose_name='type')),
                ('title', models.CharField(blank=True, max_length=10, null=True, verbose_name='title')),
                ('sign', models.CharField(blank=True, max_length=100, null=True, verbose_name='sign')),
                ('is_active', models.BooleanField(default=True, verbose_name='active')),
            ],
            options={
                'verbose_name': 'Doctor',
                'db_table': 'c_doctor',
                'ordering': ('-fullname',),
                'permissions': (),
                'default_permissions': (),
            },
        ),
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False, verbose_name='date created')),
                ('created_by', models.UUIDField(blank=True, null=True, verbose_name='created by')),
                ('updated_at', models.DateTimeField(editable=False, null=True, verbose_name='date modified')),
                ('updated_by', models.UUIDField(blank=True, null=True, verbose_name='updated by')),
                ('delete_flag', models.BooleanField(default=False, verbose_name='delete')),
                ('order_no', models.CharField(max_length=100, verbose_name='order no')),
                ('order_time', models.DateTimeField(verbose_name='order time')),
                ('accession_no', models.CharField(max_length=100, verbose_name='accession no')),
                ('clinical_diagnosis', models.CharField(max_length=255, verbose_name='clinical diagnosis')),
                ('modality_type', models.CharField(max_length=5, verbose_name='modality type')),
                ('patient_class', models.CharField(blank=True, max_length=1, null=True, verbose_name='patient class')),
                ('req_dept_code', models.CharField(blank=True, max_length=100, null=True, verbose_name='requested dept code')),
                ('req_dept_name', models.CharField(blank=True, max_length=100, null=True, verbose_name='requested dept code')),
                ('is_insurance_applied', models.BooleanField(default=False, verbose_name='is insurance')),
                ('is_urgent', models.BooleanField(default=False, verbose_name='is urgent')),
            ],
            options={
                'verbose_name': 'Order',
                'db_table': 'c_order',
                'ordering': ('-created_at',),
                'permissions': (),
                'default_permissions': (),
            },
        ),
        migrations.CreateModel(
            name='Patient',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False, verbose_name='date created')),
                ('created_by', models.UUIDField(blank=True, null=True, verbose_name='created by')),
                ('updated_at', models.DateTimeField(editable=False, null=True, verbose_name='date modified')),
                ('updated_by', models.UUIDField(blank=True, null=True, verbose_name='updated by')),
                ('delete_flag', models.BooleanField(default=False, verbose_name='delete')),
                ('pid', models.CharField(max_length=100, verbose_name='pid')),
                ('fullname', models.CharField(max_length=100, verbose_name='fullname')),
                ('gender', models.CharField(blank=True, default='U', max_length=1, null=True, verbose_name='sex')),
                ('dob', models.CharField(blank=True, max_length=8, null=True, verbose_name='dob')),
                ('address', models.EmailField(blank=True, max_length=254, null=True, verbose_name='address')),
                ('tel', models.CharField(blank=True, max_length=20, null=True, verbose_name='Tel')),
                ('insurance_no', models.CharField(blank=True, max_length=50, null=True, verbose_name='insurance number')),
            ],
            options={
                'verbose_name': 'Patient',
                'db_table': 'c_patient',
                'permissions': (),
                'default_permissions': (),
            },
        ),
        migrations.CreateModel(
            name='ProcedureType',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False, verbose_name='date created')),
                ('created_by', models.UUIDField(blank=True, null=True, verbose_name='created by')),
                ('updated_at', models.DateTimeField(editable=False, null=True, verbose_name='date modified')),
                ('updated_by', models.UUIDField(blank=True, null=True, verbose_name='updated by')),
                ('delete_flag', models.BooleanField(default=False, verbose_name='delete')),
                ('code', models.CharField(max_length=100, unique=True, verbose_name='code')),
                ('name', models.CharField(max_length=100, verbose_name='name')),
            ],
            options={
                'verbose_name': 'ProcedureType',
                'db_table': 'c_procedure_type',
                'permissions': (),
                'default_permissions': (),
            },
        ),
        migrations.CreateModel(
            name='Procedure',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False, verbose_name='date created')),
                ('created_by', models.UUIDField(blank=True, null=True, verbose_name='created by')),
                ('updated_at', models.DateTimeField(editable=False, null=True, verbose_name='date modified')),
                ('updated_by', models.UUIDField(blank=True, null=True, verbose_name='updated by')),
                ('delete_flag', models.BooleanField(default=False, verbose_name='delete')),
                ('study_iuid', models.CharField(blank=True, max_length=100, null=True, verbose_name='study instance uid')),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='report.order')),
                ('procedure_type', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='report.proceduretype')),
            ],
            options={
                'verbose_name': 'Procedure',
                'db_table': 'c_procedure',
                'permissions': (),
                'default_permissions': (),
            },
        ),
        migrations.AddField(
            model_name='order',
            name='patient',
            field=models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='report.patient'),
        ),
        migrations.AddField(
            model_name='order',
            name='referring_phys',
            field=models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='report.doctor'),
        ),
        migrations.CreateModel(
            name='IntegrationApp',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False, verbose_name='date created')),
                ('created_by', models.UUIDField(blank=True, null=True, verbose_name='created by')),
                ('updated_at', models.DateTimeField(editable=False, null=True, verbose_name='date modified')),
                ('updated_by', models.UUIDField(blank=True, null=True, verbose_name='updated by')),
                ('delete_flag', models.BooleanField(default=False, verbose_name='delete')),
                ('name', models.CharField(max_length=100, verbose_name='name')),
                ('token', models.CharField(max_length=255, verbose_name='token')),
                ('expired_date', models.DateField(verbose_name='expired date')),
                ('is_active', models.BooleanField(default=True, verbose_name='active')),
                ('representer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Integration App',
                'db_table': 'c_integration_app',
                'permissions': (),
                'default_permissions': (),
            },
        ),
        migrations.CreateModel(
            name='Report',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False, verbose_name='date created')),
                ('created_by', models.UUIDField(blank=True, null=True, verbose_name='created by')),
                ('updated_at', models.DateTimeField(editable=False, null=True, verbose_name='date modified')),
                ('updated_by', models.UUIDField(blank=True, null=True, verbose_name='updated by')),
                ('delete_flag', models.BooleanField(default=False, verbose_name='delete')),
                ('accession_no', models.CharField(max_length=100, verbose_name='accession no')),
                ('study_iuid', models.CharField(max_length=100, verbose_name='study instance uid')),
                ('status', models.CharField(max_length=1, verbose_name='status')),
                ('findings', models.TextField(blank=True, null=True, verbose_name='findings')),
                ('conclusion', models.TextField(blank=True, null=True, verbose_name='conclusion')),
                ('procedure', models.ForeignKey(null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='report.procedure')),
                ('radiologist', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='report.doctor')),
            ],
            options={
                'verbose_name': 'Report',
                'db_table': 'c_report',
                'permissions': (),
                'default_permissions': (),
                'unique_together': {('accession_no', 'procedure', 'delete_flag')},
            },
        ),
        migrations.AlterUniqueTogether(
            name='order',
            unique_together={('accession_no', 'delete_flag')},
        ),
    ]
