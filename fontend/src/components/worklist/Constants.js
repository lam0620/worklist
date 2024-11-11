export const getStatusName = (status) => {
    const statusMap = {
      SC: "Scheduled",
      IM: "No Report",
      IP: "Reporting",
      CM: "Reported",
    };
    return statusMap[status] || "";
  };
  

export const checkViewStatus = (status) => {
    if (status === "IM" || status === "CM" || status === "IP") {
      return true;
    } else {
      return false;
    }
  };
  
export const checkReportStatus = (status) => {
    if(status === "IM" || status === "IP" || status === "CM") {
        return true;
    }else{
        return false;
    }
}

export const checkPrint = (status) => {
    if(status === "CM"){
        return true;
    }else{
        return false;
    }
}

export default {
  DRAFT: 'D',
  FINAL: 'F',
  CORRECTED: 'C',

  PERMISSION_VIEW_REPORT : "view_report",
  PERMISSION_ADD_REPORT : "add_report",
  PERMISSION_EDIT_REPORT : "edit_report",
  PERMISSION_DELETE_REPORT : "delete_report",

  USER_MNG_URL: process.env.USER_MNG_URL || 'http://localhost:3000',
  API_ENDPOINT: process.env.API_BASE_URL || 'http://localhost:8000/api',
  LOGIN_URL: process.env.USER_MNG_URL + '/login',

  DCM_API_ENDPOINT: process.env.DCM_API_ENDPOINT,
  IS_AUTH: process.env.IS_AUTH || 'true',

}

export const getFullModalityType = (type) => {
  let fullType = 'MRI';
  if (type === 'MR')
    fullType = 'MRI';
  else if (type === 'CT')
    fullType = 'CT Scan';
  else if (['DX', 'CR', 'DR', 'DX'].includes(type))
    fullType = 'XQUANG';
  return fullType;
}
