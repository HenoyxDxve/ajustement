import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Package, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { b2bAPI } from '../../services/api';
import { formatFCFA } from '../../utils/formatters';

export default function B2BOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const response = await b2bAPI.getOrders();
        setOrders(response.data || []);
      } catch (err) {
        console.error('Error loading B2B orders:', err);
        setError('Impossible de charger les commandes B2B');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const getStatusStyle = (status) => {
    if (status === 'LIVREE') return 'bg-[#E6F7ED] text-[#2ECC71]';
    if (status === 'EN_PREP') return 'bg-[#EBF5FB] text-[#3498DB]';
    return 'bg-[#FFF5EB] text-[#D94500]';
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-[#2ECC71]" />
            <h1 className="text-3xl font-bold text-[#2D2720]">Commandes Entreprise</h1>
          </div>
          <p className="text-[#8B7355]">Suivez vos commandes groupées, livraisons et facturation différée.</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>}

        {loading ? (
          <p className="text-[#8B7355]">Chargement des commandes...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-10 text-center">
            <p className="text-[#8B7355]">Aucune commande entreprise dans l'historique.</p>
            <Link to="/b2b/bulk-order" className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-[#D94500] text-white rounded-2xl hover:bg-[#B83A00] transition">
              <Clock className="w-4 h-4" /> Passer une commande groupée
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-[#8B7355]">Commande #{order.id}</p>
                    <h2 className="text-xl font-semibold text-[#2D2720]">{order.restaurantNom}</h2>
                    <p className="text-sm text-[#8B7355]">{order.dateLivraison} • {order.heureLivraison}</p>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 ${getStatusStyle(order.status)}`}>
                    {order.status === 'LIVREE' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    <span className="text-sm font-semibold">{order.status.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#8B7355]">
                  <div>
                    <p><strong>Montant</strong></p>
                    <p className="text-[#2D2720] font-semibold">{formatFCFA(order.total)}</p>
                  </div>
                  <div>
                    <p><strong>Adresse</strong></p>
                    <p>{order.deliveryAddress}</p>
                  </div>
                  <div>
                    <p><strong>Nombre de repas</strong></p>
                    <p>{order.items?.reduce((sum, item) => sum + item.quantity, 0)} repas</p>
                  </div>
                </div>

                <div className="mt-4 text-sm text-[#8B7355]">
                  {order.items?.slice(0, 3).map((item, index) => (
                    <p key={index}>{item.quantity}x {item.nom}</p>
                  ))}
                  {order.items?.length > 3 && <p>... et {order.items.length - 3} autres articles</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
