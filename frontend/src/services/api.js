import axios from "axios";

const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://arthur-backend-wilm.onrender.com/api";
  }
  return "http://localhost:8080/api";
};

const API = axios.create({
  baseURL: getBaseURL(),
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