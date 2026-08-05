import axios from "axios";

// Detect if running on localhost or live production
const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || (isLocal ? "http://localhost:8080/api" : "https://arthur-backend-wilm.onrender.com/api"),
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