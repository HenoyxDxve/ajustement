import axios from "axios";

const apiBase = String(
  (import.meta as any).env?.VITE_API_URL || "http://localhost:3000",
).replace(/\/$/, "");
const apiBaseUrl = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;

const API = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

// Interceptor pour ajouter le token JWT
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const commandesService = {
  create: (data: any) => API.post("/commandes", data),
  getAll: (params?: any) => API.get("/commandes", { params }),
  getRecentOrders: async (restaurantId: string, limit = 50) => {
    const { data } = await API.get("/commandes", {
      params: { restaurantId, limit },
    });
    return data;
  },
  getMyOrders: () => API.get("/commandes/me"),
  findOne: (id: string) => API.get(`/commandes/${id}`),
  updateStatus: (id: string, statut: string) =>
    API.patch(`/commandes/${id}/statut`, { statut }),
  updateStatut: (id: string, statut: string) =>
    API.patch(`/commandes/${id}/statut`, { statut }),
  getKDS: () => API.get("/commandes/kds"),
};
