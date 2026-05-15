// src/services/menu.service.js
import axios from "axios";

//  Base URL avec le préfixe '/api' pour matcher app.setGlobalPrefix('api') de NestJS
const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");
const API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

//  Interceptor : injecte automatiquement le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const menuService = {
  //  GET /api/menu?categorie=xxx&cible=CLIENT
  getMenu: async (categorieId, cible = "CLIENT", restaurantId) => {
    const params = new URLSearchParams();
    if (categorieId) params.append("categorie", categorieId);
    if (cible) params.append("cible", cible);
    if (restaurantId) params.append("restaurantId", restaurantId);
    const { data } = await api.get(`/menu?${params}`);
    return data;
  },

  //  GET /api/menu/categories
  getCategories: async (restaurantId) => {
    const params = restaurantId ? { restaurantId } : undefined;
    const { data } = await api.get("/menu/categories", { params });
    return data;
  },

  //  POST /api/menu/categories (Réservé GERANT/ADMIN)
  createCategorie: async (dto) => {
    const { data } = await api.post("/menu/categories", dto);
    return data;
  },

  //  POST /api/menu/articles (Réservé GERANT/ADMIN)
  createArticle: async (dto) => {
    const { data } = await api.post("/menu/articles", dto);
    return data;
  },

  //  PATCH /api/menu/articles/:id/disponible
  toggleArticle: async (id, disponible) => {
    const { data } = await api.patch(`/menu/articles/${id}/disponible`, {
      disponible,
    });
    return data;
  },
};
