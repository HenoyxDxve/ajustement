import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, CheckCircle2, ChefHat,
  CircleDollarSign, Flame, Mail, Package, Phone,
  RefreshCw, Save, ShieldCheck, User, Clock,
  Wallet, Truck, Calendar, Activity, X,
  Boxes, LayoutDashboard, ListOrdered, UtensilsCrossed,
  Minus, Plus, Zap, CheckCircle, Coffee,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import OnboardingWizard from '../../components/wizard/OnboardingWizard';
import { commandesService, createCommandesSocket } from '../../services/commandes.service';
import { stocksAPI, authAPI, b2bAPI } from '../../services/api';
import NewOrderModal from '../../components/staff/NewOrderModal';
import SecurityPanel from '../../components/security/SecurityPanel';
import NotificationBell from '../../components/notifications/NotificationBell';
import {
  formatDeliveryMode, formatFCFA,
  STATUS_LABELS, timeAgo,
} from '../../utils/formatters';

/* ── Palette (inchangée) ── */
const ACCENT       = '#FF8C00';
const ACCENT_DARK  = '#E07A00';
const ACCENT_LIGHT = '#FFF0DF';
const SURFACE      = '#F5F6F8';
const BORDER       = 'rgba(0,0,0,0.08)';
const TEXT         = '#111827';
const MUTED        = '#6B7280';

/* ── Pipeline statuts ── */
const STATUS_FLOW = {
  RECUE:        ['CONFIRMEE'],
  CONFIRMEE:    ['EN_PREP'],
  EN_PREP:      ['PRETE'],
  PRETE:        ['EN_LIVRAISON', 'LIVREE'],
  EN_LIVRAISON: ['LIVREE'],
  LIVREE:       [],
  ANNULEE:      [],
};
const ACTION_LABELS = {
  CONFIRMEE:    'Confirmer',
  EN_PREP:      'Démarrer la prépa',
  PRETE:        'Marquer prête',
  EN_LIVRAISON: 'En livraison',
  LIVREE:       'Livré',
};
const B2B_STATUS_FLOW = {
  EN_ATTENTE:    ['CONFIRMEE'],
  CONFIRMEE:     ['EN_PREPARATION'],
  EN_PREPARATION:['LIVREE'],
  LIVREE:        [],
  ANNULEE:       [],
};
const B2B_STATUS_LABELS = {
  EN_ATTENTE:    'En attente',
  CONFIRMEE:     'Confirmée',
  EN_PREPARATION:'En préparation',
  LIVREE:        'Livrée',
  ANNULEE:       'Annulée',
};
const B2B_ACTION_LABELS = {
  CONFIRMEE:     'Confirmer',
  EN_PREPARATION:'Démarrer',
  LIVREE:        'Livrer',
};
const BADGE = {
  RECUE:         { bg: '#DBEAFE', text: '#1D4ED8' },
  CONFIRMEE:     { bg: '#EDE9FE', text: '#6D28D9' },
  EN_PREP:       { bg: '#FEF3C7', text: '#B45309' },
  PRETE:         { bg: '#D1FAE5', text: '#065F46' },
  EN_LIVRAISON:  { bg: '#FCE7F3', text: '#9D174D' },
  LIVREE:        { bg: '#D1FAE5', text: '#065F46' },
  ANNULEE:       { bg: '#FEE2E2', text: '#991B1B' },
  EN_ATTENTE:    { bg: '#FEF9C3', text: '#854D0E' },
  EN_PREPARATION:{ bg: '#FEF3C7', text: '#B45309' },
};
const WEEK_DAYS = [
  { init: 'LU', name: 'Lundi'    },
  { init: 'MA', name: 'Mardi'    },
  { init: 'ME', name: 'Mercredi' },
  { init: 'JE', name: 'Jeudi'    },
  { init: 'VE', name: 'Vendredi' },
  { init: 'SA', name: 'Samedi'   },
  { init: 'DI', name: 'Dimanche' },
];

/* ── KDS colonnes ── */
const KDS_COLS = [
  { key: 'new',   label: 'Nouvelles',      dot: ACCENT,    statuses: ['RECUE','CONFIRMEE'] },
  { key: 'prep',  label: 'En préparation', dot: '#D97706', statuses: ['EN_PREP']           },
  { key: 'ready', label: 'Prêtes',         dot: '#16A34A', statuses: ['PRETE']             },
  { key: 'deliv', label: 'En livraison',   dot: '#7C3AED', statuses: ['EN_LIVRAISON']      },
];

function buildWeek(open, close) {
  const label = open && close ? `${open} – ${close}` : null;
  return WEEK_DAYS.map(({ init, name }) => ({ init, name, hours: label || 'Non configuré', rest: !label }));
}
function isInService(open, close) {
  if (!open || !close) return false;
  const now = new Date();
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= oh * 60 + om && cur < ch * 60 + cm;
}

/* ════════════════════════════════════
   Composants UI atomiques
   ════════════════════════════════════ */

function Spinner({ size = 14, color = '#fff' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      border: `2px solid rgba(${color === '#fff' ? '255,255,255' : '0,0,0'},0.25)`,
      borderTopColor: color, animation: 'staff-spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

function StatusBadge({ label, bg, color }) {
  return (
    <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function TimerBadge({ minutesAgo }) {
  const isLate = minutesAgo >= 20;
  const isWarn = !isLate && minutesAgo >= 10;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 10px', borderRadius: 11, fontWeight: 700, fontSize: 13,
      background: isLate ? '#FFE7E3' : isWarn ? '#FFF1E0' : '#F3F4F6',
      color: isLate ? '#DC2626' : isWarn ? '#D97706' : MUTED,
      animation: isLate ? 'staff-pulse 1.4s infinite' : 'none',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <Clock style={{ width: 11, height: 11 }} /> {minutesAgo} min
    </span>
  );
}

/* ── Toast system ── */
function ToastList({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 26, right: 26, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: '#fff', borderRadius: 16, padding: '14px 18px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.14)',
          display: 'flex', alignItems: 'center', gap: 12,
          minWidth: 280, maxWidth: 380,
          borderLeft: `4px solid ${t.ok ? '#22C55E' : ACCENT}`,
          animation: 'toast-in 0.35s cubic-bezier(.2,.9,.3,1.2)',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: t.ok ? '#ECFDF5' : ACCENT_LIGHT, fontSize: 18, flexShrink: 0,
          }}>
            {t.ok ? '✓' : '🍽️'}
          </div>
          <div>
            <b style={{ display: 'block', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, color: TEXT }}>{t.title}</b>
            <span style={{ fontSize: 12, color: MUTED }}>{t.msg}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ icon: Icon, iconBg, iconColor, eyebrow, label, value, unit, sub, subOk = true }) {
  return (
    <div style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(0,0,0,0.07)', padding: '22px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 20, right: 20, width: 8, height: 8, borderRadius: '50%', background: subOk ? '#22C55E' : '#F59E0B' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          {eyebrow && (
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 4px' }}>{eyebrow}</p>
          )}
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: MUTED, margin: 0, maxWidth: '70%', lineHeight: 1.4 }}>{label}</p>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 20, height: 20, color: iconColor }} />
        </div>
      </div>
      <p style={{ fontSize: 32, fontWeight: 900, color: TEXT, margin: '0 0 8px', lineHeight: 1, letterSpacing: '-0.03em' }}>
        {value}
        {unit && <span style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginLeft: 6 }}>{unit}</span>}
      </p>
      {sub && (
        <p style={{ fontSize: 12, fontWeight: 600, color: subOk ? '#16A34A' : '#D97706', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          {!subOk && <AlertTriangle style={{ width: 11, height: 11, flexShrink: 0 }} />}
          {sub}
        </p>
      )}
    </div>
  );
}

/* ── Carte commande client (améliorée) ── */
function StaffOrderCard({ order, onAction, onPayment, paymentDraft, setPaymentDraft, saving }) {
  const age         = order.createdAt ? Date.now() - new Date(order.createdAt).getTime() : 0;
  const minutesAgo  = Math.floor(age / 60000);
  const isUrgent    = age >= 15 * 60 * 1000;
  const timeStr     = order.createdAt ? new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  const nextStatuses = STATUS_FLOW[order.statut] || [];
  const draft        = paymentDraft || {};
  const statBadge    = BADGE[order.statut] || { bg: '#F3F4F6', text: '#6B7280' };
  const canCancel    = order.statut === 'RECUE' && age < 5 * 60 * 1000;
  const note         = order.notes || order.commentaire;

  return (
    <div style={{
      background: isUrgent ? '#FFF5F5' : '#fff',
      borderRadius: 20, padding: '16px',
      border: isUrgent ? '1.5px solid #FECACA' : '1px solid rgba(0,0,0,0.07)',
      boxShadow: isUrgent ? '0 0 0 3px rgba(239,68,68,0.07)' : '0 2px 10px rgba(0,0,0,0.04)',
    }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: isUrgent ? '#FEE2E2' : ACCENT_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ChefHat style={{ width: 20, height: 20, color: isUrgent ? '#DC2626' : ACCENT }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
              <StatusBadge label={`#${order.numero}`} bg="#F3F4F6" color={TEXT} />
              <StatusBadge label={STATUS_LABELS[order.statut] || order.statut} bg={statBadge.bg} color={statBadge.text} />
              {order.modeLivraison && (
                <StatusBadge label={formatDeliveryMode(order.modeLivraison)} bg={ACCENT_LIGHT} color={ACCENT} />
              )}
              {isUrgent && <StatusBadge label="URGENT" bg="#FEE2E2" color="#DC2626" />}
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(order.lignes || []).map(l => l.article?.nom).filter(Boolean).join(', ') || `Commande ${order.numero}`}
            </p>
            <p style={{ fontSize: 11, color: MUTED, margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock style={{ width: 10, height: 10 }} />
              Reçue à {timeStr}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <TimerBadge minutesAgo={minutesAgo} />
          <p style={{ fontSize: 18, fontWeight: 900, color: ACCENT, margin: 0, lineHeight: 1 }}>
            {(Number(order.montantTotal) || 0).toLocaleString('fr-FR')} <span style={{ fontSize: 10, color: MUTED }}>FCFA</span>
          </p>
        </div>
      </div>

      {/* Lignes */}
      {(order.lignes || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {order.lignes.slice(0, 5).map((l, i) => (
            <span key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '3px 9px', fontSize: 11, color: TEXT, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 800, color: ACCENT }}>{l.quantite}×</span> {l.article?.nom || 'Article'}
            </span>
          ))}
          {order.lignes.length > 5 && (
            <span style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '3px 9px', fontSize: 11, color: MUTED }}>
              +{order.lignes.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Note client */}
      {note && (
        <div style={{ background: '#FFF6EE', borderRadius: 11, padding: '8px 12px', marginBottom: 10, fontSize: 12.5, color: '#D97706', fontWeight: 600, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
          <AlertTriangle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
          <span>{note}</span>
        </div>
      )}

      {/* Encaissement */}
      {!order.estPaye && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: TEXT, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <CircleDollarSign style={{ width: 12, height: 12, color: ACCENT }} /> Encaissement
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={draft.modePaiement || 'ESPECES'}
              onChange={e => setPaymentDraft({ ...draft, modePaiement: e.target.value })}
              style={{ flex: 1, borderRadius: 10, border: `1px solid ${BORDER}`, padding: '8px 10px', fontSize: 12, outline: 'none', background: '#fff', color: TEXT }}>
              <option value="ESPECES">Espèces</option>
              <option value="CARTE_BANCAIRE">Carte bancaire</option>
              <option value="WAVE">Wave</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="MTN_MONEY">MTN Money</option>
              <option value="MOOV_MONEY">Moov Money</option>
            </select>
            <input
              type="number" min="0"
              value={draft.montantRemis ?? Number(order.montantTotal)}
              onChange={e => setPaymentDraft({ ...draft, montantRemis: e.target.value })}
              style={{ width: 96, borderRadius: 10, border: `1px solid ${BORDER}`, padding: '8px 10px', fontSize: 12, outline: 'none', background: '#fff', color: TEXT }}
            />
            <button
              onClick={() => onPayment(order)} disabled={saving}
              style={{ borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, color: '#fff', padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, whiteSpace: 'nowrap', boxShadow: `0 2px 8px ${ACCENT}44` }}>
              {saving ? '...' : 'Encaisser'}
            </button>
          </div>
          {Number(draft.montantRemis) > Number(order.montantTotal) && (
            <p style={{ fontSize: 12, color: '#16A34A', fontWeight: 700, margin: '6px 0 0' }}>
              Rendu : {formatFCFA(Number(draft.montantRemis) - Number(order.montantTotal))}
            </p>
          )}
        </div>
      )}

      {/* Boutons d'avancement */}
      {nextStatuses.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {nextStatuses.map((ns, i) => (
            <button key={ns} onClick={() => onAction(order.id, ns)} disabled={saving}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 999,
                border: i === 0 ? 'none' : `1.5px solid ${ACCENT}`,
                background: i === 0 ? `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})` : '#fff',
                color: i === 0 ? '#fff' : ACCENT,
                fontSize: 13, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: i === 0 ? `0 6px 16px ${ACCENT}44` : 'none',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}>
              {saving && i === 0 ? <Spinner /> : null}
              {ACTION_LABELS[ns] || ns} {i === 0 ? '→' : ''}
            </button>
          ))}
        </div>
      )}

      {canCancel && (
        <button onClick={() => onAction(order.id, 'ANNULEE')} disabled={saving}
          style={{ width: '100%', marginTop: 8, padding: '9px', borderRadius: 12, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          Annuler la commande
        </button>
      )}
    </div>
  );
}

/* ── Carte commande B2B ── */
function B2BOrderCard({ order, onAction, saving }) {
  const age        = order.createdAt ? Date.now() - new Date(order.createdAt).getTime() : 0;
  const minutesAgo = Math.floor(age / 60000);
  const isUrgent   = age >= 15 * 60 * 1000;
  const timeStr    = order.createdAt ? new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  const nextStatuses = B2B_STATUS_FLOW[order.statut] || [];
  const statBadge    = BADGE[order.statut] || { bg: '#FEF3C7', text: '#B45309' };

  return (
    <div style={{ background: isUrgent ? '#FFFBEB' : '#FFFDF5', borderRadius: 20, padding: '16px', border: isUrgent ? '1.5px solid #FCD34D' : '1px solid #FDE68A', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package style={{ width: 20, height: 20, color: '#D97706' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
              <StatusBadge label={`#${order.numero}`} bg="#FEF3C7" color="#B45309" />
              <StatusBadge label="B2B" bg="#D97706" color="#fff" />
              <StatusBadge label={B2B_STATUS_LABELS[order.statut] || order.statut} bg={statBadge.bg} color={statBadge.text} />
              {isUrgent && <StatusBadge label="URGENT" bg="#FEE2E2" color="#DC2626" />}
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.entreprise || 'Entreprise B2B'}
            </p>
            <p style={{ fontSize: 11, color: MUTED, margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock style={{ width: 10, height: 10 }} /> Reçue à {timeStr}
            </p>
            {(order.dateLivraison || order.heureLivraison) && (
              <p style={{ fontSize: 11, color: '#B45309', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Truck style={{ width: 10, height: 10 }} />
                {order.dateLivraison ? new Date(order.dateLivraison).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                {order.heureLivraison ? ` à ${order.heureLivraison}` : ''}
                {order.lieuLivraison ? ` · ${order.lieuLivraison}` : ''}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <TimerBadge minutesAgo={minutesAgo} />
          {order.totalEstime != null && (
            <p style={{ fontSize: 18, fontWeight: 900, color: '#D97706', margin: 0 }}>
              {(Number(order.totalEstime) || 0).toLocaleString('fr-FR')} <span style={{ fontSize: 10, color: MUTED }}>FCFA</span>
            </p>
          )}
        </div>
      </div>

      {(order.lignes || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          {order.lignes.slice(0, 4).map((l, i) => (
            <span key={i} style={{ background: '#FEF9C3', border: '1px solid #FEF08A', borderRadius: 8, padding: '3px 9px', fontSize: 11, color: '#713F12', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 800 }}>{l.quantite}×</span> {l.nomArticle || 'Article'}
            </span>
          ))}
          {order.lignes.length > 4 && (
            <span style={{ background: '#FEF9C3', border: '1px solid #FEF08A', borderRadius: 8, padding: '3px 9px', fontSize: 11, color: MUTED }}>
              +{order.lignes.length - 4}
            </span>
          )}
        </div>
      )}

      {nextStatuses.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {nextStatuses.map((ns, i) => (
            <button key={ns} onClick={() => onAction(order.id, ns)} disabled={saving}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 999,
                border: i === 0 ? 'none' : '1.5px solid #D97706',
                background: i === 0 ? 'linear-gradient(135deg,#D97706,#B45309)' : '#fff',
                color: i === 0 ? '#fff' : '#D97706',
                fontSize: 13, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                boxShadow: i === 0 ? '0 6px 16px rgba(217,119,6,0.35)' : 'none',
              }}>
              {B2B_ACTION_LABELS[ns] || ns} {i === 0 ? '→' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tableau KDS (4 colonnes) ── */
function KDSBoard({ orders, b2bOrders, onAction, onB2BAction, onPayment, paymentDrafts, setPaymentDrafts, savingOrderId, savingB2BId }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, alignItems: 'start' }}>
      {KDS_COLS.map(col => {
        const colOrders = orders
          .filter(o => col.statuses.includes(o.statut))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const colB2B = b2bOrders
          .filter(o => col.statuses.some(s => s === o.statut || (s === 'RECUE' && o.statut === 'EN_ATTENTE') || (s === 'EN_PREP' && o.statut === 'EN_PREPARATION')))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const total = colOrders.length + colB2B.length;

        return (
          <div key={col.key} style={{ background: '#F0F0EF', borderRadius: 20, padding: '14px 12px', minHeight: 120 }}>
            {/* Colonne header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: TEXT }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: col.dot, display: 'inline-block', flexShrink: 0 }} />
                {col.label}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, background: '#E5E5E3', padding: '2px 10px', borderRadius: 99 }}>{total}</span>
            </div>

            {/* Cartes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {colOrders.map(o => (
                <StaffOrderCard key={o.id} order={o}
                  onAction={onAction} onPayment={onPayment}
                  paymentDraft={paymentDrafts[o.id]}
                  setPaymentDraft={v => setPaymentDrafts(p => ({ ...p, [o.id]: v }))}
                  saving={savingOrderId === o.id}
                />
              ))}
              {colB2B.map(o => (
                <B2BOrderCard key={o.id} order={o} onAction={onB2BAction} saving={savingB2BId === o.id} />
              ))}
              {total === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 10px', color: MUTED, fontSize: 13 }}>
                  <span style={{ fontSize: 28, display: 'block', marginBottom: 8, opacity: 0.4 }}>👌</span>
                  Rien pour l'instant
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Planning hebdomadaire ── */
function WeeklySchedule({ openingTime, closingTime }) {
  const todayIdx  = (new Date().getDay() + 6) % 7;
  const week      = buildWeek(openingTime, closingTime);
  const inService = isInService(openingTime, closingTime);

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '20px', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>Planning semaine</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: inService ? '#22C55E' : '#9CA3AF', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: inService ? '#16A34A' : MUTED, fontWeight: 600 }}>
              {inService ? 'En service' : 'Hors service'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Calendar style={{ width: 15, height: 15, color: MUTED }} />
          {openingTime && closingTime && (
            <span style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>{openingTime}–{closingTime}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {week.map((day, i) => {
          const isToday = i === todayIdx;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 12,
              background: isToday ? ACCENT_LIGHT : 'transparent',
              border: isToday ? `1px solid ${ACCENT}25` : '1px solid transparent',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: isToday ? ACCENT : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: isToday ? '#fff' : MUTED, boxShadow: isToday ? `0 2px 8px ${ACCENT}55` : 'none' }}>
                {day.init}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: TEXT, margin: 0 }}>{day.name}</p>
                <p style={{ fontSize: 10, color: day.rest ? '#EF4444' : MUTED, margin: '1px 0 0' }}>{day.hours}</p>
              </div>
              {isToday && <span style={{ width: 8, height: 8, borderRadius: '50%', background: inService ? '#22C55E' : '#D97706', flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Panel profil ── */
function PanelField({ label, type = 'text', icon: Icon, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: MUTED, pointerEvents: 'none' }} />}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', boxSizing: 'border-box', padding: `11px 12px 11px ${Icon ? 36 : 12}px`, border: `1.5px solid rgba(0,0,0,0.1)`, borderRadius: 12, fontSize: 13, color: TEXT, outline: 'none', background: SURFACE }}
          onFocus={e => (e.target.style.borderColor = ACCENT)}
          onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
        />
      </div>
    </div>
  );
}

function ProfilePanel({ user, onClose, form, setForm, onSave, saving, error, success }) {
  const [panelTab, setPanelTab] = useState('profil');
  const initials = ((user?.prenom?.[0] ?? '') + (user?.nom?.[0] ?? '')).toUpperCase() || 'S';
  const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || 'Mon Profil';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40, backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(480px,100vw)', background: '#fff', zIndex: 50, overflowY: 'auto', boxShadow: '-24px 0 80px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#fff', padding: '28px 28px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: ACCENT_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: ACCENT, border: `2px solid ${ACCENT}22` }}>
                {initials}
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: TEXT, margin: '0 0 3px' }}>{fullName}</p>
                <p style={{ fontSize: 12, color: MUTED, margin: '0 0 6px' }}>{user?.email}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: ACCENT_LIGHT, borderRadius: 99, padding: '3px 12px', fontSize: 10, fontWeight: 800, color: ACCENT, letterSpacing: '0.1em' }}>
                  <Zap style={{ width: 9, height: 9 }} /> STAFF
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: SURFACE, border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer', lineHeight: 0 }}>
              <X style={{ width: 16, height: 16, color: MUTED }} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ id: 'profil', label: 'Profil', icon: User }, { id: 'securite', label: 'Sécurité', icon: ShieldCheck }].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setPanelTab(id)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', border: `1.5px solid ${panelTab === id ? ACCENT : BORDER}`, borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: panelTab === id ? ACCENT_LIGHT : '#fff', color: panelTab === id ? ACCENT : MUTED }}>
                <Icon style={{ width: 13, height: 13 }} />{label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '28px', flex: 1 }}>
          {panelTab === 'profil' && (
            <>
              {error   && <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{error}</div>}
              {success && <div style={{ padding: '12px 16px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #86EFAC', color: '#16A34A', fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{success}</div>}
              <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <PanelField label="Prénom" icon={User} value={form.prenom} onChange={v => setForm(p => ({ ...p, prenom: v }))} placeholder="Jean" />
                  <PanelField label="Nom"    icon={User} value={form.nom}    onChange={v => setForm(p => ({ ...p, nom: v }))}    placeholder="Kouassi" />
                </div>
                <PanelField label="Email"     type="email" icon={Mail}  value={form.email}     onChange={v => setForm(p => ({ ...p, email: v }))}     placeholder="jean@staff.ci" />
                <PanelField label="Téléphone" type="tel"   icon={Phone} value={form.telephone} onChange={v => setForm(p => ({ ...p, telephone: v }))} placeholder="+225 07 00 00 00" />
                <button type="submit" disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: saving ? MUTED : `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 4, boxShadow: saving ? 'none' : `0 4px 16px ${ACCENT}44` }}>
                  {saving ? <><Spinner />Enregistrement…</> : <><Save style={{ width: 15, height: 15 }} />Enregistrer</>}
                </button>
              </form>
            </>
          )}
          {panelTab === 'securite' && <SecurityPanel user={user} accentColor={ACCENT} />}
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   StaffDashboard — Composant principal
   ════════════════════════════════════════════════════════════════ */
export default function StaffDashboard() {
  const { user, syncUser, refreshProfile } = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const activeTab   = new URLSearchParams(location.search).get('tab') || 'dashboard';
  const goTab       = (id) => navigate(id === 'dashboard' ? '/staff' : `/staff?tab=${id}`);

  const [showPanel, setShowPanel]         = useState(false);
  const [showNewOrder, setShowNewOrder]   = useState(false);
  const [isAvailable, setIsAvailable]     = useState(true);
  const [orders, setOrders]               = useState([]);
  const [b2bOrders, setB2bOrders]         = useState([]);
  const [stocks, setStocks]               = useState([]);
  const [stockFilter, setStockFilter]     = useState('all');
  const [orderFilter, setOrderFilter]     = useState('board');
  const [loading, setLoading]             = useState(true);
  const [savingOrderId, setSavingOrderId] = useState('');
  const [savingB2BId, setSavingB2BId]     = useState('');
  const [savingStockId, setSavingStockId] = useState('');
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [actionHistory, setActionHistory] = useState([]);
  const [serverActivity, setServerActivity] = useState([]);

  /* Toast system */
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((title, msg, ok = false) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, title, msg, ok }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  const [form, setForm]                     = useState({ nom: '', prenom: '', email: '', telephone: '' });
  const [savingProfile, setSavingProfile]   = useState(false);
  const [profileError, setProfileError]     = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    if (user) setForm({ nom: user.nom ?? '', prenom: user.prenom ?? '', email: user.email ?? '', telephone: user.telephone ?? '' });
  }, [user]);

  const historyKey = user?.restaurant?.id
    ? `staff-history:${user.restaurant.id}`
    : `staff-history:${user?.id ?? 'global'}`;

  const appendHistory = useCallback((type, title, desc) => {
    const entry = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type, title, desc, at: new Date().toISOString() };
    setActionHistory(cur => {
      const next = [entry, ...cur].slice(0, 10);
      try { localStorage.setItem(historyKey, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, [historyKey]);

  const loadActivity = useCallback(async () => {
    try {
      const res = await commandesService.getRestaurantActivity(20);
      setServerActivity(Array.isArray(res.data) ? res.data : []);
    } catch { /* non-bloquant */ }
  }, []);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [kdsRes, b2bRes, stocksRes] = await Promise.allSettled([
        commandesService.getKDS(),
        b2bAPI.getRestaurantKDS(),
        stocksAPI.getAll(),
      ]);
      setOrders(kdsRes.status === 'fulfilled' ? (kdsRes.value.data || []) : []);
      setB2bOrders(b2bRes.status === 'fulfilled' ? (b2bRes.value.data || []) : []);
      setStocks(stocksRes.status === 'fulfilled' ? (stocksRes.value.data || []) : []);
    } catch { /* silencieux */ }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => {
    void refreshProfile();
    void refresh();
    void loadActivity();
    try {
      const stored = JSON.parse(localStorage.getItem(historyKey) || '[]');
      setActionHistory(Array.isArray(stored) ? stored : []);
    } catch { setActionHistory([]); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userId       = user?.id;
  const restaurantId = user?.restaurant?.id;
  const userRole     = user?.role;

  useEffect(() => {
    if (!userId) return;
    const poll   = setInterval(() => void refresh({ silent: true }), 8000);
    const socket = createCommandesSocket({ id: userId, role: userRole, restaurant: restaurantId ? { id: restaurantId } : undefined });

    socket.on('commande.nouvelle',     p => { appendHistory('commande', `Commande #${p?.numero || ''}`, 'Nouvelle commande reçue'); pushToast(`Commande #${p?.numero || ''}`, 'Nouvelle commande arrivée en cuisine'); void refresh({ silent: true }); });
    socket.on('commande.statut',       p => { appendHistory('statut', `#${p?.numero || ''} mis à jour`, `→ ${STATUS_LABELS[p?.statut] || p?.statut || '?'}`); void refresh({ silent: true }); });
    socket.on('commande.paiement',     p => { appendHistory('paiement', `Paiement #${p?.numero || ''}`, 'Encaissement validé'); pushToast(`Paiement #${p?.numero || ''}`, 'Encaissement confirmé', true); void refresh({ silent: true }); });
    socket.on('commande.b2b.nouvelle', p => { appendHistory('b2b', `B2B #${p?.numero || ''}`, p?.entreprise || 'Commande B2B'); pushToast(`B2B #${p?.numero || ''}`, p?.entreprise || 'Commande entreprise'); void refresh({ silent: true }); });
    socket.on('commande.b2b.statut',   () => void refresh({ silent: true }));
    socket.on('reconnect',             () => void refresh({ silent: true }));

    return () => { clearInterval(poll); socket.disconnect(); };
  }, [appendHistory, pushToast, refresh, userId, restaurantId, userRole]);

  /* ── Données dérivées ── */
  const activeOrders = useMemo(
    () => orders.filter(o => ['RECUE','CONFIRMEE','EN_PREP','PRETE','EN_LIVRAISON'].includes(o.statut)),
    [orders],
  );
  const urgentOrders = useMemo(
    () => activeOrders.filter(o => o.createdAt && Date.now() - new Date(o.createdAt).getTime() >= 15 * 60 * 1000),
    [activeOrders],
  );
  const todayStr = useMemo(() => new Date().toDateString(), []);
  const completedToday = useMemo(
    () => orders.filter(o => o.statut === 'LIVREE' && new Date(o.updatedAt || o.createdAt).toDateString() === todayStr),
    [orders, todayStr],
  );
  const encaissementsToday = useMemo(
    () => completedToday.reduce((s, o) => s + Number(o.montantTotal || 0), 0),
    [completedToday],
  );
  const activeB2B = useMemo(
    () => b2bOrders.filter(o => !['LIVREE','ANNULEE'].includes(o.statut)),
    [b2bOrders],
  );
  const allActive = useMemo(
    () => [
      ...activeOrders.map(o => ({ ...o, _type: 'client' })),
      ...activeB2B.map(o => ({ ...o, _type: 'b2b' })),
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [activeOrders, activeB2B],
  );
  const stockAlerts = useMemo(() => stocks.filter(s => s.stock <= s.seuil), [stocks]);
  const displayedStocks = useMemo(
    () => stockFilter === 'alerts' ? stockAlerts : stocks,
    [stocks, stockAlerts, stockFilter],
  );
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'board') return allActive;
    if (orderFilter === 'b2b')  return activeB2B.map(o => ({ ...o, _type: 'b2b' }));
    return [
      ...activeOrders.map(o => ({ ...o, _type: 'client' })),
      ...completedToday.map(o => ({ ...o, _type: 'client' })),
      ...b2bOrders.map(o => ({ ...o, _type: 'b2b' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orderFilter, allActive, activeB2B, activeOrders, completedToday, b2bOrders]);

  /* ── Actions ── */
  const updateStatus = async (id, next) => {
    try {
      setSavingOrderId(id);
      await commandesService.updateStatut(id, next);
      appendHistory('action', 'Commande mise à jour', `→ ${STATUS_LABELS[next] || next}`);
      pushToast('Statut mis à jour', STATUS_LABELS[next] || next, true);
      void loadActivity();
      await refresh({ silent: true });
    } catch { pushToast('Erreur', 'Mise à jour impossible'); }
    finally { setSavingOrderId(''); }
  };

  const registerPayment = async (order) => {
    const draft = paymentDrafts[order.id] || {};
    const montantRemis = Number(draft.montantRemis ?? order.montantTotal);
    const modePaiement = draft.modePaiement || 'ESPECES';
    if (!Number.isFinite(montantRemis)) { pushToast('Erreur', 'Montant invalide'); return; }
    try {
      setSavingOrderId(order.id);
      await commandesService.registerPayment(order.id, { montantRemis, modePaiement });
      appendHistory('paiement', `Encaissement #${order.numero}`, modePaiement);
      pushToast(`Encaissement #${order.numero}`, 'Reçu envoyé', true);
      await refresh({ silent: true });
    } catch { pushToast('Erreur', 'Encaissement refusé'); }
    finally { setSavingOrderId(''); }
  };

  const updateB2BStatus = async (id, statut) => {
    try {
      setSavingB2BId(id);
      await b2bAPI.updateCommandeGroupeeStatut(id, statut);
      appendHistory('b2b', 'Commande B2B mise à jour', `→ ${B2B_STATUS_LABELS[statut] || statut}`);
      pushToast('B2B mis à jour', B2B_STATUS_LABELS[statut] || statut, true);
      await refresh({ silent: true });
    } catch { pushToast('Erreur', 'Mise à jour B2B impossible'); }
    finally { setSavingB2BId(''); }
  };

  const adjustStock = async (id, qty, motif) => {
    try {
      setSavingStockId(id);
      await stocksAPI.adjust(id, qty, motif);
      appendHistory('stock', 'Stock ajusté', `${motif} (${qty > 0 ? '+' : ''}${qty})`);
      pushToast('Stock ajusté', `${qty > 0 ? '+' : ''}${qty} unité${Math.abs(qty) > 1 ? 's' : ''}`, true);
      await refresh({ silent: true });
    } catch { pushToast('Erreur', 'Ajustement impossible'); }
    finally { setSavingStockId(''); }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setProfileError(''); setProfileSuccess('');
    if (!form.nom.trim() || !form.email.trim()) { setProfileError('Nom et email requis'); return; }
    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile(form);
      syncUser(res.data);
      setProfileSuccess('Profil mis à jour.');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) { setProfileError(err?.response?.data?.message || 'Erreur de mise à jour'); }
    finally { setSavingProfile(false); }
  };

  const initials  = ((user?.prenom?.[0] ?? '') + (user?.nom?.[0] ?? '')).toUpperCase() || 'S';
  const firstName = user?.prenom || user?.nom || 'vous';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${ACCENT_LIGHT}`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'staff-spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>Chargement du tableau de bord…</p>
        </div>
        <style>{`@keyframes staff-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const TABS = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'commandes', label: 'Commandes',        icon: ListOrdered,   badge: allActive.length || undefined },
    { id: 'stocks',    label: 'Stocks',           icon: Boxes,         badge: stockAlerts.length || undefined, badgeRed: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: SURFACE }}>
      <style>{`
        @keyframes staff-spin  { to { transform: rotate(360deg) } }
        @keyframes staff-pulse { 50% { opacity: .5 } }
        @keyframes toast-in    { from { transform: translateX(110%); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes kds-pop     { 0% { transform: scale(.92); opacity: 0 } 100% { transform: none; opacity: 1 } }
        .nav-pill:hover:not(.active){ background: rgba(0,0,0,0.06) !important }
      `}</style>
      <OnboardingWizard />

      {/* ════════════════════════════════════
          TOPBAR — glassmorphism
      ════════════════════════════════════ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, background: `linear-gradient(145deg,${ACCENT},${ACCENT_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${ACCENT}44` }}>
              <UtensilsCrossed style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: TEXT, margin: 0, lineHeight: 1.2 }}>Resto d'ici</p>
              <p style={{ fontSize: 10, color: MUTED, margin: 0, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Espace Staff</p>
            </div>
          </div>

          {/* Nav pills */}
          <nav style={{ display: 'flex', gap: 4, flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TABS.map(({ id, label, icon: Icon, badge, badgeRed }) => (
              <button key={id}
                className={`nav-pill${activeTab === id ? ' active' : ''}`}
                onClick={() => goTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 999,
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13.5, fontWeight: 600,
                  transition: 'background 0.15s, color 0.15s',
                  background: activeTab === id ? ACCENT : 'transparent',
                  color: activeTab === id ? '#fff' : MUTED,
                  boxShadow: activeTab === id ? `0 4px 12px ${ACCENT}44` : 'none',
                }}>
                <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
                <span style={{ display: 'none' }}>{label}</span>
                <span className="sm:inline">{label}</span>
                {badge != null && badge > 0 && (
                  <span style={{ background: activeTab === id ? 'rgba(255,255,255,0.25)' : (badgeRed ? '#EF4444' : ACCENT), color: '#fff', fontSize: 11, fontWeight: 800, padding: '1px 8px', borderRadius: 99, minWidth: 20, textAlign: 'center' }}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Actions droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setShowNewOrder(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, color: '#fff', padding: '9px 16px', borderRadius: 12, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: `0 3px 12px ${ACCENT}44`, whiteSpace: 'nowrap' }}>
              <Plus style={{ width: 13, height: 13 }} />
              <span>Nouvelle commande</span>
            </button>
            <Link to="/staff/kds"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', color: TEXT, padding: '9px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700, textDecoration: 'none', border: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
              <UtensilsCrossed style={{ width: 13, height: 13 }} />
              KDS
              <ArrowRight style={{ width: 11, height: 11 }} />
            </Link>
            <NotificationBell accentColor={ACCENT} />
            <button onClick={() => void refresh()}
              style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#fff', border: `1px solid ${BORDER}`, cursor: 'pointer' }}
              title="Rafraîchir">
              <RefreshCw style={{ width: 15, height: 15, color: MUTED }} />
            </button>
            <button onClick={() => setShowPanel(true)}
              style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: `0 2px 8px ${ACCENT}55` }}
              title="Mon profil">
              {initials}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '28px 24px 80px' }}>

        {/* ════════════════════════════════════
            HERO BANNER
        ════════════════════════════════════ */}
        <div style={{ background: '#fff', borderRadius: 28, marginBottom: 24, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
            {/* Avatar + statut */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 68, height: 68, borderRadius: 22, background: ACCENT_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: ACCENT, border: `2px solid ${ACCENT}22` }}>
                {initials}
              </div>
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: isAvailable ? '#4ADE80' : '#9CA3AF', border: '2.5px solid #fff' }} />
            </div>

            {/* Salutation */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 4px' }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 900, color: TEXT, margin: '0 0 5px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Bonjour, {firstName} !
              </h1>
              <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
                {allActive.length === 0
                  ? 'Aucune commande active pour l\'instant'
                  : `${allActive.length} commande${allActive.length > 1 ? 's' : ''} active${allActive.length > 1 ? 's' : ''} · ${urgentOrders.length > 0 ? `${urgentOrders.length} urgente${urgentOrders.length > 1 ? 's' : ''}` : 'Tout sous contrôle'}`}
              </p>
            </div>

            {/* Toggle disponibilité */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: SURFACE, borderRadius: 99, padding: '4px 5px', flexShrink: 0 }}>
              <button onClick={() => setIsAvailable(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.2s', background: isAvailable ? ACCENT : 'transparent', color: isAvailable ? '#fff' : MUTED }}>
                {isAvailable && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80' }} />}
                Disponible
              </button>
              <button onClick={() => setIsAvailable(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.2s', background: !isAvailable ? '#F3F4F6' : 'transparent', color: !isAvailable ? '#6B7280' : MUTED }}>
                {!isAvailable && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D1D5DB' }} />}
                Occupé
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[
              { label: 'Actives',    value: allActive.length,      icon: Clock,     color: ACCENT },
              { label: 'Livrées',    value: completedToday.length, icon: CheckCircle, color: '#16A34A' },
              { label: 'Encaissé',   value: encaissementsToday > 0 ? `${Math.round(encaissementsToday/1000)}k` : '—', icon: Wallet, color: '#0EA5E9' },
              { label: 'B2B actifs', value: activeB2B.length,      icon: Package,   color: '#D97706' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(0,0,0,0.06)' : 'none', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <s.icon style={{ width: 14, height: 14, color: s.color, marginBottom: 6 }} />
                <p style={{ fontSize: 22, fontWeight: 900, color: TEXT, lineHeight: 1, margin: '0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize: 10, color: MUTED, margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════
            DASHBOARD TAB
        ════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <>
            {/* 4 KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 22 }}>
              <KpiCard
                icon={Clock} iconBg={ACCENT_LIGHT} iconColor={ACCENT}
                eyebrow="En cours"
                label="Commandes actives"
                value={allActive.length}
                sub={urgentOrders.length > 0 ? `${urgentOrders.length} urgente${urgentOrders.length > 1 ? 's' : ''}` : 'Tout sous contrôle'}
                subOk={urgentOrders.length === 0}
              />
              <KpiCard
                icon={Wallet} iconBg="#ECFDF5" iconColor="#10B981"
                eyebrow="Aujourd'hui"
                label="Encaissements"
                value={encaissementsToday > 0 ? formatFCFA(encaissementsToday) : '—'}
                sub={completedToday.length > 0 ? `${completedToday.length} commande${completedToday.length > 1 ? 's' : ''} livrée${completedToday.length > 1 ? 's' : ''}` : 'Aucun encaissement'}
                subOk={encaissementsToday > 0}
              />
              <KpiCard
                icon={Boxes}
                iconBg={stockAlerts.length > 0 ? '#FEF2F2' : '#ECFDF5'}
                iconColor={stockAlerts.length > 0 ? '#EF4444' : '#10B981'}
                eyebrow="Inventaire"
                label="Alertes stock"
                value={stockAlerts.length}
                sub={stockAlerts.length > 0 ? `${stockAlerts.length} article${stockAlerts.length > 1 ? 's' : ''} en rupture/faible` : 'Stocks OK'}
                subOk={stockAlerts.length === 0}
              />
              <KpiCard
                icon={Package} iconBg="#FEF3C7" iconColor="#D97706"
                eyebrow="Entreprises"
                label="B2B actifs"
                value={activeB2B.length}
                sub={activeB2B.length > 0 ? 'Commandes entreprise' : 'Aucune commande B2B'}
                subOk={activeB2B.length === 0}
              />
            </div>

            {/* Main 2-col */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>

              {/* Commandes en cours */}
              <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 11, background: ACCENT_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChefHat style={{ width: 16, height: 16, color: ACCENT }} />
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Commandes en cours</h3>
                    {allActive.length > 0 && (
                      <span style={{ background: ACCENT, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>{allActive.length}</span>
                    )}
                  </div>
                  <button onClick={() => goTab('commandes')}
                    style={{ fontSize: 12, color: ACCENT, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Vue tableau <ArrowRight style={{ width: 12, height: 12 }} />
                  </button>
                </div>

                {allActive.length === 0 ? (
                  <div style={{ padding: '56px 20px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: ACCENT_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Coffee style={{ width: 24, height: 24, color: ACCENT }} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Calme plat</p>
                    <p style={{ fontSize: 12, color: MUTED, margin: '0 0 16px' }}>Les nouvelles commandes apparaissent ici en temps réel.</p>
                    <button onClick={() => setShowNewOrder(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: `0 3px 12px ${ACCENT}44` }}>
                      <Plus style={{ width: 13, height: 13 }} /> Nouvelle commande
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {allActive.slice(0, 5).map(order => order._type === 'b2b' ? (
                      <B2BOrderCard key={order.id} order={order} onAction={updateB2BStatus} saving={savingB2BId === order.id} />
                    ) : (
                      <StaffOrderCard key={order.id} order={order} onAction={updateStatus} onPayment={registerPayment}
                        paymentDraft={paymentDrafts[order.id]}
                        setPaymentDraft={v => setPaymentDrafts(p => ({ ...p, [order.id]: v }))}
                        saving={savingOrderId === order.id} />
                    ))}
                    {allActive.length > 5 && (
                      <button onClick={() => goTab('commandes')}
                        style={{ width: '100%', padding: '12px', borderRadius: 14, border: `1px solid ${BORDER}`, background: ACCENT_LIGHT, color: ACCENT, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Voir les {allActive.length - 5} autres commandes →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <WeeklySchedule openingTime={user?.restaurant?.openingTime} closingTime={user?.restaurant?.closingTime} />

                {stockAlerts.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 20, padding: '16px', border: '1.5px solid #FECACA', boxShadow: '0 2px 12px rgba(239,68,68,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#DC2626', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle style={{ width: 15, height: 15 }} /> Alertes stock
                      </h3>
                      <button onClick={() => goTab('stocks')} style={{ fontSize: 11, color: ACCENT, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Gérer →</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {stockAlerts.slice(0, 4).map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 12, background: item.stock <= 0 ? '#FFF5F5' : '#FFFDF5', border: `1px solid ${item.stock <= 0 ? '#FECACA' : '#FDE68A'}` }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nom}</p>
                            <p style={{ fontSize: 10, color: MUTED, margin: '1px 0 0' }}>Stock : {item.stock} · Min : {item.seuil}</p>
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: item.stock <= 0 ? '#FEE2E2' : '#FEF3C7', color: item.stock <= 0 ? '#DC2626' : '#D97706', whiteSpace: 'nowrap' }}>
                            {item.stock <= 0 ? 'RUPTURE' : 'FAIBLE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(serverActivity.length > 0 || actionHistory.length > 0) && (
                  <div style={{ background: '#fff', borderRadius: 20, padding: '20px', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: ACCENT_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Activity style={{ width: 13, height: 13, color: ACCENT }} />
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Activité récente</h3>
                      </div>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {serverActivity.length > 0
                        ? serverActivity.slice(0, 8).map(entry => {
                            const c = entry.statutNouvel === 'LIVREE' ? '#16A34A' : entry.statutNouvel === 'ANNULEE' ? '#EF4444' : entry.statutNouvel === 'EN_PREP' ? '#D97706' : ACCENT;
                            return (
                              <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 11px', background: SURFACE, borderRadius: 12 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 9, background: c + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 11, fontWeight: 700, color: TEXT, margin: 0 }}>
                                    #{entry.commandeNumero || entry.commandeId?.slice(0, 8)}
                                    <span style={{ color: c, marginLeft: 5 }}>→ {STATUS_LABELS[entry.statutNouvel] || entry.statutNouvel}</span>
                                  </p>
                                  {entry.actorNom && <p style={{ fontSize: 10, color: MUTED, margin: '2px 0 0' }}>par {entry.actorNom}</p>}
                                </div>
                                <p style={{ fontSize: 9, color: '#D1D5DB', margin: 0, flexShrink: 0 }}>{timeAgo(entry.createdAt)}</p>
                              </div>
                            );
                          })
                        : actionHistory.slice(0, 5).map(entry => (
                            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: SURFACE, borderRadius: 12 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 9, background: entry.type === 'paiement' ? '#ECFDF5' : entry.type === 'commande' ? ACCENT_LIGHT : entry.type === 'b2b' ? '#FEF3C7' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.type === 'paiement' ? '#16A34A' : entry.type === 'commande' ? ACCENT : entry.type === 'b2b' ? '#D97706' : MUTED, display: 'inline-block' }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: TEXT, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</p>
                                <p style={{ fontSize: 10, color: MUTED, margin: '2px 0 0' }}>{entry.desc}</p>
                              </div>
                              <p style={{ fontSize: 9, color: '#D1D5DB', margin: 0, flexShrink: 0 }}>{timeAgo(entry.at)}</p>
                            </div>
                          ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════
            COMMANDES TAB — vue tableau KDS
        ════════════════════════════════════ */}
        {activeTab === 'commandes' && (
          <div>
            {/* Sous-filtres */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { id: 'board', label: '🎯 Tableau',  count: allActive.length  },
                { id: 'b2b',   label: '📦 B2B',      count: activeB2B.length  },
                { id: 'all',   label: '📋 Historique', count: null             },
              ].map(({ id, label, count }) => (
                <button key={id} onClick={() => setOrderFilter(id)}
                  style={{ padding: '9px 18px', borderRadius: 999, border: `1.5px solid ${orderFilter === id ? ACCENT : BORDER}`, background: orderFilter === id ? ACCENT : '#fff', color: orderFilter === id ? '#fff' : MUTED, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: orderFilter === id ? `0 4px 14px ${ACCENT}44` : 'none' }}>
                  {label}
                  {count != null && count > 0 && (
                    <span style={{ background: orderFilter === id ? 'rgba(255,255,255,0.25)' : '#F3F4F6', color: orderFilter === id ? '#fff' : TEXT, fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 99 }}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: MUTED, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                Màj auto toutes les 8s
              </span>
            </div>

            {/* Vue tableau KDS (4 colonnes) */}
            {orderFilter === 'board' && (
              allActive.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 24, padding: '64px 20px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.07)' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 18, background: ACCENT_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <ChefHat style={{ width: 24, height: 24, color: ACCENT }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Le passe est calme</p>
                  <p style={{ fontSize: 12, color: MUTED, margin: '0 0 18px' }}>Aucune commande active. Les nouvelles arrivent en temps réel.</p>
                  <button onClick={() => setShowNewOrder(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, color: '#fff', padding: '12px 24px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: `0 6px 16px ${ACCENT}44` }}>
                    <Plus style={{ width: 14, height: 14 }} /> Nouvelle commande
                  </button>
                </div>
              ) : (
                <KDSBoard
                  orders={activeOrders}
                  b2bOrders={activeB2B}
                  onAction={updateStatus}
                  onB2BAction={updateB2BStatus}
                  onPayment={registerPayment}
                  paymentDrafts={paymentDrafts}
                  setPaymentDrafts={setPaymentDrafts}
                  savingOrderId={savingOrderId}
                  savingB2BId={savingB2BId}
                />
              )
            )}

            {/* Vue liste B2B */}
            {orderFilter === 'b2b' && (
              activeB2B.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 24, padding: '64px 20px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.07)' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>Aucune commande B2B active</p>
                  <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Les commandes entreprise apparaissent ici.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeB2B.map(o => (
                    <B2BOrderCard key={o.id} order={o} onAction={updateB2BStatus} saving={savingB2BId === o.id} />
                  ))}
                </div>
              )
            )}

            {/* Vue historique */}
            {orderFilter === 'all' && (
              filteredOrders.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 24, padding: '64px 20px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.07)' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>Aucune commande</p>
                  <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Aucune commande trouvée pour cette vue.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredOrders.map(order => order._type === 'b2b' ? (
                    <B2BOrderCard key={order.id} order={order} onAction={updateB2BStatus} saving={savingB2BId === order.id} />
                  ) : (
                    <StaffOrderCard key={order.id} order={order} onAction={updateStatus} onPayment={registerPayment}
                      paymentDraft={paymentDrafts[order.id]}
                      setPaymentDraft={v => setPaymentDrafts(p => ({ ...p, [order.id]: v }))}
                      saving={savingOrderId === order.id} />
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            STOCKS TAB
        ════════════════════════════════════ */}
        {activeTab === 'stocks' && (
          <div>
            {/* 3 stat boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'Articles au menu',     value: stocks.length,                            color: ACCENT,    bg: ACCENT_LIGHT },
                { label: 'Disponibles',           value: stocks.filter(s => s.stock > s.seuil).length, color: '#16A34A', bg: '#ECFDF5' },
                { label: 'En rupture / faibles',  value: stockAlerts.length,                      color: '#DC2626', bg: '#FEF2F2' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 20, padding: '18px 22px', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: 30, fontWeight: 900, color: s.color, margin: '0 0 4px' }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Header filtre */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '16px 20px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: '0 0 2px' }}>Inventaire en temps réel</h2>
                <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
                  {stocks.length} article{stocks.length > 1 ? 's' : ''} ·{' '}
                  <span style={{ color: stockAlerts.length > 0 ? '#EF4444' : '#16A34A', fontWeight: 600 }}>
                    {stockAlerts.length} alerte{stockAlerts.length !== 1 ? 's' : ''}
                  </span>
                </p>
              </div>
              <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 12, padding: '3px', gap: 2 }}>
                {[['all', 'Tous'], ['alerts', `Alertes (${stockAlerts.length})`]].map(([key, label]) => (
                  <button key={key} onClick={() => setStockFilter(key)}
                    style={{ padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: stockFilter === key ? '#fff' : 'transparent', color: stockFilter === key ? TEXT : MUTED, boxShadow: stockFilter === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {displayedStocks.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 24, padding: '56px 20px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <CheckCircle2 style={{ width: 24, height: 24, color: '#16A34A' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>
                  {stockFilter === 'alerts' ? 'Aucune alerte stock' : 'Aucun article en stock'}
                </p>
                <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
                  {stockFilter === 'alerts' ? 'Tous les stocks sont suffisants.' : 'Configurez les stocks dans le panneau gérant.'}
                </p>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                {displayedStocks.map((item, idx) => {
                  const isRupture = item.stock <= 0;
                  const isLow     = !isRupture && item.stock <= item.seuil;
                  const pct       = item.seuil > 0 ? Math.min(100, Math.round((item.stock / (item.seuil * 3)) * 100)) : 50;
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: idx < displayedStocks.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 14, flexShrink: 0, background: isRupture ? '#FEE2E2' : isLow ? '#FEF3C7' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isRupture
                          ? <AlertTriangle style={{ width: 16, height: 16, color: '#EF4444' }} />
                          : isLow
                            ? <Flame style={{ width: 16, height: 16, color: '#D97706' }} />
                            : <CheckCircle2 style={{ width: 16, height: 16, color: '#16A34A' }} />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nom}</p>
                          {item.categorie && (
                            <span style={{ fontSize: 9, color: MUTED, background: '#F3F4F6', borderRadius: 99, padding: '2px 7px', flexShrink: 0, fontWeight: 600 }}>{item.categorie}</span>
                          )}
                        </div>
                        <div style={{ height: 5, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: isRupture ? '#EF4444' : isLow ? '#F59E0B' : '#22C55E', borderRadius: 99, transition: 'width 0.5s' }} />
                        </div>
                        <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
                          <span style={{ fontWeight: 700, color: isRupture ? '#EF4444' : isLow ? '#D97706' : TEXT }}>{item.stock}</span>
                          {' '}{item.unite || ''} en stock · seuil min {item.seuil}
                        </p>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99, flexShrink: 0, background: isRupture ? '#FEE2E2' : isLow ? '#FEF3C7' : '#ECFDF5', color: isRupture ? '#EF4444' : isLow ? '#D97706' : '#16A34A' }}>
                        {isRupture ? 'RUPTURE' : isLow ? 'FAIBLE' : 'OK'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => void adjustStock(item.id, -1, 'Correction stock')}
                          disabled={savingStockId === item.id || item.stock <= 0}
                          style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff', color: '#EF4444', cursor: item.stock <= 0 ? 'not-allowed' : 'pointer', opacity: item.stock <= 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus style={{ width: 13, height: 13 }} />
                        </button>
                        <button
                          onClick={() => void adjustStock(item.id, 1, 'Réception stock')}
                          disabled={savingStockId === item.id}
                          style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${ACCENT}44` }}>
                          <Plus style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Panel */}
      {showPanel && (
        <ProfilePanel
          user={user} onClose={() => setShowPanel(false)}
          form={form} setForm={setForm}
          onSave={handleSaveProfile} saving={savingProfile}
          error={profileError} success={profileSuccess}
        />
      )}

      {/* Nouvelle commande */}
      {showNewOrder && (
        <NewOrderModal
          restaurantId={user?.restaurant?.id || user?.restaurantId}
          onClose={() => setShowNewOrder(false)}
          onSuccess={(order) => {
            appendHistory('commande', `Commande #${order?.numero || 'nouvelle'}`, 'Créée en salle');
            pushToast(`Commande #${order?.numero || 'nouvelle'}`, 'Envoyée en cuisine', true);
            void refresh({ silent: true });
          }}
        />
      )}

      {/* Toasts */}
      <ToastList toasts={toasts} />
    </div>
  );
}
