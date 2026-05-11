// src/pages/client/ClientDashboard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, MapPin, Heart, User, Clock, TrendingUp, 
  Phone, Mail, Calendar, ChevronRight, ShoppingBag,
  UtensilsCrossed, Truck, Store, LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatFCFA, formatDate, STATUS_LABELS, STATUS_COLORS } from '../../utils/formatters';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Données mockées (à remplacer par API)
  const stats = {
    totalCommandes: 12,
    depensesMois: 45000,
    favorisCount: 5,
    pointsFidelite: 340
  };

  const recentOrders = [
    {
      id: 'cmd-10',
      numero: 'CMD-2026-10',
      date: '2026-05-01T12:30:00',
      montantTotal: 5200,
      statut: 'LIVREE',
      modeLivraison: 'LIVRAISON',
      adresse: 'Cocody Riviera',
      articles: 3
    },
    {
      id: 'cmd-09',
      numero: 'CMD-2026-09',
      date: '2026-05-04T09:15:00',
      montantTotal: 3500,
      statut: 'EN_PREP',
      modeLivraison: 'EMPORTER',
      articles: 2
    }
  ];

  const savedAddresses = [
    { id: 1, label: 'Maison', adresse: 'Cocody Riviera 3, Abidjan', telephone: '+225 07 07 07 07', default: true },
    { id: 2, label: 'Bureau', adresse: 'Plateau, Immeuble CCIA', telephone: '+225 05 05 05 05', default: false }
  ];

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: User },
    { id: 'orders', label: 'Mes Commandes', icon: Package },
    { id: 'addresses', label: 'Adresses', icon: MapPin },
    { id: 'favorites', label: 'Favoris', icon: Heart },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5]">
      {/* Header Principal - UNIQUE */}
      <header className="bg-white border-b border-[#E8E2D9] sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo + Titre */}
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => navigate('/menu')}
            >
              <div className="w-10 h-10 bg-[#D94500] rounded-xl flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
                R
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-[#2D2720]">Resto d'ici</h1>
                <p className="text-xs text-[#8B7355]">Mon Compte</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/menu')}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#D94500] hover:bg-[#B83A00] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Commander</span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="p-2.5 text-[#8B7355] hover:text-[#D94500] hover:bg-red-50 rounded-xl transition-all"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 lg:px-8 border-t border-[#E8E2D9]">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive 
                      ? 'bg-[#D94500] text-white shadow-md' 
                      : 'text-[#8B7355] hover:text-[#2D2720] hover:bg-[#F9F7F5]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Contenu Principal - Pleine largeur adaptative */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full">
          
          {/* ===== ONGLET: VUE D'ENSEMBLE ===== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Stats Cards - Responsive Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  icon={<Package className="w-5 h-5 text-[#D94500]" />}
                  label="Total Commandes"
                  value={stats.totalCommandes}
                  color="bg-[#FFF5EB]"
                />
                <StatCard 
                  icon={<TrendingUp className="w-5 h-5 text-[#2ECC71]" />}
                  label="Dépenses ce mois"
                  value={formatFCFA(stats.depensesMois)}
                  color="bg-[#E6F7ED]"
                />
                <StatCard 
                  icon={<Heart className="w-5 h-5 text-red-500" />}
                  label="Favoris"
                  value={stats.favorisCount}
                  color="bg-red-50"
                />
                <StatCard 
                  icon={<UtensilsCrossed className="w-5 h-5 text-purple-600" />}
                  label="Points fidélité"
                  value={stats.pointsFidelite}
                  color="bg-purple-50"
                />
              </div>

              {/* Commandes Récentes */}
              <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-[#2D2720]">Commandes Récentes</h2>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="text-sm text-[#D94500] font-semibold hover:underline flex items-center gap-1"
                  >
                    Voir tout <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {recentOrders.map(order => (
                    <div 
                      key={order.id} 
                      className="group p-4 sm:p-5 bg-[#F9F7F5] rounded-xl border border-[#E8E2D9] hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(`/suivi/${order.id}`)}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                              <h3 className="font-bold text-[#2D2720]">{order.numero}</h3>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.statut]}`}>
                                {STATUS_LABELS[order.statut]}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#8B7355]">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {formatDate(order.date)}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                {order.modeLivraison === 'LIVRAISON' ? <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                {order.modeLivraison === 'LIVRAISON' ? 'Livraison' : 'À emporter'}
                              </span>
                              {order.adresse && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    {order.adresse}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl sm:text-2xl font-bold text-[#D94500]">{formatFCFA(order.montantTotal)}</p>
                            <p className="text-xs text-[#8B7355]">{order.articles} articles</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end">
                          <button className="text-[#D94500] font-semibold text-sm hover:underline flex items-center gap-1">
                            Suivre <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adresses Enregistrées */}
              <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-[#2D2720]">Mes Adresses</h2>
                  <button className="text-sm text-[#D94500] font-semibold hover:underline">
                    + Ajouter
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {savedAddresses.map(addr => (
                    <div key={addr.id} className={`p-4 sm:p-5 rounded-xl border ${addr.default ? 'border-[#D94500] bg-[#FFF5EB]' : 'border-[#E8E2D9] bg-[#F9F7F5]'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-5 h-5 ${addr.default ? 'text-[#D94500]' : 'text-[#8B7355]'}`} />
                          <h3 className="font-bold text-[#2D2720]">{addr.label}</h3>
                        </div>
                        {addr.default && (
                          <span className="px-2 py-1 bg-[#D94500] text-white text-xs font-medium rounded-full">
                            Par défaut
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#8B7355] mb-2">{addr.adresse}</p>
                      <p className="text-sm text-[#8B7355] flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {addr.telephone}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== ONGLET: COMMANDES ===== */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 sm:p-6 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-[#2D2720] mb-6">Historique des Commandes</h2>
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div key={order.id} className="p-4 sm:p-5 bg-[#F9F7F5] rounded-xl border border-[#E8E2D9] hover:shadow-md transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                          <h3 className="font-bold text-[#2D2720]">{order.numero}</h3>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.statut]}`}>
                            {STATUS_LABELS[order.statut]}
                          </span>
                        </div>
                        <p className="text-sm text-[#8B7355]">{formatDate(order.date)}</p>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-right">
                          <p className="text-xl sm:text-2xl font-bold text-[#D94500]">{formatFCFA(order.montantTotal)}</p>
                          <p className="text-xs text-[#8B7355]">{order.articles} articles</p>
                        </div>
                        <button 
                          onClick={() => navigate(`/suivi/${order.id}`)}
                          className="px-4 py-2 bg-[#D94500] hover:bg-[#B83A00] text-white font-semibold rounded-xl transition-all text-sm"
                        >
                          Suivre
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== ONGLET: ADRESSES ===== */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-[#2D2720]">Mes Adresses de Livraison</h2>
                <button className="px-4 sm:px-5 py-2.5 bg-[#D94500] hover:bg-[#B83A00] text-white font-semibold rounded-xl shadow-md transition-all text-sm">
                  + Nouvelle Adresse
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedAddresses.map(addr => (
                  <div key={addr.id} className={`p-5 sm:p-6 rounded-xl border ${addr.default ? 'border-[#D94500] bg-[#FFF5EB]' : 'border-[#E8E2D9] bg-white'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-6 h-6 ${addr.default ? 'text-[#D94500]' : 'text-[#8B7355]'}`} />
                        <h3 className="font-bold text-[#2D2720]">{addr.label}</h3>
                      </div>
                      {addr.default && (
                        <span className="px-2 py-1 bg-[#D94500] text-white text-xs font-medium rounded-full">
                          Défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#8B7355] mb-3">{addr.adresse}</p>
                    <p className="text-sm text-[#8B7355] flex items-center gap-1 mb-4">
                      <Phone className="w-4 h-4" />
                      {addr.telephone}
                    </p>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 text-sm font-medium text-[#D94500] border border-[#D94500] rounded-xl hover:bg-[#FFF5EB] transition-all">
                        Modifier
                      </button>
                      <button className="flex-1 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all">
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== ONGLET: FAVORIS ===== */}
          {activeTab === 'favorites' && (
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 sm:p-12 shadow-sm text-center">
              <Heart className="w-16 h-16 text-[#8B7355] mx-auto mb-4 opacity-50" />
              <h2 className="text-xl sm:text-2xl font-bold text-[#2D2720] mb-2">Vos Favoris</h2>
              <p className="text-[#8B7355] mb-6 max-w-md mx-auto">Retrouvez ici vos plats préférés pour commander plus rapidement</p>
              <button 
                onClick={() => navigate('/menu')}
                className="px-6 py-3 bg-[#D94500] hover:bg-[#B83A00] text-white font-semibold rounded-xl shadow-md transition-all"
              >
                Découvrir le menu
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Composant StatCard réutilisable
function StatCard({ icon, label, value, color }) {
  return (
    <div className={`${color} rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/50 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-white rounded-xl shadow-sm">
          {icon}
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-[#2D2720]">{value}</p>
      <p className="text-xs text-[#8B7355] font-medium mt-1">{label}</p>
    </div>
  );
}