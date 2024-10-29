export interface WorkList  {
    id : string,
    accession_no : string,
    status : string,
    modality_type :string,
    created_time : string,
    patient :{
    pid : string,
    fullname : string,
    }
    procedure : {
    proc_id : string,
    code : string,
    name : string,
    count_image : string,
    }[],
}