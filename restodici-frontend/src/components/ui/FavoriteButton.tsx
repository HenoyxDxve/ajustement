import { useState } from 'react';
import { Heart } from 'lucide-react';
import { api } from '../../services/api';

interface FavoriteButtonProps {
  restaurantId: string;
  isFavorite: boolean;
  onToggle?: (isFavorite: boolean) => void;
}

export default function FavoriteButton({ restaurantId, isFavorite, onToggle }: FavoriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (favorite) {
        await api.delete(`/restaurants/${restaurantId}/favorites`);
        setFavorite(false);
        onToggle?.(false);
      } else {
        await api.post(`/restaurants/${restaurantId}/favorites`);
        setFavorite(true);
        onToggle?.(true);
      }
    } catch (err) {
      // Optionnel : toast d'erreur
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      onClick={handleToggle}
      disabled={loading}
      className={`transition-all duration-300 rounded-full p-2 focus:ring-2 focus:ring-[#D94500] focus:border-transparent ${
        favorite ? 'text-[#D94500] bg-[#FFF5EB]' : 'text-[#8B7355] bg-[#F9F7F5]'
      } hover:shadow-lg`}
    >
      <Heart fill={favorite ? '#D94500' : 'none'} className="w-5 h-5" />
    </button>
  );
}
