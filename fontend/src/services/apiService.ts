import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;



//login
export const Login = async (data: { [key: string]: string }) => {
  return axios.post(`${API_BASE_URL}/auth/login`, data);
}

//info
export const fetchInfo = async () => {
  return axios.get(`${API_BASE_URL}/me`);
}


// accounts
export const fetchAccounts = async (params: { [key: string]: any } = {}) => {
  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
  return axios.get(`${API_BASE_URL}/accounts?${queryString}`);
};

export const fetchAccountsList = async () => {
  return axios.get(`${API_BASE_URL}/accounts`);
}

export const fetchAccountById = async (id: string) => {
  return axios.get(`${API_BASE_URL}/accounts/${id}`);
}

export const CreateAccount = async (data: { [key: string]: any }) => {
  return axios.post(`${API_BASE_URL}/accounts`, data);
}

export const UpdateAccount = async (id: string, data: { [key: string]: any }) => {
  return axios.put(`${API_BASE_URL}/accounts/${id}`, data);
}

export const DeleteAccount = async (id?: string) => {
  return axios.delete(`${API_BASE_URL}/accounts/${id}`);
}

export const DeleteAccounts = async (ids?: string[]) => {
  return axios.delete(`${API_BASE_URL}/accounts`, {
    data: { ids_user: ids },
  });
}

// Roles

export const fetchRolesList = async (params: { [key: string]: any } = {}) => {
  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
  return axios.get(`${API_BASE_URL}/groups?${queryString}`);
}

export const fetchRoleById = async (id: string) => {
  return axios.get(`${API_BASE_URL}/groups/${id}`);
}

export const CreateRole = async (data: { [key: string]: any }) => {
  return axios.post(`${API_BASE_URL}/groups`, data);
}

export const UpdateRole = async (id: string, data: { [key: string]: any }) => {
  return axios.put(`${API_BASE_URL}/groups/${id}`, data);
}

export const DeleteRole = async (id?: string) => {
  return axios.delete(`${API_BASE_URL}/groups/${id}`);
}

export const DeleteRoles = async (ids_group?: string[]) => {
  return axios.delete(`${API_BASE_URL}/groups`, {
    data: { ids_group },
  });
}

// Permissions
export const fetchPermissionsList = async (params: { [key: string]: any } = {}) => {
  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
  return axios.get(`${API_BASE_URL}/permissions?${queryString}`);
}

export const fetchPermissionById = async (id: string) => {
  return axios.get(`${API_BASE_URL}/permissions/${id}`);
}

export const CreatePermission = async (data: { [key: string]: any }) => {
  return axios.post(`${API_BASE_URL}/permissions`, data);
}

export const UpdatePermission = async (id: string, data: { [key: string]: any }) => {
  return axios.put(`${API_BASE_URL}/permissions/${id}`, data);
}

export const DeletePermission = async (id: string) => {
  return axios.delete(`${API_BASE_URL}/permissions/${id}`);
}

export const ChangePassword = async (data: { [key: string]: string }) => {
  return axios.put(`${API_BASE_URL}/auth/change-password`, data);
}

export const UpdateProfile = async (data: { [key: string]: any }) => {
  return axios.put(`${API_BASE_URL}/me`, data);
}

export const InfoProfileUser = async () => {
  return axios.get(`${API_BASE_URL}/me`);
}

export const refreshAccessToken = async (data: { [key: string]: any }) => {
  return axios.post(`${API_BASE_URL}/auth/refresh-token`, data);
}

// Reset password

export const ResetPassword = async (data: { [key: string]: string }) => {
  return axios.post(`${API_BASE_URL}/accounts/reset-password`, data);
}

//Doctor
export const fetchDoctorById = async (id: string) => {
  return axios.get(`${API_BASE_URL}/doctors/${id}`);
}

export const fetchDoctorsList = async (params: { [key: string]: any } = {}) => {
  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
  return axios.get(`${API_BASE_URL}/doctors?${queryString}`);
};

export const CreateDoctor = async (data: { [key: string]: any }, config: Object) => {
  return axios.post(`${API_BASE_URL}/doctors`, data, config);
}

export const UpdateDoctor = async (id: string, data: { [key: string]: any }, config: Object) => {
  return axios.put(`${API_BASE_URL}/doctors/${id}`, data, config);
}

export const ChangeActiveDoctors = async (active?: string, ids?: string[]) => {
  return axios.patch(`${API_BASE_URL}/doctors`, {
    is_active: active,
    ids_doctor: ids
  });
};

export const DeleteDoctorSign = async (id : string | undefined, config: Object) => {
  return axios.patch(`${API_BASE_URL}/doctors/${id}`,{
    sign : "",
  }, config )
}

//Chart
export const fetchStatsOrderDoctors = async(param : string) => {
  return axios.get(`${API_BASE_URL}/stats/order-doctors/?type=${param}`)
  //return axios.get(`http://localhost:3001/api/stats/order-doctors/${param}`)
}
export const fetchStatsOrders = async(param : string) => {
  return axios.get(`${API_BASE_URL}/stats/orders/?year=${param}`)
  //return axios.get(`http://localhost:3001/api/stats/orders/${param}`)
}
export const fetchStatsReportDoctors = async(param : string) => {
  return axios.get(`${API_BASE_URL}/stats/report-doctors/?type=${param}`)
  //return axios.get(`http://localhost:3001/api/stats/report-doctors/${param}`)
}
export const fetchStatsReports = async(param : string) => {
  return axios.get(`${API_BASE_URL}/stats/reports/?year=${param}`)
  //return axios.get(`http://localhost:3001/api/stats/reports/${param}`)
}
export const fetchStatsStudies = async(param : string) => {
  return axios.get(`${API_BASE_URL}/stats/studies/?year=${param}`)
  //return axios.get(`http://localhost:3001/api/stats/studies/${param}`)
}

//Order
export const fetchOrdersList = async (params: { [key: string]: any } = {})=>{
  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
  return axios.get(`${API_BASE_URL}/orders?${queryString}`);
}

export const fetchOrderById = async (id: string) => {
  return axios.get(`${API_BASE_URL}/orders/${id}`);
}
export const CreateOrder = async (data: { [key: string]: any }) => {
  return axios.post(`${API_BASE_URL}/orders`, data);
}

export const UpdateOrder = async (id: string, data: { [key: string]: any }) => {
  return axios.put(`${API_BASE_URL}/orders/${id}`, data);
}

export const DeleteOrder = async (id?: string) => {
  return axios.delete(`${API_BASE_URL}/order/${id}`);
}

export const DeleteOrders = async (ids_group?: string[]) => {
  return axios.delete(`${API_BASE_URL}/orders`, {
    data: { ids_group },
  });
}

//Report
export const fetchReportsList = async (params: { [key: string]: any } = {})=>{
  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
  return axios.get(`${API_BASE_URL}/reports?${queryString}`);
}

export const fetchReportById = async (id: string) => {
  return axios.get(`${API_BASE_URL}/reports/${id}`);
}

//Patient
export const fetchPatientsList = async (params: { [key: string]: any } = {})=>{
  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
  return axios.get(`${API_BASE_URL}/patients?${queryString}`);
}

export const fetchPatientById = async (id: string) => {
  return axios.get(`${API_BASE_URL}/patients/${id}`);
}
export const UpdatePatient = async (id: string, data: { [key: string]: any }, config: Object) => {
  return axios.put(`${API_BASE_URL}/patients/${id}`, data, config);
}

//worklist
export const fetchWorklist = async (params: { [key: string]: any } = {}) => {
  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
  return axios.get(`${API_BASE_URL}/worklists?${queryString}`);
};

export const fetchRelatedStudies = async (id :string) => { //test API
  return axios.get(`${API_BASE_URL}/orders?patient_pid=${id}`);
};


export const fetchReportByProcId = async (id: string) => {
  return axios.get(`${API_BASE_URL}/reports/procedures/${id}`);
}




//from here for reportcomponent
import Utils from "../utils/utils"
const DCM_API_ENDPOINT = process.env.DCM_API_ENDPOINT;
const INTEG_API_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL_REPORT;

let IS_AUTH = "true";
try { IS_AUTH = Utils.IS_AUTH; } catch(e) {}

// For Dev
if (IS_AUTH !== "true") {
  // 'X': No auth need
  axios.defaults.headers.common["x-api-version"] = `X`;
}
export const fetchOrder = async (accession_no :any) => {
  return axios.get(`${INTEG_API_ENDPOINT}/orders?accession_no=${accession_no}`)
}

export const fetchRadiologists = async () => {
  return axios.get(`${INTEG_API_ENDPOINT}/doctors?type=R`)
}
export const fetchDoctorByUserId = async (userId : any) => {
return axios.get(`${INTEG_API_ENDPOINT}/doctors?user_id=${userId}`)
}

export const fetchReportByStudy = async (studyUid :any) => {
  return axios.get(`${INTEG_API_ENDPOINT}/reports?study_iuid=${studyUid}`)
}

export const createReport = async (data: { [key: string]: any }) => {
  return axios.post(`${INTEG_API_ENDPOINT}/reports`, data, { headers: { 'x-api-version': 'v2' } });
}

export const updateReport = async (id: string, data: { [key: string]: any }) => {
  return axios.put(`${INTEG_API_ENDPOINT}/reports/${id}`, data, { headers: { 'x-api-version': 'v2' } });
}
export const discardReport = async (id: string) => {
  return axios.delete(`${INTEG_API_ENDPOINT}/reports/${id}`);
}

export const fetchReportTemplates = async (modality :any) => {
  return axios.get(`${INTEG_API_ENDPOINT}/report-templates?modality=${modality}`)
}
export const createReportTemplate = async (data: { [key: string]: any }) => {
  return axios.post(`${INTEG_API_ENDPOINT}/report-templates`, data);
}
export const updateReportTemplate = async (id: string, data: { [key: string]: any }) => {
  return axios.put(`${INTEG_API_ENDPOINT}/report-templates/${id}`, data);
}


// UserContext use
export const getUserProfile = async () => {
  return axios.get(`${INTEG_API_ENDPOINT}/me`);
}

// dcm4chee api
export const fetchDicomMetadata = async (study_iuid : any) => {
  return axios.get(`${DCM_API_ENDPOINT}/rs/studies/${study_iuid}/metadata`)
}
//get scan
export const fetchScanProtocols = async (modality :any)=>{
  return axios.get(`${INTEG_API_ENDPOINT}/scan-protocols?modality=${modality}`)
}
export const fetchReportWorklist = (id: any) => {
  return axios.get(`${INTEG_API_ENDPOINT}/worklists/procedures/${id}`);
}