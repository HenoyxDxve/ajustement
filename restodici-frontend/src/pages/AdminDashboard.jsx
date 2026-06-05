// src/pages/AdminDashboard.jsx — Dashboard Gérant Complet (US-09, US-10, US-21, US-26 à US-30, US-37)
// ✨ Redesign 2024: Premium Professional Dashboard
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { menuService } from '../services/menu.service';
import { commandesService } from '../services/commandes.service';
import { useAuth } from '../hooks/useAuth';
import {
  LogOut, UtensilsCrossed, AlertTriangle, CheckCircle, FolderTree, Loader2,
  TrendingUp, DollarSign, Package, Clock, Settings, Bell, Users, BarChart3,
  Plus, Edit2, Trash2, Eye, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
  MapPin, Calendar, Download, Filter, Search, RefreshCw, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// Premium Color Palette - Modern & Professional
const COLORS = {
  bg: 'bg-slate-50',
  bgDark: 'bg-slate-900',
  text: 'text-slate-900',
  textLight: 'text-slate-50',
  textMuted: 'text-slate-500',
  textSecondary: 'text-slate-600',
  primary: 'text-orange-600',
  primaryBg: 'bg-orange-600',
  primaryLight: 'bg-orange-50',
  primaryBorder: 'border-orange-200',
  success: 'text-emerald-600',
  successBg: 'bg-emerald-50',
  card: 'bg-white',
  border: 'border-slate-200',
  shadow: 'shadow-sm hover:shadow-md',
  gradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
};

// Premium Order Status Colors
const ORDER_STATUS = {
  RECUE: { label: 'Reçue', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100' },
  CONFIRMEE: { label: 'Confirmée', bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-100' },
  EN_PREP: { label: 'En préparation', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100' },
  PRETE: { label: 'Prête', bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100' },
  EN_LIVRAISON: { label: 'En livraison', bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100' },
  LIVREE: { label: 'Livrée', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100' },
  ANNULEE: { label: 'Annulée', bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100' },
};

// Navigation Tabs - Premium Design
const TABS = [
  { id: 'overview', label: 'Aperçu', icon: BarChart3 },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'orders', label: 'Commandes', icon: Package },
  { id: 'stocks', label: 'Stocks', icon: AlertTriangle },
  { id: 'finance', label: 'Finances', icon: DollarSign },
  { id: 'settings', label: 'Configuration', icon: Settings },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Données dashboard
  const [stats, setStats] = useState({
    caJour: 0, caSemaine: 0, caMois: 0,
    commandesJour: 0, ticketMoyen: 0, margeBrute: 0,
    articlesTotal: 0, articlesDispo: 0, articlesRupture: 0,
    alertesStock: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [articles, setArticles] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [restaurantConfig, setRestaurantConfig] = useState({
    nom: '', horaires: {}, zonesLivraison: [], actif: true,
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Sync tab avec l'URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/menu')) setActiveTab('menu');
    else if (path.includes('/admin/commandes')) setActiveTab('orders');
    else if (path.includes('/admin/stocks')) setActiveTab('stocks');
    else if (path.includes('/admin/finance')) setActiveTab('finance');
    else if (path.includes('/admin/parametres')) setActiveTab('settings');
    else setActiveTab('overview');
  }, [location.pathname]);

  // Chargement initial des données (US-26, US-09, US-21)
  useEffect(() => {
    if (!user?.restaurant?.id) return;
    
    const fetchData = async () => {
      try {
        // KPIs Trésorerie (US-26)
        const [menuRes, ordersRes] = await Promise.all([
          menuService.getMenu(null, 'TOUS', user.restaurant.id),
          commandesService.getRecentOrders(user.restaurant.id),
        ]);
        
        const articlesData = menuRes;
        const ordersData = ordersRes;
        
        // Calcul stats
        const today = new Date().toDateString();
        const todayOrders = ordersData.filter(o => new Date(o.createdAt).toDateString() === today);
        const caJour = todayOrders.reduce((sum, o) => sum + Number(o.montantTotal), 0);
        const ticketMoyen = todayOrders.length > 0 ? caJour / todayOrders.length : 0;
        
        setStats({
          caJour,
          caSemaine: ordersData.filter(o => {
            const d = new Date(o.createdAt);
            const now = new Date();
            const diffDays = (now - d) / (1000 * 60 * 60 * 24);
            return diffDays <= 7;
          }).reduce((sum, o) => sum + Number(o.montantTotal), 0),
          caMois: ordersData.reduce((sum, o) => sum + Number(o.montantTotal), 0),
          commandesJour: todayOrders.length,
          ticketMoyen: Math.round(ticketMoyen),
          margeBrute: 65, // Mock — à calculer via US-29
          articlesTotal: articlesData.length,
          articlesDispo: articlesData.filter(a => a.disponible).length,
          articlesRupture: articlesData.filter(a => !a.disponible).length,
          alertesStock: articlesData.filter(a => a.stock <= (a.seuilMin || 5)).length,
        });
        
        setArticles(articlesData);
        setRecentOrders(ordersData.slice(0, 5));
        setStockAlerts(articlesData.filter(a => a.stock <= (a.seuilMin || 5)).slice(0, 5));
        
        // Config restaurant (US-37)
        setRestaurantConfig({
          nom: user.restaurant.nom,
          horaires: { lun: '08:00-22:00', mar: '08:00-22:00', mer: '08:00-22:00', jeu: '08:00-22:00', ven: '08:00-23:00', sam: '09:00-23:00', dim: '10:00-21:00' },
          zonesLivraison: ['Cocody', 'Plateau', 'Yopougon', 'Marcory'],
          actif: true,
        });
        
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Toggle disponibilité article (US-09, RG-02)
  const handleToggleArticle = async (id, currentStatus, articleName) => {
    try {
      await menuService.toggleArticle(id, !currentStatus, user.restaurant.id);
      setArticles(prev => prev.map(a => 
        a.id === id ? { ...a, disponible: !currentStatus } : a
      ));
      // Feedback visuel
      showNotification(`"${articleName}" ${!currentStatus ? 'activé' : 'masqué'}`, 'success');
    } catch (err) {
      showNotification('Erreur lors de la mise à jour', 'error');
    }
  };

  // Mise à jour statut commande (RG-10)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await commandesService.updateStatus(orderId, newStatus);
      setRecentOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, statut: newStatus } : o
      ));
      showNotification('Statut mis à jour', 'success');
    } catch (err) {
      showNotification('Erreur: ' + err.response?.data?.message, 'error');
    }
  };

  // Notification toast simple
  const showNotification = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg z-50 text-sm font-medium animate-fade-in ${
      type === 'success' ? 'bg-[#2ECC71] text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-[#0F172A] text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Logout
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutModal(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <Loader2 className="w-16 h-16 text-orange-600 animate-spin opacity-40" />
            <div className="absolute inset-0 animate-pulse">
              <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-orange-600 animate-spin"></div>
            </div>
          </div>
          <p className="text-slate-600 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // ========== RENDER PRINCIPAL ==========
  return (
    <div className={`min-h-screen ${COLORS.bg} ${COLORS.text}`}>
      
      {/* ===== HEADER PREMIUM ===== */}
      <header className={`${COLORS.card} border-b ${COLORS.border} sticky top-0 z-40 backdrop-blur-xl bg-white/95`}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${COLORS.primaryBg} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
              R
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${COLORS.text}`}>Resto d'ici</h1>
              <p className={`text-sm ${COLORS.textSecondary}`}>{restaurantConfig.nom}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications Badge */}
            <button className={`relative p-2.5 ${COLORS.card} rounded-xl border ${COLORS.border} hover:${COLORS.shadow} transition-all group`}>
              <Bell className={`w-5 h-5 ${COLORS.textSecondary} group-hover:${COLORS.primary}`} />
              {stats.alertesStock > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {stats.alertesStock}
                </span>
              )}
            </button>
            
            {/* User Profile */}
            <div className={`flex items-center gap-3 px-4 py-2 ${COLORS.card} rounded-xl border ${COLORS.border}`}>
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user?.nom?.charAt(0) || 'G'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold">{user?.nom}</p>
                <p className="text-xs text-slate-500">{user?.email?.split('@')[0]}</p>
              </div>
              <button onClick={handleLogout} className={`p-1.5 ${COLORS.textMuted} hover:${COLORS.primary} transition-colors`}>
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== NAVIGATION TABS PREMIUM ===== */}
      <nav className={`${COLORS.card} border-b ${COLORS.border} sticky top-16 z-30 backdrop-blur-xl bg-white/95`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-3">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive 
                      ? `${COLORS.primaryBg} text-white shadow-md` 
                      : `${COLORS.textSecondary} hover:${COLORS.text} hover:bg-slate-100`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* ===== TAB: OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* KPI Cards Grid - Premium Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard 
                icon={<DollarSign className={`w-6 h-6 ${COLORS.primary}`} />}
                label="CA Aujourd'hui"
                value={`${stats.caJour.toLocaleString()} FCFA`}
                trend={12}
                color="orange"
              />
              <KPICard 
                icon={<Package className="w-6 h-6 text-blue-600" />}
                label="Commandes du jour"
                value={stats.commandesJour}
                trend={3}
                color="blue"
              />
              <KPICard 
                icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
                label="Marge Brute"
                value={`${stats.margeBrute}%`}
                trend={0}
                color="green"
                unit="%"
              />
              <KPICard 
                icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
                label="Alertes Stock"
                value={stats.alertesStock}
                trend={stats.alertesStock > 0 ? -1 : 0}
                color="amber"
                alert={stats.alertesStock > 0}
              />
            </div>

            {/* Revenue Chart Section */}
            <div className={`${COLORS.card} rounded-2xl border ${COLORS.border} p-8 ${COLORS.shadow}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold">Chiffre d'affaires (7 derniers jours)</h3>
                  <p className={`text-sm ${COLORS.textSecondary} mt-1`}>Tendance positive + 12% par rapport à la semaine précédente</p>
                </div>
                <select className={`px-4 py-2 border ${COLORS.border} rounded-lg text-sm ${COLORS.textSecondary} bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent`}>
                  <option>Cette semaine</option>
                  <option>Ce mois</option>
                  <option>Trimestre</option>
                </select>
              </div>
              
              {/* Chart Bars */}
              <div className="h-56 flex items-end gap-3">
                {[65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer">
                    <div 
                      className={`w-full ${COLORS.primaryBg} rounded-t-xl transition-all duration-300 group-hover:opacity-80 group-hover:shadow-lg`}
                      style={{ height: `${h}%` }}
                    />
                    <span className={`text-xs font-medium ${COLORS.textSecondary}`}>
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Two-Column Section */}
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Recent Orders */}
              <div className={`${COLORS.card} rounded-2xl border ${COLORS.border} overflow-hidden ${COLORS.shadow}`}>
                <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-transparent">
                  <div>
                    <h3 className="font-bold text-lg">Commandes récentes</h3>
                    <p className={`text-xs ${COLORS.textSecondary} mt-1`}>{recentOrders.length} commandes cette semaine</p>
                  </div>
                  <Link to="/admin/commandes" className={`text-sm ${COLORS.primary} font-semibold hover:underline transition-colors`}>
                    Voir tout →
                  </Link>
                </div>
                <div className="divide-y divide-slate-200">
                  {recentOrders.length > 0 ? recentOrders.map(order => (
                    <div key={order.id} className="px-8 py-4 hover:bg-slate-50 transition-colors group cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">Commande #{order.numero}</p>
                          <p className={`text-xs ${COLORS.textSecondary} mt-1`}>
                            {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {order.modeLivraison?.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${COLORS.primary}`}>{Number(order.montantTotal).toLocaleString()} FCFA</p>
                          <span className={`text-xs px-3 py-1 rounded-full mt-1 inline-block font-medium ${ORDER_STATUS[order.statut]?.badge} ${ORDER_STATUS[order.statut]?.text}`}>
                            {ORDER_STATUS[order.statut]?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="px-8 py-12 text-center">
                      <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className={COLORS.textSecondary}>Aucune commande récente</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Alerts */}
              <div className={`${COLORS.card} rounded-2xl border ${COLORS.border} overflow-hidden ${COLORS.shadow}`}>
                <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-transparent">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      Alertes Stock
                    </h3>
                    <p className={`text-xs ${COLORS.textSecondary} mt-1`}>{stockAlerts.length} articles sous seuil</p>
                  </div>
                  <Link to="/admin/stocks" className={`text-sm ${COLORS.primary} font-semibold hover:underline transition-colors`}>
                    Gérer →
                  </Link>
                </div>
                <div className="divide-y divide-slate-200">
                  {stockAlerts.length > 0 ? stockAlerts.map(article => (
                    <div key={article.id} className="px-8 py-4 hover:bg-amber-50 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 overflow-hidden flex-shrink-0">
                            {article.photoUrl ? (
                              <img src={article.photoUrl} alt={article.nom} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-base">🍽️</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{article.nom}</p>
                            <p className={`text-xs ${COLORS.textSecondary}`}>Stock: <span className="text-amber-600 font-bold">{article.stock}</span> / Seuil: {article.seuilMin || 5}</p>
                          </div>
                        </div>
                        <button className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${COLORS.primaryBg} text-white hover:opacity-90 transition-all whitespace-nowrap ml-2`}>
                          Réapprovisionner
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="px-8 py-12 text-center">
                      <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                      <p className={COLORS.textSecondary}>Tous les stocks OK ✓</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ===== TAB: MENU (US-09, US-10) ===== */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold">Gestion du Menu</h2>
                <p className={`text-sm ${COLORS.textSecondary} mt-1`}>Organisez vos articles et disponibilités</p>
              </div>
              <div className="flex gap-3">
                <button className={`flex items-center gap-2 px-5 py-3 border ${COLORS.border} rounded-xl ${COLORS.textSecondary} hover:${COLORS.text} font-semibold transition-all hover:shadow-md`}>
                  <Filter className="w-5 h-5" /> Filtrer
                </button>
                <button className={`flex items-center gap-2 px-5 py-3 rounded-xl ${COLORS.primaryBg} text-white font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl`}>
                  <Plus className="w-5 h-5" /> Nouvel article
                </button>
              </div>
            </div>

            {/* Articles Table */}
            <div className={`${COLORS.card} rounded-2xl border ${COLORS.border} overflow-hidden ${COLORS.shadow}`}>
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-5 bg-gradient-to-r from-slate-50 to-transparent border-b border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-600">
                <div className="col-span-5">Article</div>
                <div className="col-span-2">Catégorie</div>
                <div className="col-span-2">Prix</div>
                <div className="col-span-2">Stock</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              
              {/* Articles List */}
              <div className="divide-y divide-slate-200">
                {articles.map((article, idx) => (
                  <div key={article.id} className="px-8 py-5 hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-colors group border-b-0">
                    <div className="flex flex-col md:grid md:grid-cols-12 md:gap-6 md:items-center">
                      
                      {/* Article Info */}
                      <div className="col-span-5 flex items-center gap-4 mb-4 md:mb-0">
                        <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 overflow-hidden flex-shrink-0 border-2 border-orange-200 shadow-md group-hover:shadow-lg transition-all">
                          {article.photoUrl ? (
                            <img src={article.photoUrl} alt={article.nom} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm md:text-base truncate">{article.nom}</h3>
                          <p className={`text-xs ${COLORS.textSecondary} truncate mt-1`}>{article.description}</p>
                        </div>
                      </div>
                      
                      {/* Category */}
                      <div className="col-span-2">
                        <span className="inline-block px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold">
                          {article.categorie?.nom}
                        </span>
                      </div>
                      
                      {/* Price */}
                      <div className="col-span-2">
                        <p className={`text-lg font-bold ${COLORS.primary}`}>{Number(article.prix).toLocaleString()}</p>
                        <p className="text-xs text-slate-500">FCFA</p>
                      </div>
                      
                      {/* Stock */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${
                            article.stock <= (article.seuilMin || 5) ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {article.stock}
                          </span>
                          {article.stock <= (article.seuilMin || 5) && (
                            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                      
                      {/* Toggle & Actions */}
                      <div className="col-span-1 flex items-center justify-end gap-3">
                        {/* Premium Toggle */}
                        <button
                          onClick={() => handleToggleArticle(article.id, article.disponible, article.nom)}
                          className={`relative w-13 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                            article.disponible ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md' : 'bg-gradient-to-r from-slate-300 to-slate-400'
                          }`}
                          aria-label={`Basculer disponibilité`}
                        >
                          <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                            article.disponible ? 'translate-x-6' : 'translate-x-1'
                          }`}>
                            {article.disponible ? (
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                            )}
                          </span>
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className="relative group/menu">
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                            <button className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-3 font-medium text-slate-700 border-b border-slate-100">
                              <Eye className="w-4 h-4" /> Voir détails
                            </button>
                            <button className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-3 font-medium text-slate-700 border-b border-slate-100">
                              <Edit2 className="w-4 h-4" /> Modifier
                            </button>
                            <button className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 flex items-center gap-3 font-medium text-red-600">
                              <Trash2 className="w-4 h-4" /> Archiver
                            </button>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: ORDERS ===== */}
        {activeTab === 'orders' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
              <div>
                <h2 className="text-3xl font-bold">Suivi des Commandes</h2>
                <p className={`text-sm ${COLORS.textSecondary} mt-1`}>Gérez l'état de toutes vos commandes</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    className={`pl-10 pr-4 py-2.5 border ${COLORS.border} rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full`}
                  />
                </div>
                <button className={`p-2.5 border ${COLORS.border} rounded-lg hover:bg-slate-50 transition-colors`}>
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className={`${COLORS.card} rounded-2xl border ${COLORS.border} overflow-hidden ${COLORS.shadow}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-transparent">
                      <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-600">Commande</th>
                      <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-600">Client</th>
                      <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-600">Mode</th>
                      <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-600">Montant</th>
                      <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-600">Statut</th>
                      <th className="px-8 py-4 text-right text-xs font-bold uppercase tracking-widest text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4">
                          <p className="font-bold text-sm">#{order.numero}</p>
                          <p className={`text-xs ${COLORS.textSecondary} mt-1`}>
                            {new Date(order.createdAt).toLocaleString('fr-FR')}
                          </p>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-sm font-medium">{order.client?.nom || 'Client'}</p>
                          <p className={`text-xs ${COLORS.textSecondary}`}>{order.client?.telephone}</p>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-sm font-medium">{order.modeLivraison?.replace('_', ' ')}</span>
                        </td>
                        <td className="px-8 py-4 font-bold text-orange-600 text-sm">
                          {Number(order.montantTotal).toLocaleString()} FCFA
                        </td>
                        <td className="px-8 py-4">
                          <select 
                            value={order.statut}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className={`text-xs px-3 py-1.5 rounded-lg border-none font-semibold cursor-pointer ${ORDER_STATUS[order.statut]?.badge} ${ORDER_STATUS[order.statut]?.text}`}
                          >
                            {Object.entries(ORDER_STATUS).map(([key, val]) => (
                              <option key={key} value={key}>{val.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button className={`text-sm ${COLORS.primary} font-semibold hover:underline transition-colors`}>
                            Détails →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: STOCKS (US-19 à US-25) ===== */}
        {activeTab === 'stocks' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
              <div>
                <h2 className="text-3xl font-bold">Gestion des Stocks</h2>
                <p className={`text-sm ${COLORS.textSecondary} mt-1`}>Suivez vos inventaires en temps réel</p>
              </div>
              <button className={`flex items-center gap-2 px-5 py-3 rounded-xl ${COLORS.primaryBg} text-white font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl`}>
                <Plus className="w-5 h-5" /> Nouvelle entrée
              </button>
            </div>

            {/* Stock Alerts Section */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Articles sous seuil
              </h3>
              <div className="space-y-3">
                {stockAlerts.length > 0 ? stockAlerts.map(article => (
                  <div key={article.id} className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-white border-2 border-red-300 overflow-hidden flex-shrink-0 shadow-md">
                          {article.photoUrl ? (
                            <img src={article.photoUrl} alt={article.nom} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-red-900">{article.nom}</p>
                          <p className="text-sm text-red-700 mt-1">
                            <span className="font-bold">Stock: {article.stock}</span> / Seuil: {article.seuilMin || 5}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2.5 text-sm font-semibold border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                          Détails
                        </button>
                        <button className={`px-4 py-2.5 text-sm font-semibold ${COLORS.primaryBg} text-white rounded-lg hover:opacity-90 transition-colors`}>
                          Commander
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                    <p className="font-semibold text-emerald-900 text-lg">Tous les stocks sont corrects</p>
                    <p className="text-sm text-emerald-700 mt-1">Aucun article sous seuil minimum</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory Table */}
            <div className={`${COLORS.card} rounded-2xl border ${COLORS.border} overflow-hidden ${COLORS.shadow}`}>
              <div className="px-8 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-transparent">
                <h3 className="font-bold text-lg">Inventaire complet</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-8 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-600">Article</th>
                      <th className="px-8 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-600">Stock</th>
                      <th className="px-8 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-600">Seuil</th>
                      <th className="px-8 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-600">Coût Unit.</th>
                      <th className="px-8 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-600">Valeur Stock</th>
                      <th className="px-8 py-3 text-right text-xs font-bold uppercase tracking-widest text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {articles.map(article => (
                      <tr key={article.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4">
                          <p className="font-semibold text-sm">{article.nom}</p>
                          <p className={`text-xs ${COLORS.textSecondary}`}>{article.categorie?.nom}</p>
                        </td>
                        <td className="px-8 py-4">
                          <span className={`text-sm font-bold ${
                            article.stock <= (article.seuilMin || 5) ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {article.stock}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-sm">{article.seuilMin || 5}</td>
                        <td className="px-8 py-4 text-sm font-medium">
                          {article.coutUnitaire?.toLocaleString() || '-'} FCFA
                        </td>
                        <td className="px-8 py-4 font-bold text-orange-600">
                          {((article.coutUnitaire || 0) * article.stock).toLocaleString()} FCFA
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button className={`text-sm ${COLORS.primary} font-semibold hover:underline transition-colors`}>
                            Ajuster
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: FINANCE (US-26 à US-32) ===== */}
        {activeTab === 'finance' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold">Trésorerie & Finances</h2>
              <p className={`text-sm ${COLORS.textSecondary} mt-1`}>Suivi complet de votre santé financière</p>
            </div>
            
            {/* KPIs Financiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard 
                icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                label="CA Ce Mois"
                value={`${stats.caMois.toLocaleString()}`}
                trend={18}
                color="green"
              />
              <KPICard 
                icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
                label="Marge Brute"
                value={`${stats.margeBrute}%`}
                trend={0}
                color="orange"
                unit="%"
              />
              <KPICard 
                icon={<Package className="w-6 h-6 text-blue-600" />}
                label="Ticket Moyen"
                value={`${stats.ticketMoyen.toLocaleString()}`}
                trend={5}
                color="blue"
              />
              <KPICard 
                icon={<BarChart3 className="w-6 h-6 text-purple-600" />}
                label="Dépenses Mois"
                value="1.2M FCFA"
                trend={-2}
                color="amber"
              />
            </div>

            {/* Payment Methods Distribution */}
            <div className={`${COLORS.card} rounded-2xl border ${COLORS.border} p-8 ${COLORS.shadow}`}>
              <h3 className="text-xl font-bold mb-6">Répartition des paiements</h3>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  {[
                    { label: 'Orange Money', value: 45, color: 'bg-orange-500' },
                    { label: 'MTN MoMo', value: 30, color: 'bg-yellow-500' },
                    { label: 'Wave', value: 15, color: 'bg-blue-500' },
                    { label: 'Espèces', value: 10, color: 'bg-slate-400' },
                  ].map(mode => (
                    <div key={mode.label} className="group">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-slate-700">{mode.label}</span>
                        <span className="font-bold text-orange-600">{mode.value}%</span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${mode.color} rounded-full transition-all group-hover:shadow-lg`}
                          style={{ width: `${mode.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 rounded-full border-8 border-orange-200 bg-gradient-to-br from-orange-50 to-transparent flex items-center justify-center shadow-lg">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-orange-600">45%</p>
                        <p className="text-xs text-slate-600 mt-1">Orange Money</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <button className={`${COLORS.card} rounded-2xl border ${COLORS.border} p-6 hover:shadow-xl transition-all group text-left`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Download className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">Export SYSCOHADA</h4>
                    <p className={`text-sm ${COLORS.textSecondary} mt-1`}>CSV/Excel conforme pour comptabilité</p>
                    <span className={`text-sm ${COLORS.primary} font-semibold mt-3 inline-block`}>Télécharger →</span>
                  </div>
                </div>
              </button>
              
              <button className={`${COLORS.card} rounded-2xl border ${COLORS.border} p-6 hover:shadow-xl transition-all group text-left`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">Rapport Mensuel</h4>
                    <p className={`text-sm ${COLORS.textSecondary} mt-1`}>P&L complet avec analyses détaillées</p>
                    <span className="text-sm text-blue-600 font-semibold mt-3 inline-block">Générer →</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ===== TAB: SETTINGS (US-37) ===== */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h2 className="text-3xl font-bold">Configuration</h2>
              <p className={`text-sm ${COLORS.textSecondary} mt-1`}>Personnalisez votre établissement</p>
            </div>

            {/* Opening Hours */}
            <div className={`${COLORS.card} rounded-2xl border ${COLORS.border} p-8 ${COLORS.shadow}`}>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Clock className={`w-6 h-6 ${COLORS.primary}`} />
                Horaires d'ouverture
              </h3>
              <div className="space-y-4">
                {['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].map(day => (
                  <div key={day} className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
                    <span className="font-semibold text-slate-700 capitalize min-w-20">
                      {day === 'lun' ? 'Lundi' : day === 'mar' ? 'Mardi' : day === 'mer' ? 'Mercredi' : day === 'jeu' ? 'Jeudi' : day === 'ven' ? 'Vendredi' : day === 'sam' ? 'Samedi' : 'Dimanche'}
                    </span>
                    <input 
                      type="text" 
                      value={restaurantConfig.horaires[day]}
                      onChange={(e) => setRestaurantConfig(prev => ({
                        ...prev,
                        horaires: { ...prev.horaires, [day]: e.target.value }
                      }))}
                      className={`px-4 py-2.5 border ${COLORS.border} rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                      placeholder="08:00-22:00"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Zones */}
            <div className={`${COLORS.card} rounded-2xl border ${COLORS.border} p-8 ${COLORS.shadow}`}>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <MapPin className={`w-6 h-6 ${COLORS.primary}`} />
                Zones de livraison
              </h3>
              <div className="space-y-3">
                {restaurantConfig.zonesLivraison.map((zone, idx) => (
                  <div key={idx} className="flex items-center gap-3 group">
                    <input 
                      type="text" 
                      value={zone}
                      onChange={(e) => {
                        const newZones = [...restaurantConfig.zonesLivraison];
                        newZones[idx] = e.target.value;
                        setRestaurantConfig(prev => ({ ...prev, zonesLivraison: newZones }));
                      }}
                      className={`flex-1 px-4 py-2.5 border ${COLORS.border} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                    />
                    <button className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button className={`text-sm ${COLORS.primary} font-semibold flex items-center gap-2 hover:underline mt-3`}>
                  <Plus className="w-4 h-4" /> Ajouter une zone
                </button>
              </div>
            </div>

            {/* Restaurant Status */}
            <div className={`${COLORS.card} rounded-2xl border ${COLORS.border} p-8 ${COLORS.shadow}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Statut du restaurant</h3>
                  <p className={`text-sm ${COLORS.textSecondary} mt-1`}>Les clients peuvent passer commande</p>
                </div>
                <button
                  onClick={() => setRestaurantConfig(prev => ({ ...prev, actif: !prev.actif }))}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                    restaurantConfig.actif ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-slate-300 to-slate-400'
                  } shadow-md`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    restaurantConfig.actif ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-slate-200">
              <button className={`px-8 py-3.5 ${COLORS.primaryBg} text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl`}>
                Enregistrer les modifications
              </button>
            </div>

          </div>
        )}

      </main>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-sm ${COLORS.card} rounded-3xl p-8 shadow-2xl border ${COLORS.border}`}>
            <div className="mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <h3 className={`text-xl font-bold ${COLORS.text}`}>Confirmer la déconnexion</h3>
              <p className={`text-sm ${COLORS.textSecondary} mt-2`}>Vous serez redirigé vers la page de connexion. Les données non sauvegardées seront perdues.</p>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`flex-1 px-4 py-3 rounded-xl border ${COLORS.border} ${COLORS.text} font-semibold hover:bg-slate-50 transition-colors`}
              >
                Annuler
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Premium KPI Card Component =====
function KPICard({ icon, label, value, trend, color = 'orange', unit = '', alert = false }) {
  const colors = {
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', accent: 'text-orange-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', accent: 'text-blue-600' },
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', accent: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', accent: 'text-amber-600' },
  };

  const scheme = colors[color] || colors.orange;
  const trendPositive = trend > 0;
  const trendNeutral = trend === 0;
  const trendNegative = trend < 0;

  return (
    <div className={`${scheme.bg} border ${scheme.border} rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group`}>
      {/* Icon & Alert Badge */}
      <div className="flex items-start justify-between mb-5">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
          {icon}
        </div>
        {alert && (
          <div className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
            ⚠ Action
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-4">
        <p className={`text-3xl font-bold ${scheme.text}`}>{value}</p>
        <p className={`text-sm font-medium text-slate-600 mt-1`}>{label}</p>
      </div>

      {/* Trend Indicator */}
      {trend !== undefined && (
        <div className={`flex items-center gap-2 text-sm font-semibold ${
          trendPositive ? 'text-emerald-600' : 
          trendNeutral ? 'text-slate-500' : 
          'text-red-600'
        }`}>
          {trendPositive && (
            <>
              <ArrowUpRight className="w-4 h-4" />
              +{trend}% cette semaine
            </>
          )}
          {trendNeutral && (
            <>
              <div className="w-4 h-0.5 bg-slate-400 rounded"></div>
              Stable
            </>
          )}
          {trendNegative && (
            <>
              <ArrowDownRight className="w-4 h-4" />
              {trend}% cette semaine
            </>
          )}
        </div>
      )}
    </div>
  );
}