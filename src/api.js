import axios from "axios";

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
});

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

export const errorText = (e) =>
  e.response?.data?.message ||
  e.message ||
  "Request failed";