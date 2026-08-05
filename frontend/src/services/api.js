import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
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