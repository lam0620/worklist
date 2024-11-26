export interface ReportDetailWorklist {
    accession_no : string;
    study_iuid : string;
    created_time : string;
    clinical_diagnosis: string;
    modality_type: string;
    referring_phys:{
        code:string,
        fullname:string,
    };
    radiologist : {
        id : string;
        code : string;
        fullname : string;
        sign : string;
        title : string;
    };
    procedure : {
        proc_id : string;
        code : string;
        name : string;
        status:string,
        study_iuid:string,
    };
    patient : {
        pid : string;
        fullname :string;
        gender : string;
        dob: string;
        tel: string;
        address: string;
        insurance_no:string;
    },
    report:{
        id:string,
        scan_protocol: string;
        findings : string;
        conclusion : string;
        status : string;
        created_time:string,
    }

}