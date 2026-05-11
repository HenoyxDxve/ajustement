// src/pages/b2b/B2BDashboard.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CreditCard, FileText, Users, Calendar, Package, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { b2bAPI } from '../../services/api';

export default function B2BDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Try to load real data from backend
        const response = await b2bAPI.getDashboard();
        setDashboardData(response.data);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        // Use mock data as fallback when backend is not ready
        const mockData = {
          totalSpent: 1250000,
          pendingOrders: 3,
          activeCollaborators: 15,
          monthlyBudget: 2000000,
          recentOrders: [
            { id: 'ORD-001', date: '2026-05-10', amount: 45000, status: 'livrée' },
            { id: 'ORD-002', date: '2026-05-09', amount: 78000, status: 'en cours' },
            { id: 'ORD-003', date: '2026-05-08', amount: 32000, status: 'confirmée' }
          ],
          budgetUsage: 62.5
        };
        setDashboardData(mockData);
        // Only show error if it's not a 404 (endpoint not found)
        if (err.response?.status !== 404) {
          setError('Impossible de charger les données du tableau de bord');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Fallback data in case useEffect fails completely
  const fallbackData = {
    totalSpent: 0,
    pendingOrders: 0,
    activeCollaborators: 0,
    monthlyBudget: 0,
    recentOrders: [],
    budgetUsage: 0
  };

  const data = dashboardData || fallbackData;

  const stats = [
    { 
      title: 'Dépenses mensuelles', 
      value: typeof data.monthlyExpenses === 'number' ? `${data.monthlyExpenses.toLocaleString()} FCFA` : data.monthlyExpenses || '0 FCFA', 
      icon: DollarSign, 
      color: 'text-[#D94500]',
      bg: 'bg-[#FFF5EB]'
    },
    { 
      title: 'Commandes ce mois', 
      value: data.monthlyOrders || 0, 
      icon: Package, 
      color: 'text-[#2ECC71]',
      bg: 'bg-[#E6F7ED]'
    },
    { 
      title: 'Collaborateurs actifs', 
      value: data.activeCollaborators || 0, 
      icon: Users, 
      color: 'text-[#3498DB]',
      bg: 'bg-[#EBF5FB]'
    },
    { 
      title: 'Factures impayées', 
      value: data.unpaidInvoices || 0, 
      icon: FileText, 
      color: 'text-[#E74C3C]',
      bg: 'bg-[#FDEDEC]'
    }
  ];

  const quickActions = [
    { 
      title: 'Nouvelle commande groupée', 
      description: 'Commander pour plusieurs employés', 
      icon: Package,
      action: () => navigate('/b2b/bulk-order'),
      color: 'bg-[#D94500] hover:bg-[#B83A00]'
    },
    { 
      title: 'Gérer les collaborateurs', 
      description: 'Ajouter/modifier avec limites de dépense', 
      icon: Users,
      action: () => navigate('/b2b/teams'),
      color: 'bg-[#3498DB] hover:bg-[#2980B9]'
    },
    { 
      title: 'Facturation mensuelle', 
      description: 'Consulter et payer vos factures', 
      icon: FileText,
      action: () => navigate('/b2b/invoices'),
      color: 'bg-[#E74C3C] hover:bg-[#C0392B]'
    },
    { 
      title: 'Rapports & Audit', 
      description: 'Suivre dépenses et historique', 
      icon: TrendingUp,
      action: () => navigate('/b2b/reports'),
      color: 'bg-[#9B59B6] hover:bg-[#8E44AD]'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-[#E8E2D9] rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-[#E8E2D9]">
                  <div className="h-6 bg-[#E8E2D9] rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-[#E8E2D9] rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-[#E8E2D9] h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F5] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-[#2ECC71]" />
            <h1 className="text-3xl font-bold text-[#2D2720]">Espace Entreprise</h1>
          </div>
          <p className="text-[#8B7355]">
            Gérez les repas de vos équipes et suivez vos dépenses en temps réel
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-6 border border-[#E8E2D9] hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-[#8B7355] mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-[#2D2720]">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className={`rounded-2xl p-6 border border-[#E8E2D9] hover:shadow-lg transition-all text-white ${action.color} relative overflow-hidden group`}
              >
                {/* background overlay to keep color always */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/0" />

                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{action.title}</h3>
                  <p className="text-white/80 text-sm">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8E2D9] mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#2D2720]">Commandes récentes</h2>
            <Link to="/b2b/orders" className="text-[#2ECC71] font-medium hover:underline">
              Voir tout
            </Link>
          </div>
          
          {dashboardData?.recentOrders?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border border-[#E8E2D9] rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      order.status === 'livree' ? 'bg-[#E6F7ED]' : 
                      order.status === 'en_livraison' ? 'bg-[#EBF5FB]' : 
                      'bg-[#FFF5EB]'
                    }`}>
                      {order.status === 'livree' ? (
                        <CheckCircle className="w-5 h-5 text-[#2ECC71]" />
                      ) : order.status === 'en_livraison' ? (
                        <Clock className="w-5 h-5 text-[#3498DB]" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-[#D94500]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[#2D2720]">Commande #{order.numero}</p>
                      <p className="text-sm text-[#8B7355]">
                        {order.restaurantNom} • {order.dateCommande}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#2D2720]">{typeof order.total === 'number' ? order.total : (typeof order.amount === 'number' ? order.amount : order.total || order.amount || 0)} FCFA</p>
                    <p className="text-sm text-[#8B7355] capitalize">
                      {(order.status || '').toString().replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#8B7355] text-center py-8">Aucune commande récente</p>
          )}
        </div>

        {/* Upcoming Deliveries */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8E2D9]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#2D2720]">Livraisons à venir</h2>
            <Link to="/b2b/deliveries" className="text-[#2ECC71] font-medium hover:underline">
              Voir tout
            </Link>
          </div>
          
          {dashboardData?.upcomingDeliveries?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.upcomingDeliveries.slice(0, 3).map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-4 border border-[#E8E2D9] rounded-xl">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-10 h-10 text-[#2ECC71] bg-[#E6F7ED] p-2 rounded-xl" />
                    <div>
                      <p className="font-medium text-[#2D2720]">Livraison prévue</p>
                      <p className="text-sm text-[#8B7355]">
                        {delivery.dateLivraison} à {delivery.heureLivraison}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#2D2720]">{delivery.nbRepas} repas</p>
                    <p className="text-sm text-[#8B7355]">{delivery.adresseLivraison}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#8B7355] text-center py-8">Aucune livraison prévue</p>
          )}
        </div>
      </div>
    </div>
  );
}