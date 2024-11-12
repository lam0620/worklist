var html2text = function (html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  var text = div.innerText;
  div.remove();
  return text;
};
var fetchData = (url, data, method, callback) => {
  fetch(url, {
    method: method, //'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(response => {
      callback(response);
    });
};
var isEmpty = (str) => {
  //if (typeof str == 'undefined' || !str || str.length === 0 || str === "" || !/[^\s]/.test(str) || /^\s*$/.test(str) || str.replace(/\s/g,"") === "") {
  if (typeof str == 'undefined' || str === 'undefined' || str === 'null' || !str || str == "" || str == null) {
    return true;
  } else {
    return false;
  }
};
var isObjectEmpty = (obj) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

var getFullGender = (sexCode) => {
  let sex = 'Unknown';
  if (sexCode === 'M')
    sex = 'Male';
  else if (sexCode === 'F')
    sex = 'Female';
  else if (sexCode === 'O')
    sex = 'Other';
  return sex;
}
var getFullGender_vn = (sexCode) => {
  let sex = 'Chưa xác định';
  if (sexCode === 'M')
    sex = 'Nam';
  else if (sexCode === 'F')
    sex = 'Nữ';
  else if (sexCode === 'O')
    sex = 'Khác';
  return sex;
}
var getFullModalityType = (type) => {
  let fullType = 'MRI';
  if (type === 'MR')
    fullType = 'MRI';
  else if (type === 'CT')
    fullType = 'CT Scan';
  else if (['DX', 'CR', 'DR', 'DX'].includes(type))
    fullType = 'XQUANG';
  return fullType;
}

/**
 * format YYYYMMDD to DD/MM/YYYY
 * @param {*} dob
 * @returns
 */
const formatDate = (dob) => {
  if (!dob) {
    return ""; 
  }

  if (dob.length === 8) {
    const year = dob.substring(0, 4);
    const month = dob.substring(4, 6);
    const day = dob.substring(6, 8);
    return `${day}/${month}/${year}`;
  } else if (dob.length === 6) {
    const year = dob.substring(0, 4);
    const month = dob.substring(4, 6);
    return `${month}/${year}`;
  } else if (dob.length === 4) {
    const year = dob.substring(0, 4);
    return `${year}`;
  } else {
    return dob;
  }
};

const getImageUrl = (name) => {
  //return new URL(`../assets/signs/$name`, import.meta.url).href;
  return new URL(name, import.meta.url).href;
};

export default {
  html2text: html2text,
  fetchData: fetchData,
  isEmpty: isEmpty,
  isObjectEmpty: isObjectEmpty,
  getFullGender: getFullGender,
  getFullGender_vn: getFullGender_vn,
  getFullModalityType: getFullModalityType,
  formatDate: formatDate,
  getImageUrl: getImageUrl,

}
