/* ═══════════════════════════════════════════════════════════════
   KDSStaff.jsx — Kitchen Display System (Staff)
   4 colonnes actives + section historique des commandes traitées
   Temps réel : WebSocket + polling 8s
   ═══════════════════════════════════════════════════════════════ */
import { useCallback, useEffect, useState } from 'react';
import {
  Clock, ChefHat, CheckCircle2, RefreshCw, AlertCircle,
  Zap, History, X, ChevronDown, ChevronUp,
  CheckCheck, Ban, UtensilsCrossed, Package,
} from 'lucide-react';
import { commandesService, createCommandesSocket } from '../../services/commandes.service';
import { useAuth } from '../../hooks/useAuth';

/* ── Palette ── */
const BG     = '#F8FAFC';
const CARD   = '#FFFFFF';
const NAVY   = '#111827';
const BORDER = '#E5E7EB';
const MUTED  = '#6B7280';
const FAINT  = '#9CA3AF';

const OG     = '#FF8C00';            /* orange principal */
const OG_D   = '#E07A00';
const OG_G   = 'linear-gradient(135deg, #FF8C00 0%, #E07A00 100%)';
const OG_L   = 'rgba(255,140,0,0.09)';
const GREEN  = '#16A34A';
const GREEN_G= 'linear-gradient(135deg,#15803D,#22c55e)';
const AMBER  = '#D97706';
const AMBER_G= 'linear-gradient(135deg,#B45309,#f59e0b)';
const RED    = '#DC2626';
const RED_L  = '#FEF2F2';
const PURPLE = '#7C3AED';
const PURPLE_G='linear-gradient(135deg,#6D28D9,#a78bfa)';

const NEXT_STATUT = {
  RECUE: 'CONFIRMEE', CONFIRMEE: 'EN_PREP',
  EN_PREP: 'PRETE', PRETE: 'EN_LIVRAISON', EN_LIVRAISON: 'LIVREE',
};
const ACTION_LABELS = {
  CONFIRMEE: 'Accepter', EN_PREP: 'Démarrer',
  PRETE: 'Prête ✓', EN_LIVRAISON: 'En livraison', LIVREE: 'Livré ✓',
};

const COLS = [
  { id: 'todo',     label: 'À traiter',      icon: '📋', accent: OG,     accentL: OG_L,                   grad: OG_G,      statuts: ['RECUE','CONFIRMEE'] },
  { id: 'prep',     label: 'En préparation', icon: '🔥', accent: AMBER,  accentL: 'rgba(217,119,6,0.08)', grad: AMBER_G,   statuts: ['EN_PREP'] },
  { id: 'ready',    label: 'Prête',          icon: '✅', accent: GREEN,  accentL: 'rgba(22,163,74,0.08)', grad: GREEN_G,   statuts: ['PRETE'] },
  { id: 'delivery', label: 'En livraison',   icon: '🚚', accent: PURPLE, accentL: 'rgba(124,58,237,0.08)',grad: PURPLE_G,  statuts: ['EN_LIVRAISON'] },
];

/* ── Tick global (pour les timers) ── */
function useGlobalTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
}

function elapsed(ts) {
  if (!ts) return 0;
  return Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
}

function mmss(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400)return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} j`;
}

function beep() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ac.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.3);
  } catch (_) {}
}

function lieu(order) {
  if (order.modeLivraison === 'SUR_PLACE') return `Table ${order.tableNumero ?? '?'}`;
  if (order.modeLivraison === 'EMPORTER')  return 'À emporter';
  if (order.modeLivraison === 'LIVRAISON') return 'Livraison';
  return order.modeLivraison || 'Salle';
}

/* ══════════════════════════════════════════════════════════════════
   OrderCard — Carte commande active
   ══════════════════════════════════════════════════════════════════ */
function OrderCard({ order, onAction, saving, col }) {
  useGlobalTick();
  const sec    = elapsed(order.createdAt);
  const urgent = sec >= 1200;
  const warn   = sec >= 600;
  const tColor = urgent ? RED : warn ? AMBER : MUTED;
  const next   = NEXT_STATUT[order.statut];

  return (
    <div style={{
      background: urgent ? '#FFF8F8' : CARD,
      borderRadius: 18,
      border: `1px solid ${urgent ? '#FCA5A5' : BORDER}`,
      borderTop: `3px solid ${urgent ? RED : warn ? AMBER : col.accent}`,
      boxShadow: urgent
        ? '0 4px 20px rgba(220,38,38,0.12)'
        : '0 2px 10px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      transition: 'transform 0.12s, box-shadow 0.12s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = urgent
          ? '0 8px 28px rgba(220,38,38,0.18)'
          : '0 6px 20px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = urgent
          ? '0 4px 20px rgba(220,38,38,0.12)'
          : '0 2px 10px rgba(0,0,0,0.05)';
      }}
    >
      <div style={{ padding: '14px 15px 15px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: NAVY, letterSpacing: '-0.02em' }}>
                {order.numero ? `CMD-${order.numero}` : `#${order.id?.slice(0, 6)}`}
              </p>
              {urgent && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 800, background: '#FEE2E2', color: RED, padding: '2px 7px', borderRadius: 99, letterSpacing: '0.08em' }}>
                  <Zap size={8} /> URGENT
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: MUTED, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <UtensilsCrossed size={10} /> {lieu(order)}
            </p>
          </div>

          {/* Chrono */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: urgent ? RED_L : warn ? '#FFFBEB' : '#F9FAFB',
            border: `1px solid ${urgent ? '#FCA5A5' : warn ? '#FDE68A' : BORDER}`,
            borderRadius: 99, padding: '5px 10px',
          }}>
            <Clock size={11} color={tColor} />
            <span style={{ fontSize: 12, fontWeight: 800, color: tColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
              {mmss(sec)}
            </span>
          </div>
        </div>

        {/* Articles */}
        <div style={{ marginBottom: 12, padding: '10px 12px', background: col.accentL, borderRadius: 12, border: `1px solid ${col.accent}18` }}>
          {(order.lignes || []).map((l, i) => (
            <div key={l.id || i} style={{ marginBottom: i < (order.lignes.length - 1) ? 8 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: col.accent, minWidth: 26, flexShrink: 0 }}>{l.quantite}×</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: l.servi ? FAINT : NAVY, textDecoration: l.servi ? 'line-through' : 'none', flex: 1, lineHeight: 1.35 }}>
                  {l.article?.nom || l.nomArticle || 'Article'}
                </span>
                {l.servi && <CheckCircle2 size={12} color={GREEN} style={{ flexShrink: 0 }} />}
              </div>
              {l.instructions && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, marginLeft: 28, fontSize: 10, fontWeight: 700, color: OG, background: OG_L, padding: '2px 8px', borderRadius: 6 }}>
                  ⚠ {l.instructions}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Bouton action */}
        {next ? (
          <button
            onClick={() => onAction(order.id, next)}
            disabled={saving === order.id}
            style={{
              width: '100%', padding: '11px 12px', borderRadius: 12, border: 'none',
              background: urgent
                ? `linear-gradient(135deg, ${RED}, #ef4444)`
                : col.grad,
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: saving === order.id ? 'not-allowed' : 'pointer',
              opacity: saving === order.id ? 0.65 : 1,
              boxShadow: urgent
                ? '0 4px 14px rgba(220,38,38,0.35)'
                : `0 3px 12px ${col.accent}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'opacity 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'scale(1.01)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            {saving === order.id
              ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'kds-spin 0.7s linear infinite', flexShrink: 0 }} />Traitement…</>
              : ACTION_LABELS[next] || next
            }
          </button>
        ) : ['LIVREE', 'ANNULEE'].includes(order.statut) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 12, background: order.statut === 'LIVREE' ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${order.statut === 'LIVREE' ? '#BBF7D0' : '#FECACA'}` }}>
            {order.statut === 'LIVREE'
              ? <><CheckCheck size={13} color={GREEN} /><span style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>Terminée</span></>
              : <><Ban size={13} color={RED} /><span style={{ fontSize: 12, fontWeight: 700, color: RED }}>Annulée</span></>
            }
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HistoryRow — Ligne de commande traitée dans l'historique
   ══════════════════════════════════════════════════════════════════ */
function HistoryRow({ order }) {
  const isLivree = order.statut === 'LIVREE';
  const ts = order.updatedAt || order.createdAt;
  const articlesList = (order.lignes || [])
    .slice(0, 3)
    .map(l => `${l.quantite}× ${l.article?.nom || l.nomArticle || 'Art.'}`)
    .join(' · ');
  const hasMore = (order.lignes || []).length > 3;
  const total   = Number(order.montantTotal || 0);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
      borderBottom: `1px solid ${BORDER}`,
      transition: 'background 0.1s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Icône statut */}
      <div style={{
        width: 38, height: 38, borderRadius: 13, flexShrink: 0,
        background: isLivree ? '#ECFDF5' : '#FEF2F2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isLivree
          ? <CheckCheck size={16} color={GREEN} />
          : <Ban size={16} color={RED} />
        }
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>
            {order.numero ? `CMD-${order.numero}` : `#${order.id?.slice(0, 6)}`}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: isLivree ? '#ECFDF5' : '#FEF2F2', color: isLivree ? GREEN : RED }}>
            {isLivree ? 'Livrée' : 'Annulée'}
          </span>
          <span style={{ fontSize: 10, color: FAINT, marginLeft: 'auto', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {timeAgo(ts)}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lieu(order)}
          {articlesList ? ` · ${articlesList}${hasMore ? ' …' : ''}` : ''}
        </p>
      </div>

      {/* Montant */}
      {total > 0 && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: isLivree ? GREEN : MUTED }}>
            {total.toLocaleString('fr-FR')}
          </p>
          <p style={{ margin: 0, fontSize: 9, color: FAINT, fontWeight: 600 }}>FCFA</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   KDSColumn — Colonne Kanban
   ══════════════════════════════════════════════════════════════════ */
function KDSColumn({ col, orders, onAction, saving }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
      {/* Header colonne */}
      <div style={{
        background: col.grad, borderRadius: 16, padding: '13px 15px',
        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 9,
        boxShadow: `0 4px 16px ${col.accent}33`,
      }}>
        <span style={{ fontSize: 18 }}>{col.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1, letterSpacing: '-0.01em' }}>
          {col.label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', background: 'rgba(255,255,255,0.22)', padding: '3px 11px', borderRadius: 99, minWidth: 30, textAlign: 'center' }}>
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {orders.length === 0 ? (
          <div style={{ background: CARD, border: `1.5px dashed ${BORDER}`, borderRadius: 18, padding: '32px 16px', textAlign: 'center' }}>
            <ChefHat size={28} color={BORDER} style={{ display: 'block', margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: 12, color: FAINT, fontWeight: 500 }}>Aucune commande</p>
          </div>
        ) : orders.map(o => (
          <OrderCard key={o.id} order={o} onAction={onAction} saving={saving} col={col} />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   KDSStaff — Page principale
   ══════════════════════════════════════════════════════════════════ */
export default function KDSStaff() {
  const { user } = useAuth();
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [saving,       setSaving]       = useState('');
  const [lastEvent,    setLastEvent]    = useState('');
  const [showHistory,  setShowHistory]  = useState(true);
  const [histFilter,   setHistFilter]   = useState('all');

  const upsert = useCallback(o => {
    if (!o?.id) return;
    setOrders(prev => {
      const i = prev.findIndex(x => x.id === o.id);
      if (i === -1) return [o, ...prev];
      const next = [...prev]; next[i] = { ...next[i], ...o }; return next;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      setError('');
      const r = await commandesService.getKDS();
      setOrders(r.data || []);
    } catch {
      setError('Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    const s = createCommandesSocket(user);
    s.on('commande.nouvelle', p => { beep(); setLastEvent(`Nouvelle · CMD-${p?.numero || ''}`); load(); });
    s.on('commande.statut',   p => { setLastEvent(`Statut · CMD-${p?.numero || ''}`); upsert(p); });
    s.on('commande.paiement', p => upsert(p));
    s.on('reconnect',         () => load());
    return () => s.disconnect();
  }, [load, upsert, user]);

  /* Polling silencieux 8s */
  useEffect(() => {
    const id = setInterval(() => load(), 8000);
    return () => clearInterval(id);
  }, [load]);

  const onAction = async (id, statut) => {
    setSaving(id);
    try {
      await commandesService.updateStatut(id, statut);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, statut } : o));
    } catch {
      setError('Mise à jour impossible.');
    } finally {
      setSaving('');
    }
  };

  /* Données dérivées */
  const activeStatuts = new Set(COLS.flatMap(c => c.statuts));
  const activeOrders  = orders.filter(o => activeStatuts.has(o.statut));
  const historyOrders = orders
    .filter(o => ['LIVREE', 'ANNULEE'].includes(o.statut))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  const filteredHistory = histFilter === 'all'      ? historyOrders
                        : histFilter === 'livrees'  ? historyOrders.filter(o => o.statut === 'LIVREE')
                        : historyOrders.filter(o => o.statut === 'ANNULEE');

  const grouped = COLS.map(col => ({
    ...col,
    orders: activeOrders
      .filter(o => col.statuts.includes(o.statut))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  }));

  const urgents   = activeOrders.filter(o => elapsed(o.createdAt) >= 1200).length;
  const livreesToday = historyOrders.filter(o => {
    const ts = o.updatedAt || o.createdAt;
    return ts && new Date(ts).toDateString() === new Date().toDateString() && o.statut === 'LIVREE';
  }).length;

  return (
    <div style={{ fontFamily: "'Manrope', Inter, system-ui, sans-serif", minHeight: '100%' }}>
      <style>{`
        @keyframes kds-spin { to { transform: rotate(360deg); } }
        @keyframes kds-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, #1F2937 100%)`,
        borderRadius: 24, padding: '24px 28px', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,140,0,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: '40%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: OG_G, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${OG}55` }}>
                <ChefHat size={22} color="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: OG, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                  Cuisine en temps réel
                </p>
                <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  KDS — Écran Cuisine
                </h1>
              </div>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                {activeOrders.length} commande{activeOrders.length !== 1 ? 's' : ''} active{activeOrders.length !== 1 ? 's' : ''}
              </span>
              {urgents > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#FCA5A5', fontWeight: 700, background: 'rgba(220,38,38,0.18)', padding: '4px 11px', borderRadius: 99 }}>
                  <Zap size={10} /> {urgents} en retard
                </span>
              )}
              {livreesToday > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6EE7B7', fontWeight: 700, background: 'rgba(22,163,74,0.18)', padding: '4px 11px', borderRadius: 99 }}>
                  <CheckCheck size={10} /> {livreesToday} livrée{livreesToday > 1 ? 's' : ''} aujourd'hui
                </span>
              )}
              {lastEvent && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.08)', padding: '4px 11px', borderRadius: 99, fontWeight: 600 }}>
                  ⚡ {lastEvent}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Statuts mini cards */}
            {COLS.map(col => {
              const count = grouped.find(g => g.id === col.id)?.orders.length ?? 0;
              return (
                <div key={col.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', minWidth: 56 }}>
                  <span style={{ fontSize: 16 }}>{col.icon}</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{count}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{col.label.split(' ')[0]}</span>
                </div>
              );
            })}
            <button
              onClick={load}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.09)', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
              <RefreshCw size={13} /> Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: RED_L, border: '1px solid #FECACA', borderRadius: 14, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: RED, fontWeight: 600 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0 }}>
            <X size={13} color={RED} />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: `4px solid ${OG_L}`, borderTopColor: OG, animation: 'kds-spin 0.8s linear infinite' }} />
          <p style={{ margin: 0, fontSize: 13, color: MUTED, fontWeight: 600 }}>Chargement des commandes…</p>
        </div>
      ) : (
        <>
          {/* ── 4 COLONNES ACTIVES ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start', marginBottom: 28 }}>
            {grouped.map(col => (
              <KDSColumn key={col.id} col={col} orders={col.orders} onAction={onAction} saving={saving} />
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════
              SECTION HISTORIQUE
          ═══════════════════════════════════════════════════════ */}
          <div style={{
            background: CARD, borderRadius: 24, overflow: 'hidden',
            border: `1px solid ${BORDER}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            animation: 'kds-fade-in 0.3s ease',
          }}>
            {/* Header historique */}
            <div
              onClick={() => setShowHistory(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px', borderBottom: showHistory ? `1px solid ${BORDER}` : 'none', cursor: 'pointer', background: showHistory ? '#FAFAFA' : CARD, transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
              onMouseLeave={e => (e.currentTarget.style.background = showHistory ? '#FAFAFA' : CARD)}
            >
              <div style={{ width: 40, height: 40, borderRadius: 13, background: OG_G, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 3px 10px ${OG}44` }}>
                <History size={18} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: NAVY, letterSpacing: '-0.01em' }}>
                  Historique du service
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: MUTED, fontWeight: 500 }}>
                  {historyOrders.length} commande{historyOrders.length !== 1 ? 's' : ''} traitée{historyOrders.length !== 1 ? 's' : ''}
                  {livreesToday > 0 && ` · ${livreesToday} livrée${livreesToday > 1 ? 's' : ''} aujourd'hui`}
                </p>
              </div>

              {/* Stats livrees/annulees */}
              <div style={{ display: 'flex', gap: 8, marginRight: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, background: '#ECFDF5', color: GREEN, padding: '5px 12px', borderRadius: 99 }}>
                  <CheckCheck size={11} /> {historyOrders.filter(o => o.statut === 'LIVREE').length} Livrées
                </span>
                {historyOrders.filter(o => o.statut === 'ANNULEE').length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, background: '#FEF2F2', color: RED, padding: '5px 12px', borderRadius: 99 }}>
                    <Ban size={11} /> {historyOrders.filter(o => o.statut === 'ANNULEE').length} Annulées
                  </span>
                )}
              </div>

              {showHistory
                ? <ChevronUp size={18} color={MUTED} style={{ flexShrink: 0 }} />
                : <ChevronDown size={18} color={MUTED} style={{ flexShrink: 0 }} />
              }
            </div>

            {/* Corps historique */}
            {showHistory && (
              <>
                {/* Filtres */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 22px', borderBottom: `1px solid ${BORDER}`, background: '#FAFAFA' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>Filtrer :</span>
                  {[
                    { id: 'all',     label: `Toutes (${historyOrders.length})` },
                    { id: 'livrees', label: `Livrées (${historyOrders.filter(o => o.statut === 'LIVREE').length})` },
                    { id: 'annulees',label: `Annulées (${historyOrders.filter(o => o.statut === 'ANNULEE').length})` },
                  ].map(f => (
                    <button key={f.id} onClick={e => { e.stopPropagation(); setHistFilter(f.id); }}
                      style={{
                        padding: '6px 14px', borderRadius: 99, border: `1.5px solid ${histFilter === f.id ? OG : BORDER}`,
                        background: histFilter === f.id ? OG : CARD,
                        color: histFilter === f.id ? '#fff' : MUTED,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        boxShadow: histFilter === f.id ? `0 2px 10px ${OG}44` : 'none',
                        transition: 'all 0.13s',
                      }}>
                      {f.label}
                    </button>
                  ))}
                  {historyOrders.length === 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: FAINT, fontWeight: 500 }}>
                      Les commandes traitées apparaissent ici
                    </span>
                  )}
                </div>

                {/* Liste */}
                {filteredHistory.length === 0 ? (
                  <div style={{ padding: '48px 0', textAlign: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: OG_L, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <History size={22} color={OG} />
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>Aucun historique</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>Les commandes terminées et annulées apparaîtront ici.</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                    {filteredHistory.map(o => (
                      <HistoryRow key={o.id} order={o} />
                    ))}
                  </div>
                )}

                {/* Footer recap */}
                {filteredHistory.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px', background: '#F9FAFB', borderTop: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>
                      {filteredHistory.length} commande{filteredHistory.length > 1 ? 's' : ''} affichée{filteredHistory.length > 1 ? 's' : ''}
                    </span>
                    {filteredHistory.filter(o => o.statut === 'LIVREE').length > 0 && (
                      <span style={{ fontSize: 12, color: GREEN, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <CheckCheck size={12} />
                        Total encaissé : {filteredHistory.filter(o => o.statut === 'LIVREE').reduce((s, o) => s + Number(o.montantTotal || 0), 0).toLocaleString('fr-FR')} FCFA
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
