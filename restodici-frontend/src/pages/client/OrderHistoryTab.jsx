import { useState } from 'react';
import { Package, Clock, CheckCircle, XCircle, Eye, RotateCcw, Receipt, Star, AlertCircle } from 'lucide-react';
import { formatFCFA } from '../../utils/formatters';

const A   = '#FF8C00';
const AL  = '#FFF5E8';
const BOR = 'rgba(0,0,0,0.08)';

const STATUS = {
  RECUE:        { label: 'Reçue',          bg: '#FFFBEB', c: '#D97706' },
  CONFIRMEE:    { label: 'Confirmée',      bg: '#F0FDF4', c: '#16A34A' },
  EN_PREP:      { label: 'En préparation', bg: '#FEF3C7', c: '#B45309' },
  PRETE:        { label: 'Prête',          bg: '#F0FDF4', c: '#16A34A' },
  EN_LIVRAISON: { label: 'En livraison',   bg: '#EFF6FF', c: '#2563EB' },
  LIVREE:       { label: 'Livrée',         bg: '#F0FDF4', c: '#15803D' },
  ANNULEE:      { label: 'Annulée',        bg: '#FFF1F2', c: '#E11D48' },
};
const ACTIVE = new Set(['RECUE', 'CONFIRMEE', 'EN_PREP', 'PRETE', 'EN_LIVRAISON']);
const MODE_L = { SUR_PLACE: 'Sur place', EMPORTER: 'À emporter', LIVRAISON: 'Livraison' };

const TABS = [
  { key: 'all',    label: 'Toutes' },
  { key: 'active', label: 'En cours' },
  { key: 'done',   label: 'Livrées' },
  { key: 'cancelled', label: 'Annulées' },
];

function OrderCard({ order, onTrack, onReorder, onViewReceipt, canAvis, onAvis, onConfirmReceipt, onDownload }) {
  const s   = STATUS[order.statut] || { label: order.statut, bg: '#F3F4F6', c: '#6B7280' };
  const date = new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const items = order.lignes || [];
  const isActive = ACTIVE.has(order.statut);
  return (
    <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${BOR}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${BOR}` }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {order.statut === 'LIVREE' ? <CheckCircle style={{ width: 16, height: 16, color: s.c }} /> : order.statut === 'ANNULEE' ? <XCircle style={{ width: 16, height: 16, color: s.c }} /> : <Clock style={{ width: 16, height: 16, color: s.c }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', margin: 0 }}>Commande #{order.numero}</p>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{date} · {MODE_L[order.modeLivraison] || order.modeLivraison}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: A, margin: '0 0 2px' }}>{formatFCFA(order.montantTotal || 0)}</p>
          <span style={{ padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.c, fontSize: 10, fontWeight: 700 }}>{s.label}</span>
        </div>
      </div>
      <div style={{ padding: '10px 16px' }}>
        <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 8px' }}>
          {items.slice(0, 3).map((l, i) => `${l.quantite}x ${l.article?.nom || l.nom || 'Article'}${i < Math.min(items.length, 3) - 1 ? ', ' : ''}`).join('')}
          {items.length > 3 && ` +${items.length - 3} autre${items.length - 3 > 1 ? 's' : ''}`}
        </p>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {isActive && (
            <button onClick={() => onTrack(order)} style={{ flex: 1, minWidth: 80, padding: 8, borderRadius: 9, border: 'none', background: A, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Eye style={{ width: 11, height: 11 }} />Suivre
            </button>
          )}
          {order.statut === 'EN_LIVRAISON' && !order.receptionConfirmeeAt && (
            <button onClick={() => onConfirmReceipt(order)} style={{ flex: 1, minWidth: 80, padding: 8, borderRadius: 9, border: 'none', background: '#22C55E', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <CheckCircle style={{ width: 11, height: 11 }} />Reçu
            </button>
          )}
          {order.statut === 'LIVREE' && (
            <>
              <button onClick={() => onViewReceipt(order)} style={{ flex: 1, minWidth: 80, padding: 8, borderRadius: 9, border: 'none', background: AL, color: A, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Receipt style={{ width: 11, height: 11 }} />Reçu
              </button>
              {canAvis(order) && (
                <button onClick={() => onAvis(order)} style={{ flex: 1, minWidth: 80, padding: 8, borderRadius: 9, border: 'none', background: '#FEF3C7', color: '#D97706', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Star style={{ width: 11, height: 11 }} />Avis
                </button>
              )}
            </>
          )}
          <button onClick={() => onReorder(order)} style={{ padding: 8, borderRadius: 9, border: `1px solid ${BOR}`, background: '#F9FAFB', fontSize: 11, fontWeight: 700, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <RotateCcw style={{ width: 11, height: 11 }} />Recommander
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderHistoryTab({ orders = [], activeOrders = [], delivered = [], cancelled = [], loadingOrders, onTrack, onReorder, onViewReceipt, canAvis, onAvis, onConfirmReceipt, onDownload }) {
  const [filter, setFilter] = useState('all');

  const lists = { all: orders, active: activeOrders, done: delivered, cancelled };
  const shown = lists[filter] || orders;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const count = lists[t.key]?.length || 0;
          const sel   = filter === t.key;
          return (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{ padding: '7px 14px', borderRadius: 12, border: sel ? 'none' : `1px solid ${BOR}`, background: sel ? A : '#fff', color: sel ? '#fff' : '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {t.label}
              {count > 0 && <span style={{ padding: '1px 6px', borderRadius: 20, background: sel ? 'rgba(255,255,255,0.3)' : '#F3F4F6', color: sel ? '#fff' : '#6B7280', fontSize: 10, fontWeight: 800 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {loadingOrders ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 130, borderRadius: 18, background: '#F3F4F6' }} />)}
        </div>
      ) : shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 20, border: `1px dashed ${BOR}` }}>
          <Package style={{ width: 36, height: 36, color: '#E5E7EB', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#9CA3AF', margin: '0 0 6px' }}>Aucune commande</p>
          <p style={{ fontSize: 12, color: '#D1D5DB', margin: 0 }}>Vos commandes apparaîtront ici.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shown.map(o => (
            <OrderCard key={o.id} order={o} onTrack={onTrack} onReorder={onReorder} onViewReceipt={onViewReceipt} canAvis={canAvis} onAvis={onAvis} onConfirmReceipt={onConfirmReceipt} onDownload={onDownload} />
          ))}
        </div>
      )}
    </div>
  );
}
