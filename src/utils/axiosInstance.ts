// utils/axiosInstance.ts
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://brainboost.pp.ua/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const access = localStorage.getItem("access");
    if (access) {
      config.headers["Authorization"] = `Bearer ${access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refresh")
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post("https://brainboost.pp.ua/api/accounts/api/token/refresh/", {
          refresh: localStorage.getItem("refresh"),
        });
        localStorage.setItem("access", res.data.access);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${res.data.access}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
