import axios from "axios";

// Accept Render's base domain or a URL already ending in /api.
// Do not depend on every deployment environment spelling the prefix identically.
const configuredUrl = String(import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim();
const apiBaseURL = `${configuredUrl.replace(/\/+$/, "").replace(/\/api$/i, "")}/api`;
export const api = axios.create({ baseURL: apiBaseURL });

api.interceptors.request.use((c) => {
  const token = localStorage.getItem("tv_payroll_token");

  if (token) {
    c.headers.Authorization = `Bearer ${token}`;
  }

  return c;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem("tv_payroll_token");
      localStorage.removeItem("tv_payroll_user");

      if (location.pathname !== "/login") {
        location.assign("/login");
      }
    }

    return Promise.reject(e);
  }
);

export const errorText = (e) => {
  if (e.response?.status === 404 &&
      e.response?.data?.message === "Route not found") {
    const url = String(e.config?.baseURL || api.defaults.baseURL || "").replace(/\/$/, "");
    const path = e.config?.url || "";
    return `Backend API route not found: ${url}${path}. Deploy the updated backend src and check VITE_API_URL ends with /api.`;
  }
  return e.response?.data?.message || e.message || "Request failed";
};