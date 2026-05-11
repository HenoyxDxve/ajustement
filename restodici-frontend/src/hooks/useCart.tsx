// src/hooks/useCart.ts
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface CartItem {
  articleId: string;
  nom: string;
  prix: number;
  photoUrl?: string;
  quantite: number;
  instructions?: string;
  categorie?: { nom: string; icone?: string };
}

interface SavedCart {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  updatedAt: number;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: Omit<CartItem, 'quantite'> & { restaurantId: string; restaurantName: string }, quantite?: number) => void;
  updateQuantity: (articleId: string, quantite: number) => void;
  removeItem: (articleId: string) => void;
  clearCart: () => void;
  total: () => number;
  isEmpty: () => boolean;
  isRestaurantCart: (restaurantId: string) => boolean;
  checkExpiration: () => boolean;
}

const CART_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CART_STORAGE_KEY = 'cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];

      const saved: SavedCart = JSON.parse(raw);
      if (Date.now() - saved.updatedAt > CART_TTL_MS) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
      }

      return saved.items ?? [];
    } catch {
      return [];
    }
  });

  const [restaurantId, setRestaurantId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return null;
      const saved: SavedCart = JSON.parse(raw);
      return saved.restaurantId || null;
    } catch {
      return null;
    }
  });

  const [restaurantName, setRestaurantName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return null;
      const saved: SavedCart = JSON.parse(raw);
      return saved.restaurantName || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const payload: SavedCart = { 
      items, 
      restaurantId, 
      restaurantName,
      updatedAt: Date.now() 
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  }, [items, restaurantId, restaurantName]);

  const addItem = (item: Omit<CartItem, 'quantite'> & { restaurantId: string; restaurantName: string }, quantite = 1) => {
    // Check if cart already has items from a different restaurant
    if (restaurantId && restaurantId !== item.restaurantId) {
      // Clear cart if switching restaurants
      if (confirm(`Votre panier contient des articles de ${restaurantName}. Voulez-vous vider le panier pour ajouter des articles de ${item.restaurantName}?`)) {
        setItems([]);
        setRestaurantId(item.restaurantId);
        setRestaurantName(item.restaurantName);
        setItems(prev => [...prev, { ...item, quantite }]);
      }
      return;
    }
    
    // Set restaurant if cart is empty
    if (!restaurantId) {
      setRestaurantId(item.restaurantId);
      setRestaurantName(item.restaurantName);
    }
    
    setItems(prev => {
      const existing = prev.find(i => i.articleId === item.articleId);
      if (existing) {
        return prev.map(i =>
          i.articleId === item.articleId ? { ...i, quantite: i.quantite + quantite } : i
        );
      }
      return [...prev, { ...item, quantite }];
    });
  };

  const updateQuantity = (articleId: string, quantite: number) => {
    if (quantite <= 0) {
      setItems(prev => prev.filter(i => i.articleId !== articleId));
      // If cart becomes empty, clear restaurant info
      if (items.length === 1) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
    } else {
      setItems(prev => prev.map(i => i.articleId === articleId ? { ...i, quantite } : i));
    }
  };

  const removeItem = (articleId: string) => {
    setItems(prev => {
      const newItems = prev.filter(i => i.articleId !== articleId);
      // If cart becomes empty, clear restaurant info
      if (newItems.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  };

  const checkExpiration = () => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return false;
      const saved: SavedCart = JSON.parse(raw);
      const expired = Date.now() - saved.updatedAt > CART_TTL_MS;
      if (expired) {
        setItems([]);
        setRestaurantId(null);
        setRestaurantName(null);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
      return expired;
    } catch {
      return false;
    }
  };

  const total = () => items.reduce((sum, i) => sum + i.prix * i.quantite, 0);
  const isEmpty = () => items.length === 0;
  
  const isRestaurantCart = (checkRestaurantId: string) => {
    return restaurantId === checkRestaurantId;
  };

  return (
    <CartContext.Provider value={{ 
      items, 
      restaurantId, 
      restaurantName,
      addItem, 
      updateQuantity, 
      removeItem, 
      clearCart, 
      total, 
      isEmpty,
      isRestaurantCart,
      checkExpiration
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};