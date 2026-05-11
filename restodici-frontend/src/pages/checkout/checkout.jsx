// src/pages/Checkout.jsx (à créer si n'existe pas)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Smartphone, Banknote, Phone } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { formatFCFA } from '../../utils/formatters';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('mobile-money');
  const [loading, setLoading] = useState(false);

  const handleOrder = async () => {
    setLoading(true);
    // Simulation appel API
    setTimeout(() => {
      clearCart();
      navigate('/payment/success/R1234');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="text-stone-600 hover:text-stone-900 font-medium flex items-center gap-2"
          >
            ← Retour au panier
          </button>
        </div>

        <h1 className="text-3xl font-bold text-stone-900 mb-2">Finaliser la commande</h1>
        <p className="text-stone-600 mb-8">
          Veuillez vérifier vos informations de livraison et choisir un mode de paiement.
        </p>

        <div className="space-y-6">
          {/* Adresse de livraison */}
          <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-700" />
                Adresse de livraison
              </h2>
              <button className="text-orange-700 font-semibold text-sm hover:underline">
                Modifier
              </button>
            </div>
            
            <div className="bg-stone-50 rounded-2xl p-5 border-2 border-stone-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-orange-700" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-stone-900 mb-1">Maison</p>
                  <p className="text-sm text-stone-600">Appartement 4B, Résidence Les Palmiers</p>
                  <p className="text-sm text-stone-600">Quartier Cocody, Abidjan</p>
                  <p className="text-sm text-stone-600 mt-2 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    +225 01 23 45 67 89
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mode de paiement */}
          <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-orange-700" />
              Mode de paiement
            </h2>

            <div className="space-y-3">
              {/* Mobile Money */}
              <div 
                className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                  paymentMethod === 'mobile-money' 
                    ? 'border-orange-700 bg-orange-50' 
                    : 'border-stone-200 hover:border-orange-300'
                }`}
                onClick={() => setPaymentMethod('mobile-money')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'mobile-money' ? 'border-orange-700 bg-orange-700' : 'border-stone-400'
                    }`}>
                      {paymentMethod === 'mobile-money' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-orange-700" />
                      <span className="font-bold text-stone-900">Mobile Money</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">OM</span>
                    <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">MoMo</span>
                  </div>
                </div>
                
                {paymentMethod === 'mobile-money' && (
                  <div className="mt-4 ml-8">
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Numéro de téléphone
                    </label>
                    <input 
                      type="tel" 
                      defaultValue="+225 01 23 45 67 89"
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-orange-700 focus:outline-none font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Carte bancaire */}
              <div 
                className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                  paymentMethod === 'card' 
                    ? 'border-orange-700 bg-orange-50' 
                    : 'border-stone-200 hover:border-orange-300'
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'card' ? 'border-orange-700 bg-orange-700' : 'border-stone-400'
                  }`}>
                    {paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="font-bold text-stone-900">Carte bancaire</span>
                </div>
              </div>

              {/* Paiement à la livraison */}
              <div 
                className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                  paymentMethod === 'cash' 
                    ? 'border-orange-700 bg-orange-50' 
                    : 'border-stone-200 hover:border-orange-300'
                }`}
                onClick={() => setPaymentMethod('cash')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'cash' ? 'border-orange-700 bg-orange-700' : 'border-stone-400'
                  }`}>
                    {paymentMethod === 'cash' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-orange-700" />
                    <span className="font-bold text-stone-900">Paiement à la livraison</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-stone-600">
                <span>Sous-total</span>
                <span className="font-medium">{formatFCFA(total())} FCFA</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Frais de livraison</span>
                <span className="font-medium">1.000 FCFA</span>
              </div>
            </div>
            
            <div className="border-t-2 border-stone-200 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-stone-900">Total</span>
                <span className="text-3xl font-bold text-orange-700">
                  {formatFCFA(total() + 1000)} FCFA
                </span>
              </div>
            </div>

            <button
              onClick={handleOrder}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-700 to-orange-600 hover:from-orange-800 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {loading ? 'Traitement...' : 'PASSER LA COMMANDE'}
            </button>
            
            <p className="text-center text-sm text-stone-500 mt-3 flex items-center justify-center gap-1">
              <span className="text-green-600">🔒</span>
              Paiement 100% sécurisé
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
