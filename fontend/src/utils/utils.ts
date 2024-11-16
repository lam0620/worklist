export const getGenderLabel = (gender: string | undefined) => {
  const language = localStorage.getItem("i18nextLng");

  switch (gender) {
    case "F":
      return language === "vi" ? "Nữ" : language === "jp" ? "女性" : "Female";
    case "M":
      return language === "vi" ? "Nam" : language === "jp" ? "男性" : "Male";
    case "O":
      return language === "vi" ? "Khác" : language === "jp" ? "その他" : "Other";
    default:
      return language === "vi" ? "Chưa xác định" : language === "jp" ? "不明" : "Unknown";
  }
};



export const formatDate = (dateString: any) => {
  if (!dateString) return "";
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);
  return `${day}-${month}-${year}`;
};
export const formatYear = (dateString: any) => {
  if (!dateString) return "";
  const year = dateString.slice(0, 4);
  return `${year}`;
};

export const getReportStatusName = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    D: "Draft",
    F: "Approved",
    C: "Approved"
  };
  return statusMap[status] || "";
};

export const getStatusName = (status : string) : string => {
  const statusMap: { [key: string]: string } = {
    SC: "Scheduled",
    IM: "Unreported",
    IP: "Reporting",
    CM: "Reported",
  };
  return statusMap[status] || "";
};

export const checkViewStatus = (status : string) => {
  if (status === "IM" || status === "CM" || status === "IP") {
    return true;
  } else {
    return false;
  }
};

export const checkReportStatus = (status : string) => {
  if(status === "IM" || status === "IP" || status === "CM") {
      return true;
  }else{
      return false;
  }
}

export const checkPrint = (status : string) => {
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

  // html2text: html2text,
  // fetchData: fetchData,
  // isEmpty: isEmpty,
  // isObjectEmpty: isObjectEmpty,
  // getFullGender: getFullGender,
  // getFullGender_vn: getFullGender_vn,
  // getFullModalityType: getFullModalityType,
  // formatDate: formatDate,
  // getImageUrl: getImageUrl,

}

export const getFullModalityType = (type : string) => {
  let fullType = 'MRI';
  if (type === 'MR')
    fullType = 'MRI';
  else if (type === 'CT')
    fullType = 'CT Scan';
  else if (['DX', 'CR', 'DR', 'DX'].includes(type))
    fullType = 'XQUANG';
  return fullType;
}

var html2text = function (html : string) {
  var div = document.createElement('div');
  div.innerHTML = html;
  var text = div.innerText;
  div.remove();
  return text;
};

var isEmpty = (str : string) => {
  //if (typeof str == 'undefined' || !str || str.length === 0 || str === "" || !/[^\s]/.test(str) || /^\s*$/.test(str) || str.replace(/\s/g,"") === "") {
  if (typeof str == 'undefined' || str === 'undefined' || str === 'null' || !str || str == "" || str == null) {
    return true;
  } else {
    return false;
  }
};
var isObjectEmpty = (obj: any) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

var getFullGender = (sexCode:string) => {
  let sex = 'Unknown';
  if (sexCode === 'M')
    sex = 'Male';
  else if (sexCode === 'F')
    sex = 'Female';
  else if (sexCode === 'O')
    sex = 'Other';
  return sex;
}
export const getFullGender_vn = (sexCode:string) => {
  let sex = 'Chưa xác định';
  if (sexCode === 'M')
    sex = 'Nam';
  else if (sexCode === 'F')
    sex = 'Nữ';
  else if (sexCode === 'O')
    sex = 'Khác';
  return sex;
}
/**
 * format YYYYMMDD to DD/MM/YYYY
 * @param {*} dob
 * @returns
 */
// const formatDate = (dob) => {
//   if (!dob) {
//     return ""; 
//   }

//   if (dob.length === 8) {
//     const year = dob.substring(0, 4);
//     const month = dob.substring(4, 6);
//     const day = dob.substring(6, 8);
//     return `${day}/${month}/${year}`;
//   } else if (dob.length === 6) {
//     const year = dob.substring(0, 4);
//     const month = dob.substring(4, 6);
//     return `${month}/${year}`;
//   } else if (dob.length === 4) {
//     const year = dob.substring(0, 4);
//     return `${year}`;
//   } else {
//     return dob;
//   }
// };

export const getImageUrl = (name:string) => {
  //return new URL(`../assets/signs/$name`, import.meta.url).href;
  return new URL(name, import.meta.url).href;
};

