// src/pages/staff/KDSStaff.jsx — Kitchen Display System
import { useCallback, useEffect, useState } from 'react';
import { Clock, ChefHat, CheckCircle2, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { commandesService, createCommandesSocket } from '../../services/commandes.service';
import { useAuth } from '../../hooks/useAuth';

// ── Tokens ────────────────────────────────────────────────────────────────────
const BG     = '#F8FAFC';
const CARD   = '#FFFFFF';
const NAVY   = '#0F172A';
const BORDER = '#E2E8F0';
const MUTED  = '#64748B';
const FAINT  = '#94A3B8';

const TER    = '#ab3500';
const TER_G  = 'linear-gradient(135deg,#ab3500,#ff6b35)';
const TER_L  = 'rgba(171,53,0,0.08)';
const GREEN  = '#16A34A';
const GREEN_G= 'linear-gradient(135deg,#16A34A,#22c55e)';
const AMBER  = '#D97706';
const AMBER_G= 'linear-gradient(135deg,#D97706,#f59e0b)';
const RED    = '#DC2626';
const RED_L  = '#FEF2F2';
const PURPLE = '#7C3AED';
const PURPLE_G='linear-gradient(135deg,#7C3AED,#a78bfa)';

const SH  = '0 1px 3px rgba(15,23,42,0.07),0 1px 2px rgba(15,23,42,0.04)';
const SH2 = '0 4px 16px rgba(15,23,42,0.10),0 2px 4px rgba(15,23,42,0.06)';

const NEXT_STATUT = {
  RECUE: 'CONFIRMEE', CONFIRMEE: 'EN_PREP', EN_PREP: 'PRETE',
  PRETE: 'EN_LIVRAISON', EN_LIVRAISON: 'LIVREE',
};

const COLS = [
  { id: 'todo',     label: 'À traiter',      emoji: '📋', accent: TER,    accentL: TER_L,              grad: TER_G,    btnGrad: TER_G,    statuts: ['RECUE','CONFIRMEE'] },
  { id: 'prep',     label: 'En préparation', emoji: '🔥', accent: AMBER,  accentL: 'rgba(217,119,6,0.08)', grad: AMBER_G, btnGrad: AMBER_G, statuts: ['EN_PREP'] },
  { id: 'ready',    label: 'Prête',          emoji: '✅', accent: GREEN,  accentL: 'rgba(22,163,74,0.08)',  grad: GREEN_G, btnGrad: GREEN_G, statuts: ['PRETE'] },
  { id: 'delivery', label: 'En livraison',   emoji: '🚀', accent: PURPLE, accentL: 'rgba(124,58,237,0.08)', grad: PURPLE_G,btnGrad: PURPLE_G,statuts: ['EN_LIVRAISON'] },
];

// ── Utils ─────────────────────────────────────────────────────────────────────
function useGlobalTick() {
  const [, set] = useState(0);
  useEffect(() => { const id = setInterval(() => set(n => n + 1), 1000); return () => clearInterval(id); }, []);
}

function elapsed(ts) {
  if (!ts) return 0;
  return Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
}

function mmss(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
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

// ── OrderCard ─────────────────────────────────────────────────────────────────
function OrderCard({ order, onAction, saving, col }) {
  useGlobalTick();
  const sec    = elapsed(order.createdAt);
  const urgent = sec >= 1200;
  const warn   = sec >= 600;
  const tColor = urgent ? RED : warn ? AMBER : MUTED;
  const next   = NEXT_STATUT[order.statut];

  const lieu = (() => {
    if (order.modeLivraison === 'SUR_PLACE') return `Table ${order.tableNumero ?? '?'}`;
    if (order.modeLivraison === 'EMPORTER')  return 'À emporter';
    if (order.modeLivraison === 'LIVRAISON') return 'Livraison';
    return order.modeLivraison || '';
  })();

  return (
    <div style={{
      background: urgent ? '#fffafa' : CARD,
      borderRadius: 18,
      border: `1px solid ${urgent ? '#fecaca' : BORDER}`,
      borderLeft: `4px solid ${urgent ? RED : warn ? AMBER : col.accent}`,
      boxShadow: urgent ? '0 6px 24px rgba(220,38,38,0.13)' : SH2,
      overflow: 'hidden',
      transition: 'box-shadow 0.2s, transform 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = urgent ? '0 8px 28px rgba(220,38,38,0.18)' : '0 8px 24px rgba(15,23,42,0.13)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = urgent ? '0 6px 24px rgba(220,38,38,0.13)' : SH2; }}
    >
      <div style={{ padding: '13px 15px 14px' }}>
        {/* En-tête card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 11 }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: NAVY, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.01em' }}>
              CMD-{order.numero}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: MUTED, fontWeight: 500 }}>{lieu}</p>
          </div>
          {/* Timer */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: urgent ? RED_L : warn ? '#FFFBEB' : BG,
            borderRadius: 99, padding: '4px 10px',
            border: `1px solid ${urgent ? '#fecaca' : warn ? '#fde68a' : BORDER}`,
          }}>
            <Clock size={11} color={tColor} />
            <span style={{ fontSize: 12, fontWeight: 800, color: tColor, fontVariantNumeric: 'tabular-nums' }}>
              {mmss(sec)}
            </span>
          </div>
        </div>

        {/* Articles */}
        <div style={{ marginBottom: 12, padding: '9px 11px', background: col.accentL, borderRadius: 11 }}>
          {(order.lignes || []).map((l, i) => (
            <div key={l.id || i} style={{ marginBottom: i < (order.lignes.length - 1) ? 7 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: col.accent, minWidth: 24 }}>{l.quantite}×</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: l.servi ? FAINT : NAVY, textDecoration: l.servi ? 'line-through' : 'none', flex: 1, lineHeight: 1.3 }}>
                  {l.article?.nom || l.nomArticle || 'Article'}
                </span>
                {l.servi && <CheckCircle2 size={12} color={GREEN} />}
              </div>
              {l.instructions && (
                <span style={{ display: 'inline-block', marginTop: 3, marginLeft: 22, fontSize: 11, fontWeight: 600, color: TER, background: 'rgba(171,53,0,0.1)', padding: '2px 7px', borderRadius: 6 }}>
                  ⚠ {l.instructions}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Bouton action */}
        {next && (
          <button
            onClick={() => onAction(order.id, next)}
            disabled={saving === order.id}
            style={{
              width: '100%', padding: '10px', borderRadius: 10, border: 'none',
              background: urgent ? `linear-gradient(135deg,${RED},#ef4444)` : col.btnGrad,
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: saving === order.id ? 'not-allowed' : 'pointer',
              opacity: saving === order.id ? 0.65 : 1,
              boxShadow: urgent ? '0 4px 12px rgba(220,38,38,0.35)' : `0 4px 12px ${col.accent}4d`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
          >
            {saving === order.id ? '…' : (
              { CONFIRMEE: 'Accepter', EN_PREP: 'Démarrer', PRETE: 'Marquer prête', EN_LIVRAISON: 'En livraison', LIVREE: 'Livré ✓' }[next]
            )}
          </button>
        )}
        {['LIVREE','ANNULEE'].includes(order.statut) && (
          <p style={{ textAlign: 'center', fontSize: 12, color: MUTED, margin: '4px 0 0', fontWeight: 600 }}>
            {order.statut === 'LIVREE' ? '✓ Terminée' : '✗ Annulée'}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Colonne KDS ───────────────────────────────────────────────────────────────
function KDSColumn({ col, orders, onAction, saving }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
      {/* En-tête colonne — colored gradient */}
      <div style={{
        background: col.grad,
        borderRadius: 14,
        padding: '11px 14px',
        marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 9,
        boxShadow: `0 4px 14px ${col.accent}33`,
      }}>
        <span style={{ fontSize: 16 }}>{col.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, letterSpacing: '-0.01em' }}>
          {col.label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', background: 'rgba(255,255,255,0.22)', padding: '2px 10px', borderRadius: 99, minWidth: 28, textAlign: 'center' }}>
          {orders.length}
        </span>
      </div>

      {/* Cartes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {orders.length === 0 ? (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '32px 16px', textAlign: 'center', boxShadow: SH }}>
            <ChefHat size={26} color={BORDER} style={{ display: 'block', margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: 12, color: FAINT, fontWeight: 500 }}>Aucune commande</p>
          </div>
        ) : orders.map(o => (
          <OrderCard key={o.id} order={o} onAction={onAction} saving={saving} col={col} />
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function KDSStaff() {
  const { user } = useAuth();
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState('');
  const [lastEvent, setLastEvent] = useState('');

  const upsert = useCallback(o => {
    if (!o?.id) return;
    setOrders(prev => {
      const i = prev.findIndex(x => x.id === o.id);
      if (i === -1) return [o, ...prev];
      const next = [...prev]; next[i] = { ...next[i], ...o }; return next;
    });
  }, []);

  const load = useCallback(async () => {
    try { setError(''); const r = await commandesService.getKDS(); setOrders(r.data || []); }
    catch { setError('Impossible de charger les commandes.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    const s = createCommandesSocket(user);
    s.on('commande.nouvelle', p => { beep(); setLastEvent(`Nouvelle · CMD-${p?.numero || ''}`); load(); });
    s.on('commande.statut',   p => { setLastEvent(`Statut · CMD-${p?.numero || ''}`); upsert(p); });
    s.on('commande.paiement', p => upsert(p));
    return () => s.disconnect();
  }, [load, upsert, user]);

  const onAction = async (id, statut) => {
    setSaving(id);
    try {
      await commandesService.updateStatut(id, statut);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, statut } : o));
    } catch { setError('Mise à jour impossible.'); }
    finally { setSaving(''); }
  };

  const grouped = COLS.map(col => ({
    ...col,
    orders: orders
      .filter(o => col.statuts.includes(o.statut))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  }));

  const total   = grouped.reduce((s, c) => s + c.orders.length, 0);
  const urgents = orders.filter(o => COLS.flatMap(c => c.statuts).includes(o.statut) && elapsed(o.createdAt) >= 1200).length;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 28 }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, color: TER, textTransform: 'uppercase', letterSpacing: '0.24em' }}>
            Cuisine en temps réel
          </p>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: NAVY, letterSpacing: '-0.03em' }}>
            KDS — Écran Cuisine
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>
              {total} commande{total !== 1 ? 's' : ''} active{total !== 1 ? 's' : ''}
            </span>
            {urgents > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: RED, fontWeight: 700, background: RED_L, padding: '3px 10px', borderRadius: 99 }}>
                <Zap size={11} /> {urgents} en retard
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastEvent && (
            <span style={{ fontSize: 11, background: CARD, border: `1px solid ${BORDER}`, color: MUTED, padding: '5px 12px', borderRadius: 99, fontWeight: 600, boxShadow: SH }}>
              ⚡ {lastEvent}
            </span>
          )}
          <button
            onClick={load}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 99, border: `1px solid ${BORDER}`, background: CARD, fontSize: 12, fontWeight: 700, color: NAVY, cursor: 'pointer', boxShadow: SH, fontFamily: 'inherit' }}
          >
            <RefreshCw size={13} /> Actualiser
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: RED_L, border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: RED, fontWeight: 600 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: TER, animation: 'kds-spin 0.7s linear infinite' }} />
          <p style={{ margin: 0, fontSize: 13, color: MUTED }}>Chargement des commandes…</p>
          <style>{`@keyframes kds-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, alignItems: 'start' }}>
          {grouped.map(col => (
            <KDSColumn key={col.id} col={col} orders={col.orders} onAction={onAction} saving={saving} />
          ))}
        </div>
      )}
    </div>
  );
}
