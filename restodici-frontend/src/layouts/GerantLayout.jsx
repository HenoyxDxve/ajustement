// src/layouts/GerantLayout.jsx
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, Package, ClipboardList, AlertTriangle, 
  TrendingUp, Settings, LogOut, ChevronRight 
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard, path: '/gerant' },
  { id: 'menu', label: '🍽️ Menu', icon: Package, path: '/gerant?tab=menu' },
  { id: 'orders', label: '📋 Commandes', icon: ClipboardList, path: '/gerant?tab=orders' },
  { id: 'stocks', label: '📦 Stocks', icon: AlertTriangle, path: '/gerant?tab=stocks' },
  { id: 'finance', label: '💰 Trésorerie', icon: TrendingUp, path: '/gerant?tab=finance' },
  { id: 'settings', label: '⚙️ Paramètres', icon: Settings, path: '/gerant?tab=settings' },
];

export default function GerantLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);


  // Déterminer l'onglet actif depuis l'URL
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';

  const handleNav = (path) => navigate(path);
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5EB] via-[#F9F7F5] to-white flex">

      
      {/* ✅ Sidebar Verticale — FIXÉE à GAUCHE */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-orange-100 shadow-lg transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-64'
      }`}>
        
        {/* Toggle collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center shadow hover:bg-orange-600 transition"
          aria-label={collapsed ? 'Développer' : 'Réduire'}
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>

        {/* Header */}
        <div className="p-4 border-b border-orange-100">
          {!collapsed && (
            <>
              <h2 className="font-bold text-gray-800 text-lg">Resto d'ici</h2>
              <p className="text-xs text-gray-600 mt-1">Espace Gérant</p>
              {user?.restaurant?.nom && (
                <p className="text-sm font-medium text-orange-600 mt-2 truncate">{user.restaurant.nom}</p>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {MENU_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-orange-50 hover:text-gray-800'
                } ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-orange-100">
          {!collapsed && (
            <div className="mb-3">
              <p className="text-xs text-gray-600">Connecté en tant que</p>
              <p className="text-sm font-medium text-gray-800 truncate">{user?.nom}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-xl transition ${
              collapsed ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0"/>
            {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ✅ Contenu principal — à DROITE, prend l'espace restant */}
      <main className={`flex-1 p-6 lg:p-8 overflow-y-auto transition-all duration-300 ${
        collapsed ? 'ml-16' : 'ml-64'
      }`}>
        <Outlet />
      </main>
    </div>
  );
}