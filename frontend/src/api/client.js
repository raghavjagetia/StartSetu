import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("startsetu_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("startsetu_token");
      localStorage.removeItem("startsetu_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export function fileUrl(path) {
  if (!path) return null;
  return `${baseURL}/uploads/${path}`;
}

export default client;
