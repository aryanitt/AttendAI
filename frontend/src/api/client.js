import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

export function setAuthToken(token) {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("sat_token", token);
  } else {
    delete client.defaults.headers.common.Authorization;
    localStorage.removeItem("sat_token");
  }
}

const saved = localStorage.getItem("sat_token");
if (saved) {
  client.defaults.headers.common.Authorization = `Bearer ${saved}`;
}

export async function downloadReport(url, filename) {
  // If the url starts with /api/, we strip it because axios.get with baseURL "/api" 
  // would result in /api/api/...
  const cleanUrl = url.startsWith("/api") ? url.slice(4) : url;
  
  const res = await client.get(cleanUrl, {
    responseType: "blob",
  });
  const blob = new Blob([res.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and force logout on 401 Unauthorized
      localStorage.removeItem("sat_token");
      delete client.defaults.headers.common.Authorization;
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default client;
