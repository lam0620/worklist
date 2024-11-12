export interface ReportDetailByProcID {
    id: string; 
    accession_no: string; 
    study_iuid: string; 
    findings: string; 
    conclusion: string; 
    scan_protocol: string; 
    status: string; 
    created_time: string; 
    image_link: string; 
    radiologist: { 
        id: string; 
        doctor_no: string; 
        fullname: string; 
        sign: string; 
        title: string; 
    }; 
    patient: { 
        pid: string; 
        fullname: string; 
        gender: string; 
        dob: string; 
    }; 
    procedure: { 
        proc_id: string; 
        code: string; 
        name: string; 
    };        
}