import { useNavigate, useParams } from 'react-router-dom';
import { Check, Clock, MapPin, Phone, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { commandesService } from '../../services/commandes.service';
import { formatFCFA, formatDate, STATUS_LABELS, STATUS_COLORS } from '../../utils/formatters';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let poll;
    const fetch = async () => {
      try {
        const res = await commandesService.findOne(id);
        setOrder(res.data);
        setLoading(false);
        if (['LIVREE', 'ANNULEE'].includes(res.data.statut)) clearInterval(poll);
      } catch { setLoading(false); }
    };
    fetch();
    poll = setInterval(fetch, 5000);
    return () => clearInterval(poll);
  }, [id]);

  if (loading || !order) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-[#D94500] border-t-transparent rounded-full animate-spin"/></div>;

  const steps = [
    { key: 'RECUE', label: 'Reçue', icon: Check },
    { key: 'CONFIRMEE', label: 'Confirmée', icon: Check },
    { key: 'EN_PREP', label: 'En préparation', icon: Clock },
    { key: 'PRETE', label: 'Prête', icon: MapPin },
    { key: 'LIVREE', label: 'Livrée', icon: Phone },
  ];
  const currentIdx = steps.findIndex(s => s.key === order.statut);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-[#2ECC71]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-[#2ECC71]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2D2720]">Commande confirmée !</h1>
        <p className="text-[#8B7355] mt-2">Commande <span className="font-bold text-[#D94500]">#{order.numero}</span></p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 mb-6">
        <h2 className="font-bold text-lg mb-6">Suivi en temps réel</h2>
        <div className="space-y-6 relative">
          <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-[#E8E2D9]" />
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i <= currentIdx;
            return (
              <div key={step.key} className="relative flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${isActive ? 'bg-[#D94500] text-white' : 'bg-[#E8E2D9] text-[#8B7355]'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-1">
                  <p className={`font-semibold ${isActive ? 'text-[#2D2720]' : 'text-[#8B7355]'}`}>{step.label}</p>
                  {isActive && i === currentIdx && <p className="text-xs text-[#D94500] animate-pulse mt-1">En cours...</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6">
        <h2 className="font-bold text-lg mb-4">Détails</h2>
        <div className="space-y-3 mb-4">
          {order.lignes?.map(l => (
            <div key={l.id} className="flex justify-between text-sm">
              <span className="text-[#8B7355]">{l.quantite}x {l.article.nom}</span>
              <span className="font-medium">{formatFCFA(Number(l.prixUnitaire) * l.quantite)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-lg font-bold pt-4 border-t border-[#E8E2D9]">
          <span>Total payé</span>
          <span className="text-[#D94500]">{formatFCFA(order.montantTotal)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button onClick={() => navigate('/client/orders')} className="flex-1 bg-[#D94500] hover:bg-[#B83A00] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
          Voir mes commandes <ChevronRight className="w-5 h-5" />
        </button>
        <button onClick={() => navigate('/menu')} className="flex-1 bg-white border border-[#E8E2D9] text-[#2D2720] font-bold py-3.5 rounded-xl hover:bg-[#F9F7F5] transition-all">
          Commander autre chose
        </button>
      </div>
    </div>
  );
}