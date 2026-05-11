// src/pages/gerant/KDSPage.jsx
import { useState, useEffect } from 'react';
import { commandesService } from '../../services/commandes.service';
import { formatFCFA, formatDate, STATUS_LABELS, STATUS_COLORS } from '../../utils/formatters';
import { Clock, CheckCircle, AlertTriangle, ChefHat, Truck } from 'lucide-react';

const STATUS_SEQUENCE = ['CONFIRMEE', 'EN_PREP', 'PRETE'];

export default function KDSPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await commandesService.getKDS();
      setOrders(response.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des commandes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await commandesService.updateStatut(orderId, newStatus);
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, statut: newStatus } : order
      ));
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    }
  };

  const getNextStatus = (currentStatus) => {
    const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
    return currentIndex >= 0 && currentIndex < STATUS_SEQUENCE.length - 1
      ? STATUS_SEQUENCE[currentIndex + 1]
      : null;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONFIRMEE': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'EN_PREP': return <ChefHat className="w-5 h-5 text-blue-500" />;
      case 'PRETE': return <Truck className="w-5 h-5 text-green-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D94500]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-[#D94500] text-white rounded-lg hover:bg-[#B83A00]"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const pendingOrders = orders.filter(order => ['CONFIRMEE', 'EN_PREP'].includes(order.statut));
  const readyOrders = orders.filter(order => order.statut === 'PRETE');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#2D2720]">Écran Cuisine (KDS)</h2>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-[#D94500] text-white rounded-lg hover:bg-[#B83A00] flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Commandes en cours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-blue-500" />
            En préparation ({pendingOrders.length})
          </h3>
          <div className="space-y-4">
            {pendingOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={updateStatus}
                getNextStatus={getNextStatus}
                getStatusIcon={getStatusIcon}
              />
            ))}
            {pendingOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucune commande en préparation
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Prêtes ({readyOrders.length})
          </h3>
          <div className="space-y-4">
            {readyOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={updateStatus}
                getNextStatus={getNextStatus}
                getStatusIcon={getStatusIcon}
                isReady={true}
              />
            ))}
            {readyOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucune commande prête
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onStatusUpdate, getNextStatus, getStatusIcon, isReady = false }) {
  const nextStatus = getNextStatus(order.statut);

  return (
    <div className={`border rounded-xl p-4 ${isReady ? 'border-green-200 bg-green-50' : 'border-[#E8E2D9] bg-[#F9F7F5]'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(order.statut)}
          <span className="font-bold text-lg">#{order.numero}</span>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[order.statut]}`}>
          {STATUS_LABELS[order.statut]}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-[#8B7355]">Client:</span>
          <span className="font-medium">{order.client?.nom || 'Client'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#8B7355]">Mode:</span>
          <span className="font-medium">{order.modeLivraison?.replace('_', ' ').toLowerCase()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#8B7355]">Créée:</span>
          <span className="font-medium">{formatDate(order.createdAt)}</span>
        </div>
      </div>

      <div className="border-t border-[#E8E2D9] pt-3 mb-4">
        <h4 className="font-medium mb-2">Articles:</h4>
        <div className="space-y-1">
          {order.lignes?.map((ligne, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{ligne.quantite}x {ligne.article?.nom}</span>
              <span className="font-medium">{formatFCFA(ligne.prixUnitaire * ligne.quantite)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold mt-2 pt-2 border-t border-[#E8E2D9]">
          <span>Total:</span>
          <span>{formatFCFA(order.montantTotal)}</span>
        </div>
      </div>

      {order.instructions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium text-yellow-800 mb-1">Instructions spéciales:</p>
          <p className="text-sm text-yellow-700">{order.instructions}</p>
        </div>
      )}

      {nextStatus && (
        <button
          onClick={() => onStatusUpdate(order.id, nextStatus)}
          className="w-full bg-[#D94500] text-white py-2 rounded-lg hover:bg-[#B83A00] transition-colors font-medium"
        >
          Marquer comme {STATUS_LABELS[nextStatus].toLowerCase()}
        </button>
      )}

      {isReady && (
        <div className="text-center text-green-600 font-medium mt-2">
          ✓ Prête pour {order.modeLivraison === 'LIVRAISON' ? 'la livraison' : 'le retrait'}
        </div>
      )}
    </div>
  );
}