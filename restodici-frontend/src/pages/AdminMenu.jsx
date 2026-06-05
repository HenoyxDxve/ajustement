import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { menuService } from '../services/menu.service';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function AdminMenuPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    menuService
      .getMenu(null, 'TOUS', user?.restaurant?.id)
      .then(data => {
        setArticles(data || []);
        setLoading(false);
      });
  }, [user?.restaurant?.id]);

  const handleToggle = async (id, currentStatus, name) => {
    try {
      await menuService.toggleArticle(id, !currentStatus);
      setArticles(prev => prev.map(a => a.id === id ? { ...a, disponible: !currentStatus } : a));
      const toast = document.createElement('div');
      toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg z-50 text-sm font-medium bg-emerald-500 text-white animate-fade-in`;
      toast.textContent = `"${name}" ${!currentStatus ? 'activé' : 'désactivé'}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Gestion du Menu</h1>
          <p className="text-slate-600 mt-2">Gérez la disponibilité de vos articles</p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.length > 0 ? articles.map(art => (
            <div 
              key={art.id} 
              className={`bg-white rounded-2xl shadow-sm hover:shadow-lg border-2 transition-all duration-300 overflow-hidden group ${
                art.disponible ? 'border-emerald-200' : 'border-slate-200'
              }`}
            >
              {/* Image */}
              <div className="relative w-full h-48 bg-gradient-to-br from-orange-50 to-slate-50 overflow-hidden">
                {art.photoUrl ? (
                  <img src={art.photoUrl} alt={art.nom} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {art.disponible ? (
                    <div className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md">
                      ✓ Disponible
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg shadow-md">
                      ✗ Indisponible
                    </div>
                  )}
                </div>

                {/* Stock Alert */}
                {art.stock <= (art.seuilMin || 5) && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md">
                    <AlertTriangle className="w-3.5 h-3.5" /> Stock bas
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900">{art.nom}</h3>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{art.description}</p>
                
                {/* Info Row */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-500">Prix</p>
                    <p className="text-lg font-bold text-orange-600">{Number(art.prix).toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Stock</p>
                    <p className={`text-lg font-bold ${art.stock <= (art.seuilMin || 5) ? 'text-red-600' : 'text-emerald-600'}`}>
                      {art.stock}
                    </p>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => handleToggle(art.id, art.disponible, art.nom)}
                  className={`w-full mt-5 px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
                    art.disponible 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700' 
                      : 'bg-gradient-to-r from-slate-300 to-slate-400 text-white hover:from-slate-400 hover:to-slate-500'
                  }`}
                >
                  {art.disponible ? (
                    <>
                      <CheckCircle className="w-5 h-5" /> Désactiver
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5" /> Activer
                    </>
                  )}
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <div className="text-slate-300 mb-4">📭</div>
              <p className="text-slate-600 text-lg font-medium">Aucun article dans le menu</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
