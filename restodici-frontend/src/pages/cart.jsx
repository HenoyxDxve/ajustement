import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Trash2, Minus, Plus, MapPin, Store, Package, 
  CreditCard, Smartphone, Wallet, Gift, X, CheckCircle, AlertCircle, Truck
} from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatFCFA } from '../utils/formatters';

export default function CartPage() {
  const navigate = useNavigate();
  const { 
    items, 
    restaurantId, 
    restaurantName,
    updateQuantity, 
    removeItem, 
    clearCart 
  } = useCart();
  const [orderMode, setOrderMode] = useState('sur_place'); // sur_place, emporter, livraison
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({});

  // Mock delivery zones
  const deliveryZones = [
    { name: 'Cocody', fee: 1000 },
    { name: 'Plateau', fee: 800 },
    { name: 'Marcory', fee: 1200 },
    { name: 'Treichville', fee: 900 },
    { name: 'Yopougon', fee: 1500 }
  ];

  const subtotal = items.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
  const deliveryFee = orderMode === 'livraison' ? (deliveryZones.find(z => z.name === deliveryZone)?.fee || 1000) : 0;
  const total = subtotal + deliveryFee - promoDiscount;

  // Validate required fields before proceeding to checkout
  const validateForm = () => {
    const newErrors = {};
    
    if (!restaurantId) {
      newErrors.restaurant = 'Aucun restaurant sélectionné';
    }
    
    if (orderMode === 'livraison' && !deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Adresse de livraison requise';
    }
    
    if (orderMode === 'livraison' && !deliveryZone) {
      newErrors.deliveryZone = 'Zone de livraison requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToCheckout = () => {
    if (!validateForm()) return;
    
    // Save order details to localStorage for checkout
    const normalizedOrderMode = orderMode === 'sur_place' ? 'SUR_PLACE' : orderMode === 'livraison' ? 'LIVRAISON' : 'EMPORTER';
    const orderDetails = {
      items: items.map(item => ({
        articleId: item.articleId,
        nom: item.nom,
        prix: item.prix,
        quantite: item.quantite,
        instructions: item.instructions
      })),
      restaurantId,
      restaurantName,
      orderMode: normalizedOrderMode,
      deliveryAddress: normalizedOrderMode === 'LIVRAISON' ? deliveryAddress : '',
      deliveryZone: normalizedOrderMode === 'LIVRAISON' ? deliveryZone : '',
      total,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('pendingOrder', JSON.stringify(orderDetails));
    
    // Check if user is authenticated
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      // User is logged in, proceed directly to checkout
      navigate('/checkout');
    } else {
      // User is not logged in, redirect to login with checkout redirect
      navigate('/login?redirect=checkout');
    }
  };

  const handleUpdateQuantity = (articleId, newQuantity) => {
    if (newQuantity >= 1) {
      updateQuantity(articleId, newQuantity);
    } else {
      removeItem(articleId);
    }
  };

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      // Mock promo logic - in real app this would call an API
      if (promoCode.toLowerCase() === 'WELCOME10') {
        const discount = subtotal * 0.1; // 10% discount
        setPromoDiscount(discount);
        setPromoApplied(true);
      } else if (promoCode.toLowerCase() === 'FREESHIP') {
        setPromoDiscount(deliveryFee);
        setPromoApplied(true);
      } else {
        alert('Code promo invalide');
      }
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoApplied(false);
    setPromoDiscount(0);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Votre panier est vide</h2>
          <p className="text-gray-600 mb-6">Ajoutez des plats à votre panier pour commencer votre commande.</p>
          <Link 
            to="/menu" 
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium"
          >
            Voir le menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Votre panier</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.articleId} className="flex gap-4 pb-6 border-b border-gray-200 last:border-b-0 last:pb-0">
                    {item.photoUrl ? (
                      <img 
                        src={item.photoUrl} 
                        alt={item.nom} 
                        className="w-20 h-20 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{item.nom}</h3>
                        <button 
                          onClick={() => removeItem(item.articleId)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {item.categorie && (
                        <p className="text-gray-600 text-sm mb-2">{item.categorie.nom}</p>
                      )}
                      
                      {item.instructions && (
                        <p className="text-gray-700 text-sm mb-2 bg-gray-100 p-2 rounded-lg">
                          Instructions: {item.instructions}
                        </p>
                      )}
                      
                      {item.supplements && item.supplements.length > 0 && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Suppléments:</span>
                          {item.supplements.map((supplement, index) => (
                            <span key={index} className="ml-2">
                              {supplement.name} (+{formatFCFA(supplement.price)})
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateQuantity(item.articleId, item.quantite - 1)}
                            className="p-1 rounded-full border border-gray-300 hover:bg-gray-100 transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-medium w-8 text-center">{item.quantite}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(item.articleId, item.quantite + 1)}
                            className="p-1 rounded-full border border-gray-300 hover:bg-gray-100 transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <span className="font-bold text-orange-500">
                          {formatFCFA(item.prix * item.quantite)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex gap-4">
                <button 
                  onClick={clearCart}
                  className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition"
                >
                  Vider le panier
                </button>
                <Link 
                  to="/menu" 
                  className="px-4 py-2 border border-orange-500 text-orange-500 rounded-xl hover:bg-orange-50 transition"
                >
                  Continuer vos achats
                </Link>
              </div>
            </div>
          </div>

          {/* Order Summary & Checkout */}
          <div className="space-y-6">
            {/* Restaurant Info */}
            {restaurantId && (
              <div className="bg-white rounded-xl p-6 border border-[#E8E2D9] mb-6">
                <h3 className="font-bold text-lg text-[#2D2720] mb-2">
                  Restaurant: {restaurantName}
                </h3>
                <p className="text-sm text-[#8B7355]">
                  Tous les articles de votre panier proviennent de ce restaurant.
                </p>
              </div>
            )}

            {/* Promo Code */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4">Code promo</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Entrez votre code promo"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
                {!promoApplied ? (
                  <button 
                    onClick={handleApplyPromo}
                    className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition"
                  >
                    Appliquer
                  </button>
                ) : (
                  <button 
                    onClick={handleRemovePromo}
                    className="px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {promoApplied && (
                <div className="mt-2 flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Code appliqué! -{formatFCFA(promoDiscount)}</span>
                </div>
              )}
            </div>

            {/* Mode de commande */}
            <div className="bg-white rounded-xl p-6 border border-[#E8E2D9]">
              <h3 className="font-bold text-lg text-[#2D2720] mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Mode de commande
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setOrderMode('sur_place')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    orderMode === 'sur_place'
                      ? 'border-[#D94500] bg-[#FFF5EB]'
                      : 'border-[#E8E2D9] hover:border-[#D94500]/50'
                  }`}
                >
                  <Store className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-medium">Sur place</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setOrderMode('emporter')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    orderMode === 'emporter'
                      ? 'border-[#D94500] bg-[#FFF5EB]'
                      : 'border-[#E8E2D9] hover:border-[#D94500]/50'
                  }`}
                >
                  <Package className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-medium">À emporter</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setOrderMode('livraison')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    orderMode === 'livraison'
                      ? 'border-[#D94500] bg-[#FFF5EB]'
                      : 'border-[#E8E2D9] hover:border-[#D94500]/50'
                  }`}
                >
                  <Truck className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-medium">Livraison</span>
                </button>
              </div>
            </div>

            {/* Livraison details (only if livraison selected) */}
            {orderMode === 'livraison' && (
              <div className="bg-white rounded-xl p-6 border border-[#E8E2D9]">
                <h3 className="font-bold text-lg text-[#2D2720] mb-4">
                  Détails de livraison
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2D2720] mb-2">
                      Adresse de livraison *
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Entrez votre adresse complète..."
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#D94500]/20 focus:border-[#D94500] outline-none transition ${
                        errors.deliveryAddress ? 'border-red-500 bg-red-50' : 'border-[#E8E2D9]'
                      }`}
                    />
                    {errors.deliveryAddress && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.deliveryAddress}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#2D2720] mb-2">
                      Zone de livraison *
                    </label>
                    <select
                      value={deliveryZone}
                      onChange={(e) => setDeliveryZone(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#D94500]/20 focus:border-[#D94500] outline-none transition ${
                        errors.deliveryZone ? 'border-red-500 bg-red-50' : 'border-[#E8E2D9]'
                      }`}
                    >
                      <option value="">Sélectionnez votre zone</option>
                      {deliveryZones.map((zone) => (
                        <option key={zone.name} value={zone.name}>
                          {zone.name} (+{formatFCFA(zone.fee)} FCFA)
                        </option>
                      ))}
                    </select>
                    {errors.deliveryZone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.deliveryZone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleProceedToCheckout}
                disabled={items.length === 0 || isProcessing}
                className="px-8 py-3 bg-[#D94500] text-white rounded-xl font-semibold hover:bg-[#B83A00] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Passer au paiement ({formatFCFA(total)} FCFA)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}