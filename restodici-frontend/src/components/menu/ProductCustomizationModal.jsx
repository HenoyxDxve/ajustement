import { useState, useEffect } from 'react';
import { X, Minus, Plus, AlertCircle, CheckCircle, Sparkles, UtensilsCrossed } from 'lucide-react';
import { formatFCFA } from '../../utils/formatters';

export default function ProductCustomizationModal({ product, onClose, onAdd }) {
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [selectedSupplements, setSelectedSupplements] = useState([]);
  const [customOptions, setCustomOptions] = useState({});
  
  // Mock supplements data - in real app this would come from API
  const supplements = [
    { id: 'supplement1', name: 'Supplément viande', price: 500 },
    { id: 'supplement2', name: 'Supplément fromage', price: 300 },
    { id: 'supplement3', name: 'Sauce spéciale', price: 200 },
    { id: 'supplement4', name: 'Légumes supplémentaires', price: 250 }
  ];

  // Mock customization options
  const customizationOptions = {
    cuisson: ['Saignant', 'À point', 'Bien cuit'],
    epice: ['Sans piment', 'Peu épicé', 'Épicé', 'Très épicé'],
    accompagnement: ['Riz', 'Pommes de terre', 'Légumes']
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 20) {
      setQuantity(newQuantity);
    }
  };

  const toggleSupplement = (supplementId) => {
    setSelectedSupplements(prev => 
      prev.includes(supplementId) 
        ? prev.filter(id => id !== supplementId)
        : [...prev, supplementId]
    );
  };

  const handleOptionChange = (optionType, value) => {
    setCustomOptions(prev => ({
      ...prev,
      [optionType]: value
    }));
  };

  const calculateTotalPrice = () => {
    let total = parseFloat(product.prix) || 0;
    total *= quantity;
    
    // Add supplements
    selectedSupplements.forEach(supplementId => {
      const supplement = supplements.find(s => s.id === supplementId);
      if (supplement) {
        total += supplement.price * quantity;
      }
    });
    
    return total;
  };

  const handleAdd = () => {
    const fullInstructions = [
      instructions.trim(),
      customOptions.cuisson && `Cuisson: ${customOptions.cuisson}`,
      customOptions.epice && `Épices: ${customOptions.epice}`,
      customOptions.accompagnement && `Accompagnement: ${customOptions.accompagnement}`
    ].filter(Boolean).join('\n');
    
    const itemData = {
      ...product,
      supplements: selectedSupplements.map(id => 
        supplements.find(s => s.id === id)
      ).filter(Boolean),
      customOptions,
      totalPrice: calculateTotalPrice()
    };
    
    onAdd(itemData, quantity, fullInstructions);
    onClose();
  };

  const totalPrice = calculateTotalPrice();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{product.nom}</h2>
              {product.categorie?.nom && (
                <p className="text-gray-600 text-sm">{product.categorie.nom}</p>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Product Image */}
        <div className="px-6 py-4">
          {product.photoUrl ? (
            <img 
              src={product.photoUrl} 
              alt={product.nom} 
              className="w-full h-48 object-cover rounded-xl"
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="px-6 pb-4">
            <p className="text-gray-700">{product.description}</p>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="px-6 py-4 border-t border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800">Quantité</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="p-2 rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg w-8 text-center">{quantity}</span>
              <button 
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= 20}
                className="p-2 rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Supplements */}
        {supplements.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-800 mb-3">Suppléments (+)</h3>
            <div className="space-y-2">
              {supplements.map((supplement) => (
                <label key={supplement.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSupplements.includes(supplement.id)}
                    onChange={() => toggleSupplement(supplement.id)}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="flex-1">{supplement.name}</span>
                  <span className="text-orange-500 font-medium">
                    +{formatFCFA(supplement.price)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Customization Options */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-800 mb-4">Personnalisation</h3>
          
          {/* Cuisson */}
          {customizationOptions.cuisson && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cuisson</label>
              <div className="grid grid-cols-3 gap-2">
                {customizationOptions.cuisson.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleOptionChange('cuisson', option)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      customOptions.cuisson === option
                        ? 'bg-orange-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Épices */}
          {customizationOptions.epice && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Niveau d'épices</label>
              <div className="grid grid-cols-2 gap-2">
                {customizationOptions.epice.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleOptionChange('epice', option)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      customOptions.epice === option
                        ? 'bg-orange-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Accompagnement */}
          {customizationOptions.accompagnement && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Accompagnement</label>
              <div className="grid grid-cols-3 gap-2">
                {customizationOptions.accompagnement.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleOptionChange('accompagnement', option)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      customOptions.accompagnement === option
                        ? 'bg-orange-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Special Instructions */}
        <div className="px-6 py-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instructions spéciales
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Ex: sans oignon, sans piment, cuisson spéciale..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
            rows="3"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button 
              onClick={() => setInstructions(prev => prev + 'sans oignon\n')}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition"
            >
              Sans oignon
            </button>
            <button 
              onClick={() => setInstructions(prev => prev + 'sans piment\n')}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition"
            >
              Sans piment
            </button>
            <button 
              onClick={() => setInstructions(prev => prev + 'cuisson spéciale\n')}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition"
            >
              Cuisson spéciale
            </button>
          </div>
        </div>

        {/* Total Price */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-700">Total:</span>
            <span className="text-2xl font-bold text-orange-500">
              {formatFCFA(totalPrice)}
            </span>
          </div>
          
          <button
            onClick={handleAdd}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}