// src/pages/MenuPage.jsx — Version avec data-testid pour Playwright
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from "react-router-dom";
import { Search, AlertCircle, Filter, X, UtensilsCrossed, Star, Clock, Zap, ShoppingCart } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { menuAPI } from '../services/api';
import ProductCustomizationModal from '../components/menu/ProductCustomizationModal';
import { formatFCFA } from '../utils/formatters';

export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 10000],
    showAvailableOnly: true,
    showPromotionsOnly: false,
    sortBy: 'name'
  });
  const { addItem, items: cartItems } = useCart();

  // Get restaurant ID from URL or use default
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('restaurant') || localStorage.getItem('selectedRestaurantId') || '2c8adfd0-8620-4db4-adcb-eabd1de2838f';
  const categoryId = urlParams.get('category') || null;
  const initialSearch = urlParams.get('search') || '';

  // Debounce recherche (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load categories and menu
  useEffect(() => {
    const loadMenuData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load menu items for the selected restaurant (client view)
        const menuRes = await menuAPI.get({ 
          cible: 'CLIENT', 
          restaurantId 
        });
        
        // Store in cache for filtering
        if (!menuAPI.menuCache) {
          menuAPI.menuCache = {};
        }
        const menuData = menuRes.data || [];
        menuAPI.menuCache[restaurantId] = menuData;
        
        // Extract restaurant info from first item (assuming all items belong to same restaurant)
        let restaurantName = 'Restaurant';
        if (menuData.length > 0) {
          restaurantName = menuData[0].restaurantNom || menuData[0].restaurant?.nom || 'Restaurant';
        }
        
        // Store restaurant info for cart
        localStorage.setItem('currentRestaurantId', restaurantId);
        localStorage.setItem('currentRestaurantName', restaurantName);
        
        // Load categories for the selected restaurant
        const categoriesRes = await menuAPI.getCategories({ restaurantId });
        setCategories(categoriesRes.data || []);
        
        if (categoryId) {
          setActiveCategory(categoryId);
        }
      } catch (error) {
        console.error('Erreur chargement menu:', error);
        setError('Impossible de charger le menu. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    loadMenuData();
  }, [restaurantId, categoryId]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!menuAPI.menuCache?.[restaurantId]) return [];
    
    let products = [...menuAPI.menuCache[restaurantId]];
    
    // Apply category filter
    if (activeCategory !== 'all') {
      products = products.filter(product => product.categorieId === activeCategory);
    }
    
    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      products = products.filter(product => 
        product.nom.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.categorie?.nom?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply availability filter
    if (filters.showAvailableOnly) {
      products = products.filter(product => product.disponible);
    }
    
    // Apply promotions filter
    if (filters.showPromotionsOnly) {
      products = products.filter(product => 
        product.prix && parseFloat(product.prix) < 2000 // Simple promotion logic
      );
    }
    
    // Apply price range filter
    products = products.filter(product => {
      const price = parseFloat(product.prix) || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });
    
    // Apply sorting
    products.sort((a, b) => {
      const priceA = parseFloat(a.prix) || 0;
      const priceB = parseFloat(b.prix) || 0;
      
      switch (filters.sortBy) {
        case 'price-low':
          return priceA - priceB;
        case 'price-high':
          return priceB - priceA;
        case 'popular':
          return (b.quantiteVendue || 0) - (a.quantiteVendue || 0);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return a.nom.localeCompare(b.nom);
      }
    });
    
    return products;
  }, [restaurantId, activeCategory, debouncedSearch, filters, menuAPI.menuCache]);

  const handleAddToCart = useCallback((product, quantity = 1, instructions = '') => {
    // Get restaurant info from localStorage to ensure consistency with current session
    const currentRestaurantId = localStorage.getItem('currentRestaurantId') || restaurantId;
    const currentRestaurantName = localStorage.getItem('currentRestaurantName') || 'Restaurant';

    addItem({
      articleId: product.id,
      nom: product.nom,
      prix: parseFloat(product.prix) || 0,
      photoUrl: product.photoUrl,
      instructions: instructions,
      categorie: product.categorie,
      restaurantId: currentRestaurantId,
      restaurantName: currentRestaurantName
    }, quantity);
  }, [addItem, restaurantId]);

  const handleQuickAdd = (product) => {
    handleAddToCart(product, 1, '');
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 10000],
      showAvailableOnly: true,
      showPromotionsOnly: false,
      sortBy: 'name'
    });
  };

  if (loading && !menuAPI.menuCache?.[restaurantId]) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
          <p className="text-gray-600">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
          <h3 className="font-bold text-red-800 mb-2">Erreur</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un plat..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Filter Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              <Filter className="w-5 h-5" />
              Filtres
            </button>
            
            {/* Cart Button */}
            {cartItems.length > 0 && (
              <Link 
                to="/cart" 
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition relative"
              >
                <ShoppingCart className="w-5 h-5" />
                Panier ({cartItems.length})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Trier par:</label>
                <select 
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="name">Nom</option>
                  <option value="price-low">Prix (croissant)</option>
                  <option value="price-high">Prix (décroissant)</option>
                  <option value="popular">Populaire</option>
                  <option value="newest">Plus récent</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={filters.showAvailableOnly}
                  onChange={(e) => setFilters({...filters, showAvailableOnly: e.target.checked})}
                  className="w-4 h-4 text-orange-500 rounded"
                />
                <label htmlFor="available" className="text-sm">Disponible uniquement</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="promotions"
                  checked={filters.showPromotionsOnly}
                  onChange={(e) => setFilters({...filters, showPromotionsOnly: e.target.checked})}
                  className="w-4 h-4 text-orange-500 rounded"
                />
                <label htmlFor="promotions" className="text-sm">Promotions seulement</label>
              </div>
              
              <button 
                onClick={clearFilters}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Effacer les filtres
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24">
              <h3 className="font-bold text-lg mb-4">Catégories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    activeCategory === 'all' 
                      ? 'bg-orange-500 text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Toutes les catégories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 ${
                      activeCategory === category.id 
                        ? 'bg-orange-500 text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {category.icone && <span>{category.icone}</span>}
                    {category.nom}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">Aucun plat trouvé</h3>
                <p className="text-gray-500">
                  Essayez de modifier vos critères de recherche ou de filtrage.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition ${
                      !product.disponible ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="h-48 bg-gray-100 relative">
                      {product.photoUrl ? (
                        <img 
                          src={product.photoUrl} 
                          alt={product.nom} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      {!product.disponible && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                          Indisponible
                        </div>
                      )}
                      {parseFloat(product.prix) < 2000 && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                          Promotion
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{product.nom}</h3>
                        <span className="font-bold text-orange-500">
                          {formatFCFA(parseFloat(product.prix) || 0)}
                        </span>
                      </div>
                      
                      {product.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      {product.categorie && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                          <span>{product.categorie.icone || '🍽️'}</span>
                          <span>{product.categorie.nom}</span>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {product.disponible ? (
                          <>
                            <button
                              onClick={() => handleQuickAdd(product)}
                              className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium"
                            >
                              Ajouter
                            </button>
                            <button
                              onClick={() => setSelectedProduct(product)}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                            >
                              Personnaliser
                            </button>
                          </>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                          >
                            Indisponible
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Customization Modal */}
      {selectedProduct && (
        <ProductCustomizationModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleAddToCart}
        />
      )}
    </div>
  );
}