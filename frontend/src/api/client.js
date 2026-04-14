import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
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
  const token = localStorage.getItem("sat_token");
  const res = await axios.get(url, {
    responseType: "blob",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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

export default client;
