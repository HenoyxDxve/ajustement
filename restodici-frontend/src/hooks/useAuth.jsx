// src/hooks/useAuth.jsx
// Contexte d'authentification global — gère la session JWT et les opérations login/register/logout
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { authService } from "../services/auth.service";

// Contexte partagé dans toute l'appli via AuthProvider
const AuthContext = createContext(null);

// Décode la partie payload d'un JWT (format base64url → JSON)
function decodeToken(token) {
  const rawPayload = token.split(".")[1];
  const payload = rawPayload?.replace(/-/g, "+").replace(/_/g, "/");
  if (!payload) throw new Error("Token invalide");
  const paddedPayload = payload.padEnd(
    payload.length + ((4 - (payload.length % 4)) % 4),
    "=",
  );
  return JSON.parse(atob(paddedPayload));
}

// Vérifie si le token est expiré (champ exp en secondes Unix)
function isExpired(payload) {
  return payload?.exp ? payload.exp * 1000 <= Date.now() : false;
}

// Extrait le message d'erreur lisible depuis la réponse Axios
function getErrorMessage(error, fallback) {
  const apiError = error?.response?.data;
  const message = apiError?.message || apiError?.error || apiError;

  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;

  return error?.message || fallback;
}

// Restitue la session stockée dans localStorage au rechargement de la page
function getStoredSession() {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  if (token) {
    try {
      const payload = decodeToken(token);
      if (isExpired(payload)) {
        throw new Error("Token expiré");
      }
      const userFromStorage = storedUser ? JSON.parse(storedUser) : null;
      // Préfère les données complètes du profil plutôt que le seul contenu du JWT
      return userFromStorage
        ? { ...userFromStorage, token }
        : { ...payload, token };
    } catch {
      // Token corrompu ou expiré → on nettoie
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  return null;
}

// Fournisseur du contexte d'authentification — à placer autour de <App>
export function AuthProvider({ children }) {
  // user = null si non connecté, sinon objet { id, role, nom, restaurant, ... }
  const [user, setUser] = useState(getStoredSession);
  const loading = false; // La session est restaurée de façon synchrone (localStorage)

  // Met à jour le profil en mémoire ET dans localStorage
  const syncUser = useCallback((nextUser) => {
    const token = localStorage.getItem("token") || user?.token;
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(token ? { ...nextUser, token } : nextUser);
    return nextUser;
  }, [user?.token]);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      return syncUser(profile);
    } catch (error) {
      console.error("Profile refresh error:", error);
      return null;
    }
  }, [syncUser]);

  const login = useCallback(async (email, password) => {
    try {
      const data = await authService.login(email, password);
      const { access_token, token, user: userData, requiresTwoFactor, tempToken } = data;

      // 2FA required — pass through without setting auth state
      if (requiresTwoFactor && tempToken) {
        return { success: false, requiresTwoFactor: true, tempToken };
      }

      const jwtToken = access_token ?? token;

      if (!jwtToken || !userData) {
        return { success: false, error: "Réponse invalide du serveur" };
      }

      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user", JSON.stringify(userData));
      // Clear stale restaurant selection from previous sessions
      localStorage.removeItem("selectedRestaurantId");
      localStorage.removeItem("currentRestaurantId");
      setUser({ ...userData, token: jwtToken });

      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: getErrorMessage(error, "Erreur de connexion"),
      };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const data = await authService.register(userData);
      const { user: newUser, access_token, token } = data;
      if (!newUser) {
        return { success: false, error: "Réponse invalide du serveur" };
      }
      const jwtToken = access_token ?? token;
      if (jwtToken) {
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setUser({ ...newUser, token: jwtToken });
      }
      return { success: true, user: newUser, token: jwtToken };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        error: getErrorMessage(error, "Erreur d'inscription"),
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshProfile, syncUser }),
    [user, loading, login, register, logout, refreshProfile, syncUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
