import { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { X, Minus, Plus, ChefHat, MapPin, Truck, Store } from 'lucide-react';
import { commandesService } from '../../services/commandes.service';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function CartDrawer({ isOpen, onClose }) {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('SUR_PLACE');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (useCart.getState().checkExpiration()) {
      alert('Panier expiré par inactivité (30 min). Veuillez recommencer.');
      return;
    }
    if (mode === 'LIVRAISON' && !address.trim()) {
      alert('Adresse obligatoire pour la livraison');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        lignes: items.map(i => ({ articleId: i.id, quantity: i.quantity, instructions: i.instructions })),
        modeLivraison: mode,
        adresseLivraison: mode === 'LIVRAISON' ? address : null,
      };
      const res = await commandesService.create(payload);
      clearCart();
      navigate(`/suivi/${res.data.id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur commande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[#F9F7F5] h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-[#E8E2D9] flex items-center justify-between bg-white">
          <h2 className="text-xl font-bold text-[#2D2720]">Mon Panier ({items.length})</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F9F7F5] rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-[#8B7355]">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Votre panier est vide</p>
            </div>
          ) : items.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-sm">
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold text-[#2D2720]">{item.nom}</h3>
                <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
              </div>
              {item.instructions && <p className="text-xs text-[#8B7355] mb-2 italic">📝 {item.instructions}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-[#F9F7F5] rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-white rounded-md transition"><Minus className="w-4 h-4" /></button>
                  <span className="w-6 text-center font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-white rounded-md transition"><Plus className="w-4 h-4" /></button>
                </div>
                <span className="font-bold text-[#D94500]">{(Number(item.prix) * item.quantity).toLocaleString()} FCFA</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mode Livraison & Adresse (EN-1918) */}
        <div className="p-6 bg-white border-t border-[#E8E2D9] space-y-4">
          <h3 className="font-bold text-[#2D2720]">Mode de retrait</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'SUR_PLACE', label: 'Sur place', icon: <Store className="w-4 h-4" /> },
              { id: 'EMPORTER', label: 'À emporter', icon: <Truck className="w-4 h-4" /> },
              { id: 'LIVRAISON', label: 'Livraison', icon: <MapPin className="w-4 h-4" /> },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${mode === m.id ? 'border-[#D94500] bg-[#FFF5EB] text-[#D94500]' : 'border-[#E8E2D9] text-[#8B7355] hover:border-[#D94500]/50'}`}>
                {m.icon}
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            ))}
          </div>

          {mode === 'LIVRAISON' && (
            <input 
              type="text" 
              placeholder="Adresse complète de livraison..." 
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E2D9] rounded-xl focus:ring-2 focus:ring-[#D94500] outline-none"
            />
          )}

          <div className="flex justify-between items-center pt-2 border-t border-[#E8E2D9]">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-2xl text-[#D94500]">{total.toLocaleString()} FCFA</span>
          </div>

          <button 
            onClick={handleCheckout} 
            disabled={loading || items.length === 0}
            className="w-full bg-[#D94500] hover:bg-[#B83A00] disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
          >
            {loading ? 'Validation...' : 'VALIDER LA COMMANDE'}
          </button>
        </div>
      </div>
    </div>
  );
}