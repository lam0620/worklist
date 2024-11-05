export interface ReportDetailProps {
    id : string;
    accession_no : string;
    study_iuid : string;
    scan_protocol: string;
    findings : string;
    conclusion : string;
    status : string;
    created_time : string;
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
    }

}