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

export const refreshAccessToken = async (data: {[key: string]: any}) => {
  return axios.post(`${API_BASE_URL}/auth/refresh-token`, data);
}

// Chart
export const fetchChartData = async (params: { [key: string]: any } = {} ) => {
    const queryString = Object.keys(params)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
        .join('&');
    return axios.get(`${API_BASE_URL}/chart?${queryString}`);
}

// Provider 
export const fetchProviders = async (params: { [key: string]: any } = {}) => {
  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
  return axios.get(`${API_BASE_URL}/providers?${queryString}`);
}

// Export csv
export const exportCSV = async (params: { [key: string]: any } = {}) => {
  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
  return axios.get(`${API_BASE_URL}/chart/export?${queryString}`);
}