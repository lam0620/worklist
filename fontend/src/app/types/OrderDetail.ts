export interface OrderDetailProps{
    id : string;
    accession_no : string;
    req_phys_code : string;
    req_phys_name : string;
    referring_phys_name :string;
    clinical_diagnosis :    string;
    order_time : string;
    modality_type : string;
    patient_class: string;
    patient : {
        pid:string;
        fullname : string;
        gender : string;
        dob : string;
        tel : string;
        address : string;
        insurance_no : string;
    },
    procedures? : {
        proc_id : string;
        study_iuid : string;
        code : string;
        name : string;
        report : {
            id : string;
            accession_no : string;
            study_iuid :string;
            findings: string;
            conclusion: string;
            status : string;
            created_time :  string;
            radiologist : {
                id : string;
                doctor_no : string;
                fullname :  string;
                sign: string;
                title: string;
            }
        }
    }[];
}