// src/services/auth.service.js
import axios from "axios";

//  Base URL avec préfixe '/api' pour matcher NestJS
const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");
const API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor pour injecter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  //  POST /api/auth/login
  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },

  //  POST /api/auth/register
  register: async (userData) => {
    const { data } = await api.post("/auth/register", userData);
    return data;
  },

  //  GET /api/auth/me (profil utilisateur)
  getProfile: async () => {
    const { data } = await api.get("/auth/me");
    return data;
  },
};
