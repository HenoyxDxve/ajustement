// src/pages/staff/CaissePage.jsx — Caisse · B2B-aligned design
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Receipt, X, AlertCircle } from 'lucide-react';
import { commandesService, createCommandesSocket } from '../../services/commandes.service';
import { useAuth } from '../../hooks/useAuth';
import orangeMoneyLogo from '../../assets/payments/orange-money.svg';
import mtnMomoLogo from '../../assets/payments/mtn-momo.svg';
import moovMoneyLogo from '../../assets/payments/moov-money.svg';
import carteBancaireLogo from '../../assets/payments/carte-bancaire.svg';

// ── Tokens B2B-aligned ────────────────────────────────────────────────────────
const BG     = '#F8FAFC';
const CARD   = '#FFFFFF';
const NAVY   = '#0F172A';
const BORDER = '#E2E8F0';
const MUTED  = '#64748B';
const FAINT  = '#94A3B8';

const TER    = '#ab3500';
const TER_L  = 'rgba(171,53,0,0.10)';
const TER_G  = 'linear-gradient(135deg,#ab3500,#ff6b35)';
const GREEN  = '#16A34A';
const GREEN_L= '#DCFCE7';
const RED    = '#DC2626';
const RED_L  = '#FEF2F2';
const AMBER  = '#D97706';
const AMBER_L= '#FFFBEB';

const SH  = '0 1px 3px rgba(15,23,42,0.07),0 1px 2px rgba(15,23,42,0.04)';
const SH2 = '0 4px 16px rgba(15,23,42,0.10),0 2px 4px rgba(15,23,42,0.06)';
const SH3 = '0 20px 40px rgba(15,23,42,0.15),0 4px 8px rgba(15,23,42,0.06)';

function fmt(n)  { return Math.round(Number(n) || 0).toLocaleString('fr-FR'); }
function fmtF(n) { return `${fmt(n)} FCFA`; }
function timeHM(ts) { return ts ? new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''; }

const MODE_LABEL = { SUR_PLACE: 'Sur place', EMPORTER: 'À emporter', LIVRAISON: 'Livraison' };

const STATUT_META = {
  RECUE:        { bg: '#EFF6FF', color: '#2563EB', dot: '#60A5FA', label: 'Reçue' },
  CONFIRMEE:    { bg: '#F5F3FF', color: '#6D28D9', dot: '#A78BFA', label: 'Confirmée' },
  EN_PREP:      { bg: AMBER_L,   color: AMBER,     dot: '#FBBF24', label: 'En préparation' },
  PRETE:        { bg: GREEN_L,   color: GREEN,     dot: '#34D399', label: 'Prête ✓' },
  EN_LIVRAISON: { bg: '#F5F3FF', color: '#7C3AED', dot: '#A78BFA', label: 'En livraison' },
  LIVREE:       { bg: GREEN_L,   color: GREEN,     dot: '#34D399', label: 'Livrée' },
  ANNULEE:      { bg: RED_L,     color: RED,       dot: '#F87171', label: 'Annulée' },
};

const PAY_MODES = [
  { id: 'ESPECES',      label: 'Espèces',      icon: '💵',  logo: null },
  { id: 'WAVE',         label: 'Wave',          icon: '🌊',  logo: null },
  { id: 'MOBILE_MONEY', label: 'Mobile Money',  icon: '📱',  logo: null },
  { id: 'CARTE',        label: 'Carte',         icon: null,  logo: carteBancaireLogo },
];

// ── StatusPill (B2B style) ────────────────────────────────────────────────────
function StatusPill({ statut }) {
  const s = STATUT_META[statut] || { bg: BG, color: MUTED, dot: BORDER, label: statut };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 99, background: s.bg, color: s.color, fontSize: 10, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ── OrderItem ─────────────────────────────────────────────────────────────────
function OrderItem({ order, selected, onClick }) {
  const items = (order.lignes || []).slice(0, 2)
    .map(l => `${l.quantite}× ${l.article?.nom || l.nomArticle || 'Art'}`)
    .join(', ');
  const extra = (order.lignes?.length || 0) - 2;

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '13px 15px', borderRadius: 16,
        background: selected ? TER : CARD,
        border: `1px solid ${selected ? TER : BORDER}`,
        cursor: 'pointer',
        boxShadow: selected ? '0 6px 20px rgba(171,53,0,0.25)' : SH,
        transition: 'all 0.15s', overflow: 'hidden',
      }}
    >
      {/* Stripe haut quand sélectionné */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: selected ? '#fff' : NAVY, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          CMD-{order.numero}
        </span>
        {selected
          ? <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.16)', padding: '2px 8px', borderRadius: 99 }}>Sélectionnée</span>
          : <StatusPill statut={order.statut} />
        }
      </div>
      <p style={{ margin: '0 0 5px', fontSize: 11, color: selected ? 'rgba(255,255,255,0.70)' : MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {items}{extra > 0 ? `, +${extra}` : ''}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: selected ? 'rgba(255,255,255,0.55)' : FAINT }}>
          {order.tableNumero ? `Table ${order.tableNumero}` : MODE_LABEL[order.modeLivraison] || ''}
          {' · '}{timeHM(order.createdAt)}
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: selected ? '#fff' : TER }}>
          {fmt(order.montantTotal)}<span style={{ fontSize: 10, fontWeight: 600, marginLeft: 3 }}>F</span>
        </span>
      </div>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CaissePage() {
  const { user } = useAuth();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [payMode,  setPayMode]  = useState('ESPECES');
  const [montant,  setMontant]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const upsert = useCallback(o => {
    if (!o?.id) return;
    setOrders(prev => { const i = prev.findIndex(x => x.id === o.id); if (i === -1) return [o, ...prev]; const n = [...prev]; n[i] = { ...n[i], ...o }; return n; });
    setSelected(prev => prev?.id === o.id ? { ...prev, ...o } : prev);
  }, []);

  const load = useCallback(async () => {
    try { const r = await commandesService.getKDS(); setOrders(r.data || []); }
    catch { showToast('err', 'Chargement impossible.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    const s = createCommandesSocket(user);
    s.on('commande.nouvelle', () => load());
    s.on('commande.statut',   p => upsert(p));
    s.on('commande.paiement', p => upsert(p));
    return () => s.disconnect();
  }, [load, upsert, user]);

  const active = orders.filter(o => !['LIVREE','ANNULEE'].includes(o.statut));

  const handleSelect = o => { setSelected(o); setMontant(String(Math.round(Number(o.montantTotal)))); setPayMode('ESPECES'); };

  const total    = Math.round(Number(selected?.montantTotal || 0));
  const received = Math.round(Number(montant) || 0);
  const change   = received > total ? received - total : 0;
  const canPay   = payMode !== 'ESPECES' || received >= total;

  const handlePay = async () => {
    if (!selected || !canPay) return;
    setSaving(true);
    try {
      const r = await commandesService.registerPayment(selected.id, { modePaiement: payMode, montantRemis: received || total });
      upsert(r?.data?.commande || { ...selected, estPaye: true });
      showToast('ok', `Paiement validé — ${fmtF(total)}`);
      setSelected(null); setMontant('');
    } catch (e) { showToast('err', e?.response?.data?.message || 'Erreur paiement.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 200, background: toast.type === 'ok' ? GREEN_L : RED_L, border: `1px solid ${toast.type === 'ok' ? '#bbf7d0' : '#fecaca'}`, borderRadius: 14, padding: '12px 18px', fontSize: 13, fontWeight: 700, color: toast.type === 'ok' ? GREEN : RED, boxShadow: SH2, display: 'flex', alignItems: 'center', gap: 10 }}>
          {toast.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0, marginLeft: 4 }}><X size={13} color={MUTED} /></button>
        </div>
      )}

      {/* Welcome bar */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, color: TER, textTransform: 'uppercase', letterSpacing: '0.24em' }}>
          Encaissement
        </p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: NAVY, letterSpacing: '-0.03em' }}>Caisse</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
          {active.length} commande{active.length !== 1 ? 's' : ''} active{active.length !== 1 ? 's' : ''} · cliquez pour encaisser
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Liste commandes ── */}
        <div style={{ background: BG, borderRadius: 20, padding: 12, border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: '0 0 4px 4px', fontSize: 9.5, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            Commandes actives
          </p>
          {loading ? (
            <p style={{ textAlign: 'center', padding: 32, color: MUTED, fontSize: 13 }}>Chargement…</p>
          ) : active.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '44px 16px', background: CARD, borderRadius: 16, border: `1px solid ${BORDER}` }}>
              <Receipt size={32} color={BORDER} style={{ display: 'block', margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: 13, color: FAINT, fontWeight: 500 }}>Aucune commande active</p>
            </div>
          ) : active.map(o => (
            <OrderItem key={o.id} order={o} selected={selected?.id === o.id} onClick={() => handleSelect(o)} />
          ))}
        </div>

        {/* ── Panneau paiement ── */}
        {!selected ? (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '72px 24px', textAlign: 'center', boxShadow: SH }}>
            <div style={{ width: 60, height: 60, borderRadius: 20, background: BG, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Receipt size={26} color={BORDER} />
            </div>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: NAVY, fontSize: 15, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Sélectionnez une commande</p>
            <p style={{ margin: 0, fontSize: 13, color: FAINT }}>Les détails et le paiement apparaîtront ici</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Carte récap — header gradient + lignes */}
            <div style={{ background: CARD, borderRadius: 24, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: SH2 }}>
              {/* Header terracotta gradient */}
              <div style={{ background: TER_G, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
                      Facture
                    </p>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      CMD-{selected.numero}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.68)' }}>
                      {selected.tableNumero ? `Table ${selected.tableNumero}` : MODE_LABEL[selected.modeLivraison] || ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 1px', fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total TTC</p>
                    <p style={{ margin: 0, fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                      {fmt(total)}<span style={{ fontSize: 13, marginLeft: 4, fontWeight: 600 }}>F</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 14, flexShrink: 0 }}
                  >
                    <X size={14} color="#fff" />
                  </button>
                </div>
              </div>

              {/* Lignes commande */}
              <div style={{ padding: '18px 22px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {(selected.lignes || []).map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 26, height: 26, borderRadius: 8, background: TER_L, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: TER, flexShrink: 0 }}>
                          {l.quantite}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{l.article?.nom || l.nomArticle || 'Article'}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{fmt(Number(l.prixUnitaire) * Number(l.quantite))} F</span>
                    </div>
                  ))}
                </div>
                {/* Sous-totaux */}
                <div style={{ background: BG, borderRadius: 14, padding: '11px 15px', border: `1px solid ${BORDER}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: MUTED }}>Sous-total HT</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{fmt(Math.round(total / 1.18))} F</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: 12, color: MUTED }}>TVA 18%</span>
                    <span style={{ fontSize: 12, color: MUTED }}>{fmt(total - Math.round(total / 1.18))} F</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>Total TTC</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: TER }}>{fmtF(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modes de paiement */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '18px 20px', boxShadow: SH2 }}>
              <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Moyen de paiement</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {PAY_MODES.map(m => {
                  const sel = payMode === m.id;
                  return (
                    <button key={m.id} onClick={() => setPayMode(m.id)} style={{
                      padding: '14px 6px', borderRadius: 14, cursor: 'pointer',
                      background: sel ? TER_L : BG,
                      border: `1.5px solid ${sel ? TER : BORDER}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      boxShadow: sel ? `0 0 0 3px rgba(171,53,0,0.12)` : 'none',
                      transition: 'all 0.14s', fontFamily: 'inherit',
                    }}>
                      {m.logo
                        ? <img src={m.logo} alt={m.label} style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
                        : <span style={{ fontSize: 24 }}>{m.icon}</span>
                      }
                      <span style={{ fontSize: 11, fontWeight: 700, color: sel ? TER : MUTED }}>{m.label}</span>
                      {sel && <CheckCircle2 size={12} color={TER} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Montant reçu (espèces) */}
            {payMode === 'ESPECES' && (
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '18px 20px', boxShadow: SH2 }}>
                <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Montant reçu</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number" min="0" value={montant} onChange={e => setMontant(e.target.value)}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${BORDER}`, background: BG, fontSize: 22, fontWeight: 800, color: NAVY, outline: 'none', textAlign: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      placeholder="0"
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      {[total, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000]
                        .filter((v, i, a) => a.indexOf(v) === i).slice(0, 3)
                        .map(v => (
                          <button key={v} onClick={() => setMontant(String(v))} style={{
                            flex: 1, padding: '9px', borderRadius: 99,
                            background: Number(montant) === v ? TER : BG,
                            border: `1.5px solid ${Number(montant) === v ? TER : BORDER}`,
                            color: Number(montant) === v ? '#fff' : MUTED,
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            boxShadow: Number(montant) === v ? '0 4px 12px rgba(171,53,0,0.25)' : 'none',
                            transition: 'all 0.13s', fontFamily: 'inherit',
                          }}>
                            {v === total ? 'Exact' : `${Math.round(v / 1000)}k F`}
                          </button>
                        ))}
                    </div>
                  </div>
                  {change > 0 && (
                    <div style={{ background: GREEN_L, borderRadius: 16, padding: '16px 18px', textAlign: 'center', minWidth: 110, border: '1px solid #bbf7d0' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Rendu</p>
                      <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: GREEN }}>{fmt(change)}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: GREEN, fontWeight: 600 }}>FCFA</p>
                    </div>
                  )}
                </div>
                {received < total && received > 0 && (
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: RED, fontWeight: 600 }}>
                    ⚠ Manque {fmtF(total - received)}
                  </p>
                )}
              </div>
            )}

            {/* Bouton valider */}
            {selected.estPaye ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', borderRadius: 99, background: GREEN_L, border: '1px solid #bbf7d0', color: GREEN, fontWeight: 700, fontSize: 14 }}>
                <CheckCircle2 size={18} /> Paiement déjà enregistré
              </div>
            ) : (
              <button
                onClick={handlePay}
                disabled={saving || !canPay}
                style={{
                  width: '100%', padding: '17px', borderRadius: 99, border: 'none',
                  background: canPay ? TER_G : BG,
                  color: canPay ? '#fff' : FAINT,
                  fontSize: 15, fontWeight: 800,
                  cursor: !canPay || saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.75 : 1,
                  boxShadow: canPay ? '0 6px 20px rgba(171,53,0,0.30)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  transition: 'all 0.15s', fontFamily: 'inherit',
                  border: canPay ? 'none' : `1px solid ${BORDER}`,
                }}
              >
                <Receipt size={17} />
                {saving ? 'Traitement…' : `Valider le paiement · ${fmtF(total)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
