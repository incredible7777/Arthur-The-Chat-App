import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://arthur-backend-wilm.onrender.com/api",
  timeout: 35000,
});

// Axios Request Interceptor: Automatically attach JWT token from localStorage to all requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
