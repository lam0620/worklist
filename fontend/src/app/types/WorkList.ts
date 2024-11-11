export interface WorkList  {
    id: string;
    accession_no: string; 
    referring_phys_code: string; 
    referring_phys_name: string; 
    clinical_diagnosis: string; 
    created_time: string; 
    modality_type: string; 
    pat_pid: string; 
    pat_fullname: string; 
    pat_gender: string; 
    pat_dob: string; 
    pat_tel: string; 
    pat_address: string; 
    pat_insurance_no: string; 
    proc_id: string; 
    proc_code: string; 
    proc_name: string; 
    proc_study_iuid: string; 
    proc_status: string; 
    study_iuid: string; 
    study_created_time: string; 
    num_series: string; 
    num_instances: string; 
    study_desc: string;
}