export interface ReportDetailProps {
    id : string;
    accession_no : string;
    study_iuid : string;
    scan_protocol: string;
    findings : string;
    conclusion : string;
    status : string;
    created_time : string;
    clinical_diagnosis: string;
    referring_phys_code: string;
    referring_phys_name: string;
    modality_type: string;
    radiologist : {
        id : string;
        doctor_no : string;
        fullname : string;
        sign : string;
        title : string;
    };
    procedure : {
        proc_id : string;
        code : string;
        name : string;
    };
    image_link : string;
    patient : {
        pid : string;
        fullname :string;
        gender : string;
        dob: string;
        tel: string;
        address: string;
        insurance_no:string;
    }

}