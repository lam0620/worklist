from uuid import uuid4

from django.db import models
from django.db.models import Q
from apps.account.models import User
from third_parties.contribution.managers import ObjectManager
from apps.shared.models import BaseModels

# Create your models here.

""" -----------------HIS PACS integration classes-------------"""
class Patient(BaseModels):
    pid = models.CharField(verbose_name='pid', max_length=100, blank=False, null=False)
    fullname = models.CharField(verbose_name='fullname', max_length=100, blank=False, null=False)
    # Sex value. M: Male, F: Female, O : Other: U: Unknown
    gender = models.CharField(verbose_name='sex', max_length=1, blank=True, null=True, default='U')
    # dob = models.DateField(verbose_name='dob', blank=True, null=True)
    dob = models.CharField(verbose_name='dob', max_length=8, blank=True, null=True)
    address = models.EmailField(verbose_name='address', null=True, blank=True)
    tel = models.CharField(verbose_name='Tel', max_length=20, blank=True, null=True)
    insurance_no = models.CharField( verbose_name='insurance number', max_length=50, blank=True, null=True)


    objects = ObjectManager()

    def __str__(self):
        return self.id

    class Meta:
        db_table = 'c_patient'
        verbose_name = 'Patient'
        default_permissions = ()
        permissions = ()

def rename_sign(instance, filename):
    filebase, extension = filename.split('.')
    return 'signs/%s.%s' % (instance.doctor_no, extension)

class Doctor(BaseModels):
    # username is unique and should be equal in the user model. = null if doctor is not a user
    # user = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True)
    user = models.OneToOneField(User, on_delete=models.DO_NOTHING, null=True)

    # user.last_name(ho) + first_name(ten)
    fullname = models.CharField(verbose_name='fullname', max_length=100, blank=False, null=False)
    # doctor_no is unique
    doctor_no = models.CharField(verbose_name='doctor no', max_length=100, unique=True, null=True, blank=True)
   
    # gender value. M: Male, F: Female, O : Other: U: Unknown
    gender = models.CharField(verbose_name='gender', max_length=1, blank=True, null=True, default='U')
    # Type value. P: referring physiscian, R: radiologist
    type = models.CharField(verbose_name='type', max_length=1, null=True, blank=True)
    # Bs., Ths.,....
    title = models.CharField(verbose_name='title', max_length=10, null=True, blank=True)
    # Signature
    #sign = models.CharField(verbose_name='sign', max_length=100, null=True, blank=True)
    sign = models.ImageField(upload_to=rename_sign, verbose_name='sign', null=True, blank=True)

    is_active = models.BooleanField(default=True, verbose_name='active')

    # tel = models.CharField(verbose_name='tel', max_length=15, null=True, blank=True)
    # address = models.CharField(verbose_name='address', max_length=255, null=True, blank=True)

    objects = ObjectManager()

    def __str__(self):
        return self.id

    class Meta:
        db_table = 'c_doctor'
        verbose_name = 'Doctor'
        default_permissions = ()
        ordering = ('-fullname',)
        permissions = ()

class Order(BaseModels):
    # One to Many
    patient = models.ForeignKey(Patient, on_delete=models.DO_NOTHING)
    # One to One Error:
    # ('duplicate key value violates unique constraint "c_order_referring_phys_id_key"\nDETAIL:  Key (referring_phys_id)=(dc375953-40ce-40bd-bf56-78684d3c6b75) already exists.\n',)
    # referring_phys = models.OneToOneField(Doctor, on_delete=models.DO_NOTHING)
    referring_phys = models.ForeignKey(Doctor, on_delete=models.DO_NOTHING)

    order_no = models.CharField(verbose_name='order no', max_length=100, blank=False, null=False)
    order_time = models.DateTimeField(verbose_name='order time', blank=False, null=False)
    #order_time = models.CharField(verbose_name='order time', max_length=14, blank=False, null=False)
    accession_no = models.CharField(verbose_name='accession no', max_length=100, blank=False, null=False)
    clinical_diagnosis = models.CharField( verbose_name='clinical diagnosis', max_length=2000, blank=False, null=False)    # Patient class value. I: inpatient, O: outpatient
    # modality type value. CT, MR, DR,...
    modality_type = models.CharField(verbose_name='modality type', max_length=5, blank=False, null=False)
    req_dept_code = models.CharField(verbose_name='requested dept code', max_length=100, null=False, blank=False)
    req_dept_name = models.CharField(verbose_name='requested dept name', max_length=100, null=False, blank=False)

    patient_class = models.CharField(verbose_name='patient class', default='U', max_length=1, blank=True, null=True)
    is_insurance_applied = models.BooleanField(verbose_name='is insurance', default=False)
    is_urgent = models.BooleanField(verbose_name='is urgent', default=False)


    objects = ObjectManager()

    def __str__(self):
        return self.id

    class Meta:
        db_table = 'c_order'
        verbose_name = 'Order'
        ordering = ('-created_at',)
        # couple unique
        unique_together = ('accession_no', 'delete_flag',)
        default_permissions = ()
        permissions = ()

class ProcedureType(BaseModels):
    code= models.CharField(verbose_name='code', max_length=100, unique=True, blank=False, null=False)
    name = models.CharField(verbose_name='name', max_length=100, blank=False, null=False)

    objects = ObjectManager()

    def __str__(self):
        return self.id

    class Meta:
        db_table = 'c_procedure_type'
        verbose_name = 'ProcedureType'
        default_permissions = ()
        permissions = ()

class Procedure(BaseModels):
    order = models.ForeignKey(Order, on_delete=models.DO_NOTHING)
    procedure_type = models.ForeignKey(ProcedureType, on_delete=models.DO_NOTHING)

    # SC (Schedule) => Wait to take image
    # IM: Image is stored
    # IP (Inprogess)  => Reporting
    # CM (Completed) => Reported
    status = models.CharField(verbose_name='status', max_length=2, blank=True, null=True)

    # Procedure of which study_iuid
    study_iuid = models.CharField(verbose_name='study instance uid', max_length=100, blank=True, null=True)
    study_time = models.DateTimeField(verbose_name='study time', blank=True, null=True)
    study_num_instances = models.IntegerField(verbose_name='number of instances', blank=True, null=True)
    

    objects = ObjectManager()

    def __str__(self):
        return self.id

    class Meta:
        db_table = 'c_procedure'
        verbose_name = 'Procedure'
        default_permissions = ()
        permissions = ()

class Report(BaseModels):
    radiologist = models.ForeignKey(Doctor, on_delete=models.DO_NOTHING)
    procedure = models.ForeignKey(Procedure, on_delete=models.DO_NOTHING, null=True)

    accession_no = models.CharField(verbose_name='accession no', max_length=100, blank=False, null=False)
    study_iuid = models.CharField(verbose_name='study instance uid', max_length=100, blank=False, null=False)
    # Status value. D: Draft, F: Final, C: Corrected, X: Delete
    status = models.CharField(verbose_name='status', max_length=1, blank=False, null=False)

    findings = models.TextField(verbose_name='findings', blank=True, null=True)
    conclusion = models.TextField( verbose_name='conclusion', blank=True, null=True)

    # Ky thuat chup
    scan_protocol = models.TextField(verbose_name='scan protocol', blank=True, null=True)

    objects = ObjectManager()

    def __str__(self):
        return self.id

    class Meta:
        db_table = 'c_report'
        verbose_name = 'Report'
        ordering = ('-created_at',)
        # couple unique
        # unique_together = ('accession_no', 'procedure', 'delete_flag=false',)
        constraints = [
            # models.UniqueConstraint(
            #     fields=["accession_no", "procedure"], 
            #     condition=Q(delete_flag=False),
            #     name="unique_report_procedure"
            # ),
            # A report has one and just one procedure and delete_flag = false
            models.UniqueConstraint(
                fields=["procedure"], 
                condition=Q(delete_flag=False),
                name="unique_procedure_deleteflag(false)"
            )
            # models.UniqueConstraint(
            #     fields=["study_iuid"], 
            #     condition=Q(delete_flag=False),
            #     name="unique_study_iuid_deleteflag(false)"
            # )
        ]
      
        default_permissions = ()
        permissions = ()


class ReportTemplate(BaseModels):
    name = models.CharField(verbose_name='name', max_length=200, blank=False, null=False)
    findings = models.TextField(verbose_name='findings', blank=False, null=False)
    conclusion = models.TextField( verbose_name='conclusion', blank=False, null=False)

    # system, custom
    type = models.CharField(verbose_name='type', max_length=6, blank=False, null=False, default='custom')
    modality = models.CharField(verbose_name='modality', max_length=5, blank=False, null=False)

    objects = ObjectManager()

    def __str__(self):
        return self.id

    class Meta:
        db_table = 'c_report_template'
        verbose_name = 'Report Template'
        default_permissions = ()
        ordering = ('name',)
        permissions = ()


class ScanProtocol(BaseModels):
    name = models.CharField(verbose_name='name', max_length=200, blank=False, null=False)
    # Thuong qui
    regular = models.TextField(verbose_name='regular', blank=False, null=False)
    # Co thuoc
    by_medicine = models.TextField( verbose_name='by medicine', blank=True, null=True)
    # Theo benh
    by_disease = models.TextField(verbose_name='by disease', blank=True, null=True)

    # depend on modality??
    modality = models.CharField(verbose_name='modality', max_length=5, blank=False, null=False)

    objects = ObjectManager()

    def __str__(self):
        return self.id

    class Meta:
        db_table = 'c_scan_protocol'
        verbose_name = 'Scan protocol'
        default_permissions = ()
        ordering = ('name',)
        permissions = ()

class IntegrationApp(BaseModels):
    name = models.CharField(verbose_name='name', max_length=100, blank=False, null=False)
    token= models.CharField(verbose_name='token', max_length=255, blank=False, null=False)
    expired_date = models.DateField(verbose_name='expired date', blank=False, null=False)
    is_active = models.BooleanField(default=True, verbose_name='active')
    representer = models.ForeignKey(User, on_delete=models.DO_NOTHING, blank=True, null=True)

    objects = ObjectManager()

    def __str__(self):
        return self.id

    class Meta:
        db_table = 'c_integration_app'
        verbose_name = 'Integration App'
        default_permissions = ()
        permissions = ()
