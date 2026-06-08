/* ═══════════════════════════════════════════════════════════════
   FavoriteButton.tsx — Bouton cœur pour mettre un restaurant en favori
   Props :
     restaurantId  → identifiant du restaurant concerné
     isFavorite    → état initial (true = déjà en favori)
     onToggle      → callback optionnel appelé après le changement
   ═══════════════════════════════════════════════════════════════ */
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { api } from '../../services/api';

interface FavoriteButtonProps {
  restaurantId : string;
  isFavorite   : boolean;
  onToggle?    : (isFavorite: boolean) => void;
}

export default function FavoriteButton({
  restaurantId,
  isFavorite,
  onToggle,
}: FavoriteButtonProps) {
  const [loading,  setLoading]  = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);

  /* Bascule l'état favori via l'API puis met à jour l'état local */
  const handleToggle = async () => {
    if (loading) return;   /* évite un double-clic pendant la requête */
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
    } catch {
      /* Silencieux — l'UI ne change pas si la requête échoue */
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={favorite}
      onClick={handleToggle}
      disabled={loading}
      className={[
        'transition-all duration-300 rounded-full p-2',
        'focus-visible:ring-2 focus-visible:ring-[#D94500] focus-visible:ring-offset-1',
        'hover:shadow-lg disabled:opacity-60 disabled:cursor-wait',
        favorite
          ? 'text-[#D94500] bg-[#FFF5EB]'
          : 'text-[#8B7355] bg-[#F9F7F5]',
      ].join(' ')}
    >
      <Heart
        fill={favorite ? '#D94500' : 'none'}
        className="w-5 h-5"
        aria-hidden="true"
      />
    </button>
  );
}
