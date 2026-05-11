// src/pages/checkout/CheckoutPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { commandesService } from '../../services/commandes.service';
import { MapPin, Truck, Store, CreditCard, Smartphone, Check, AlertCircle, Loader2 } from 'lucide-react';
import { formatFCFA } from '../../utils/formatters';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, total, clearCart, checkExpiration } = useCart();
  
  const [modeLivraison, setModeLivraison] = useState('EMPORTER');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pendingOrderRaw = localStorage.getItem('pendingOrder');
    if (pendingOrderRaw) {
      try {
        const pendingOrder = JSON.parse(pendingOrderRaw);
        if (pendingOrder.orderMode) {
          const normalized = pendingOrder.orderMode.toUpperCase();
          if (['SUR_PLACE', 'EMPORTER', 'LIVRAISON'].includes(normalized)) {
            setModeLivraison(normalized);
          }
        }
        if (pendingOrder.deliveryAddress) setAdresse(pendingOrder.deliveryAddress);
      } catch {
        // Ignore malformed pending order
      }
    }
  }, []);

  // RG-11: Vérifier expiration panier
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    if (checkExpiration()) {
      clearCart();
      navigate('/cart');
    }
  }, []);

  const handleConfirmOrder = async () => {
    // RG-08: Validation mode
    if (!modeLivraison) {
      setError('Veuillez choisir un mode de livraison.');
      return;
    }
    // RG-09: Validation adresse
    if (modeLivraison === 'LIVRAISON' && (!adresse.trim() || !telephone.trim())) {
      setError('Adresse et téléphone obligatoires pour la livraison.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        lignes: items.map(i => ({ 
          articleId: i.articleId, 
          quantite: i.quantite, 
          instructions: i.instructions || null 
        })),
        modeLivraison: modeLivraison,
        adresseLivraison: modeLivraison === 'LIVRAISON' ? adresse.trim() : null,
        telephoneLivraison: modeLivraison === 'LIVRAISON' ? telephone.trim() : null,
        // Ajout restaurantId si nécessaire (selon ton API)
        // restaurantId: ...
      };

      const res = await commandesService.create(payload);
      clearCart(); // Vider panier après succès
      // Redirection vers page de succès (US-13)
      navigate(`/checkout/success/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la commande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const deliveryFee = modeLivraison === 'LIVRAISON' ? 1000 : 0;
  const finalTotal = total + deliveryFee;

  return (
    <div className="min-h-screen bg-[#F9F7F5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2D2720] mb-6">Finaliser la commande</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Gauche : Options */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* US-06: Mode de livraison */}
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-sm">
              <h2 className="font-bold text-lg text-[#2D2720] mb-4">Mode de retrait</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'SUR_PLACE', label: 'Sur place', icon: <Store className="w-5 h-5" />, desc: 'Manger au restaurant' },
                  { id: 'EMPORTER', label: 'À emporter', icon: <MapPin className="w-5 h-5" />, desc: 'Récupérer sur place' },
                  { id: 'LIVRAISON', label: 'Livraison', icon: <Truck className="w-5 h-5" />, desc: 'Livré chez vous' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setModeLivraison(m.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      modeLivraison === m.id ? 'border-[#D94500] bg-[#FFF5EB]' : 'border-[#E8E2D9] hover:border-[#D94500]/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${modeLivraison === m.id ? 'bg-[#D94500] text-white' : 'bg-[#F9F7F5] text-[#8B7355]'}`}>
                      {m.icon}
                    </div>
                    <p className="font-semibold text-[#2D2720]">{m.label}</p>
                    <p className="text-xs text-[#8B7355]">{m.desc}</p>
                  </button>
                ))}
              </div>

              {/* RG-09: Champs adresse si livraison */}
              {modeLivraison === 'LIVRAISON' && (
                <div className="mt-4 space-y-3 animate-fade-in">
                  <input
                    type="text"
                    placeholder="Adresse complète de livraison *"
                    value={adresse}
                    onChange={e => setAdresse(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E2D9] rounded-xl focus:ring-2 focus:ring-[#D94500] outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone de contact *"
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E2D9] rounded-xl focus:ring-2 focus:ring-[#D94500] outline-none"
                  />
                  <p className="text-xs text-[#8B7355] flex items-center gap-1"><Truck className="w-3 h-3" /> Frais de livraison : 1 000 FCFA</p>
                </div>
              )}
            </div>

            {/* Paiement (Mock pour MVP) */}
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-sm">
              <h2 className="font-bold text-lg text-[#2D2720] mb-4">Mode de paiement</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-[#D94500] bg-[#FFF5EB] text-left">
                  <div className="w-5 h-5 rounded-full border-2 border-[#D94500] bg-[#D94500] flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full" /></div>
                  <Smartphone className="w-5 h-5 text-[#D94500]" />
                  <span className="font-medium text-[#2D2720]">Mobile Money (Orange/MTN/Wave)</span>
                </button>
                <button className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-[#E8E2D9] text-left opacity-50 cursor-not-allowed" disabled>
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-500">Carte bancaire (Bientôt)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Droite : Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 sticky top-24 shadow-sm">
              <h2 className="font-bold text-lg text-[#2D2720] mb-4">Récapitulatif</h2>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#8B7355]">{item.quantity}x {item.nom}</span>
                    <span className="font-medium">{formatFCFA(Number(item.prix) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-[#E8E2D9] pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8B7355]">Sous-total</span>
                  <span>{formatFCFA(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8B7355]">Livraison</span>
                  <span>{modeLivraison === 'LIVRAISON' ? formatFCFA(1000) : 'Gratuit'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#E8E2D9]">
                  <span>Total</span>
                  <span className="text-[#D94500]">{formatFCFA(finalTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleConfirmOrder}
                disabled={loading}
                className="w-full mt-6 bg-[#D94500] hover:bg-[#B83A00] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {loading ? 'Validation...' : `Confirmer et payer ${formatFCFA(finalTotal)}`}
              </button>
              <p className="text-center text-xs text-[#8B7355] mt-3">🔒 Paiement 100% sécurisé • RG-15</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}