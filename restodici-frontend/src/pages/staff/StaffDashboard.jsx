import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, CheckCircle2, ChefHat,
  CircleDollarSign, Clock, Package, RefreshCw, Save,
  ShieldCheck, User, Wallet, Truck, Calendar, Activity,
  X, Boxes, LayoutDashboard, ListOrdered, UtensilsCrossed,
  Minus, Plus, Zap, CheckCircle, Coffee, Bell, Search,
  Filter, MoreVertical, TrendingUp, DollarSign, AlertCircle,
  Settings, LogOut, Menu
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
import DispatchModal from '../../components/livraison/DispatchModal';

/* ── Palette Premium ── */
const COLORS = {
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

const STATUS_FLOW = {
  RECUE: ['CONFIRMEE'],
  CONFIRMEE: ['EN_PREP'],
  EN_PREP: ['PRETE'],
  PRETE: ['EN_LIVRAISON', 'LIVREE'],
  EN_LIVRAISON: ['LIVREE'],
  LIVREE: [],
  ANNULEE: [],
};

const ACTION_LABELS = {
  CONFIRMEE: 'Confirmer',
  EN_PREP: 'Démarrer',
  PRETE: 'Prête',
  EN_LIVRAISON: 'En livraison',
  LIVREE: 'Livrée',
};

const B2B_STATUS_FLOW = {
  EN_ATTENTE: ['CONFIRMEE'],
  CONFIRMEE: ['EN_PREPARATION'],
  EN_PREPARATION: ['LIVREE'],
  LIVREE: [],
  ANNULEE: [],
};

const B2B_STATUS_LABELS = {
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  EN_PREPARATION: 'En préparation',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
};

const B2B_ACTION_LABELS = {
  CONFIRMEE: 'Confirmer',
  EN_PREPARATION: 'Démarrer',
  LIVREE: 'Livrer',
};

const STATUS_CONFIG = {
  RECUE: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  CONFIRMEE: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  EN_PREP: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  PRETE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  EN_LIVRAISON: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  LIVREE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  ANNULEE: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  EN_ATTENTE: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' },
  EN_PREPARATION: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
};

const KDS_COLS = [
  { key: 'new', label: 'Nouvelles', dot: COLORS.primary[500], statuses: ['RECUE', 'CONFIRMEE'] },
  { key: 'prep', label: 'En préparation', dot: COLORS.warning, statuses: ['EN_PREP'] },
  { key: 'ready', label: 'Prêtes', dot: COLORS.success, statuses: ['PRETE'] },
  { key: 'deliv', label: 'En livraison', dot: COLORS.info, statuses: ['EN_LIVRAISON'] },
];

const WEEK_DAYS = [
  { init: 'LU', name: 'Lundi' },
  { init: 'MA', name: 'Mardi' },
  { init: 'ME', name: 'Mercredi' },
  { init: 'JE', name: 'Jeudi' },
  { init: 'VE', name: 'Vendredi' },
  { init: 'SA', name: 'Samedi' },
  { init: 'DI', name: 'Dimanche' },
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

/* ── Composants UI ── */

function Spinner({ size = 16, className = '' }) {
  return (
    <div className={`animate-spin ${className}`} style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full border-2 border-current border-t-transparent" style={{ color: 'currentColor' }} />
    </div>
  );
}

function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.RECUE;
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${config.bg} ${config.text} ${sizes[size]} border ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function TimerBadge({ minutesAgo }) {
  const isLate = minutesAgo >= 20;
  const isWarn = !isLate && minutesAgo >= 10;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs ${
      isLate ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' :
      isWarn ? 'bg-amber-50 text-amber-700 border border-amber-200' :
      'bg-slate-100 text-slate-600 border border-slate-200'
    }`}>
      <Clock className="w-3 h-3" />
      {minutesAgo} min
    </div>
  );
}

function KpiCard({ icon: Icon, iconBg, iconColor, eyebrow, label, value, unit, sub, subOk = true }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {eyebrow && (
            <p className="text-[10px] font-bold tracking-wider uppercase text-primary-600 mb-1">{eyebrow}</p>
          )}
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </div>
      {sub && (
        <p className={`text-xs font-semibold flex items-center gap-1 ${subOk ? 'text-emerald-600' : 'text-amber-600'}`}>
          {!subOk && <AlertTriangle className="w-3 h-3" />}
          {sub}
        </p>
      )}
    </div>
  );
}

function StaffOrderCard({ order, onAction, onPayment, paymentDraft, setPaymentDraft, saving, onDispatch }) {
  const age = order.createdAt ? Date.now() - new Date(order.createdAt).getTime() : 0;
  const minutesAgo = Math.floor(age / 60000);
  const isUrgent = age >= 15 * 60 * 1000;
  const timeStr = order.createdAt ? new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  const nextStatuses = STATUS_FLOW[order.statut] || [];
  const canCancel = order.statut === 'RECUE' && age < 5 * 60 * 1000;
  const note = order.notes || order.commentaire;
  const draft = paymentDraft || {};

  return (
    <div className={`bg-white rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
      isUrgent ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isUrgent ? 'bg-rose-100' : 'bg-primary-50'
          }`}>
            <ChefHat className={`w-5 h-5 ${isUrgent ? 'text-rose-600' : 'text-primary-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold">#{order.numero}</span>
              <StatusBadge status={order.statut} size="sm" />
              {order.modeLivraison && (
                <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-md text-xs font-semibold border border-primary-200">
                  {formatDeliveryMode(order.modeLivraison)}
                </span>
              )}
              {isUrgent && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-xs font-bold border border-rose-200">URGENT</span>}
            </div>
            <p className="font-semibold text-slate-900 text-sm truncate">
              {(order.lignes || []).map(l => l.article?.nom).filter(Boolean).join(', ') || `Commande ${order.numero}`}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Reçue à {timeStr}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <TimerBadge minutesAgo={minutesAgo} />
          <p className="text-lg font-bold text-primary-600">
            {(Number(order.montantTotal) || 0).toLocaleString('fr-FR')} <span className="text-xs text-slate-500 font-normal">FCFA</span>
          </p>
        </div>
      </div>

      {(order.lignes || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {order.lignes.slice(0, 4).map((l, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700">
              <span className="font-bold text-primary-600">{l.quantite}×</span>
              {l.article?.nom || 'Article'}
            </span>
          ))}
          {order.lignes.length > 4 && (
            <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500">
              +{order.lignes.length - 4}
            </span>
          )}
        </div>
      )}

      {note && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-amber-800 font-medium">{note}</span>
        </div>
      )}

      {!order.estPaye && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <CircleDollarSign className="w-3.5 h-3.5 text-primary-600" /> Encaissement
          </p>
          <div className="flex gap-2">
            <select
              value={draft.modePaiement || 'ESPECES'}
              onChange={e => setPaymentDraft({ ...draft, modePaiement: e.target.value })}
              className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ESPECES">Espèces</option>
              <option value="CARTE_BANCAIRE">Carte</option>
              <option value="WAVE">Wave</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="MTN_MONEY">MTN Money</option>
            </select>
            <input
              type="number"
              min="0"
              value={draft.montantRemis ?? Number(order.montantTotal)}
              onChange={e => setPaymentDraft({ ...draft, montantRemis: e.target.value })}
              className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={() => onPayment(order)}
              disabled={saving}
              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold transition-colors"
            >
              {saving ? <Spinner size={14} /> : 'OK'}
            </button>
          </div>
          {Number(draft.montantRemis) > Number(order.montantTotal) && (
            <p className="text-xs text-emerald-600 font-semibold mt-2">
              Rendu : {formatFCFA(Number(draft.montantRemis) - Number(order.montantTotal))}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {nextStatuses.map((ns, i) => (
          <button
            key={ns}
            onClick={() => onAction(order.id, ns)}
            disabled={saving}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              i === 0
                ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
                : 'bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {ACTION_LABELS[ns] || ns}
          </button>
        ))}
      </div>

      {canCancel && (
        <button
          onClick={() => onAction(order.id, 'ANNULEE')}
          disabled={saving}
          className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
      )}

      {order.modeLivraison === 'LIVRAISON' && ['PRETE','EN_LIVRAISON'].includes(order.statut) && onDispatch && (
        <button
          onClick={() => onDispatch(order)}
          className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-bold border border-primary-300 text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors flex items-center justify-center gap-1.5"
        >
          <Truck className="w-3 h-3" /> Dispatcher la livraison
        </button>
      )}
    </div>
  );
}

function B2BOrderCard({ order, onAction, saving }) {
  const age = order.createdAt ? Date.now() - new Date(order.createdAt).getTime() : 0;
  const minutesAgo = Math.floor(age / 60000);
  const isUrgent = age >= 15 * 60 * 1000;
  const timeStr = order.createdAt ? new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  const nextStatuses = B2B_STATUS_FLOW[order.statut] || [];

  return (
    <div className={`bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
      isUrgent ? 'border-amber-300' : 'border-amber-200'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-xs font-bold border border-amber-200">B2B</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold">#{order.numero}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                STATUS_CONFIG[order.statut]?.bg || 'bg-slate-100'} ${
                STATUS_CONFIG[order.statut]?.text || 'text-slate-700'} ${
                STATUS_CONFIG[order.statut]?.border || 'border-slate-200'
              }`}>
                {B2B_STATUS_LABELS[order.statut] || order.statut}
              </span>
              {isUrgent && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-xs font-bold border border-rose-200">URGENT</span>}
            </div>
            <p className="font-semibold text-slate-900 text-sm truncate">{order.entreprise || 'Entreprise B2B'}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Reçue à {timeStr}
            </p>
            {(order.dateLivraison || order.heureLivraison) && (
              <p className="text-xs text-amber-800 mt-1 flex items-center gap-1">
                <Truck className="w-3 h-3" />
                {order.dateLivraison ? new Date(order.dateLivraison).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                {order.heureLivraison ? ` à ${order.heureLivraison}` : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <TimerBadge minutesAgo={minutesAgo} />
          {order.totalEstime != null && (
            <p className="text-lg font-bold text-amber-700">
              {(Number(order.totalEstime) || 0).toLocaleString('fr-FR')} <span className="text-xs text-slate-500 font-normal">FCFA</span>
            </p>
          )}
        </div>
      </div>

      {(order.lignes || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {order.lignes.slice(0, 4).map((l, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-200 rounded-md text-xs text-amber-900 font-medium">
              <span className="font-bold">{l.quantite}×</span> {l.nomArticle || 'Article'}
            </span>
          ))}
          {order.lignes.length > 4 && (
            <span className="px-2 py-1 bg-white border border-amber-200 rounded-md text-xs text-slate-500">
              +{order.lignes.length - 4}
            </span>
          )}
        </div>
      )}

      {nextStatuses.length > 0 && (
        <div className="flex gap-2">
          {nextStatuses.map((ns, i) => (
            <button
              key={ns}
              onClick={() => onAction(order.id, ns)}
              disabled={saving}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                i === 0
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                  : 'bg-white border-2 border-amber-600 text-amber-600 hover:bg-amber-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {B2B_ACTION_LABELS[ns] || ns}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function KDSBoard({ orders, b2bOrders, onAction, onB2BAction, onPayment, paymentDrafts, setPaymentDrafts, savingOrderId, savingB2BId, onDispatch }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {KDS_COLS.map(col => {
        const colOrders = orders
          .filter(o => col.statuses.includes(o.statut))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const colB2B = b2bOrders
          .filter(o => col.statuses.some(s => s === o.statut || (s === 'RECUE' && o.statut === 'EN_ATTENTE') || (s === 'EN_PREP' && o.statut === 'EN_PREPARATION')))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const total = colOrders.length + colB2B.length;

        return (
          <div key={col.key} className="bg-slate-100 rounded-2xl p-3 min-h-[400px]">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.dot }} />
                {col.label}
              </div>
              <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                {total}
              </span>
            </div>
            <div className="space-y-3">
              {colOrders.map(o => (
                <StaffOrderCard
                  key={o.id}
                  order={o}
                  onAction={onAction}
                  onPayment={onPayment}
                  paymentDraft={paymentDrafts[o.id]}
                  setPaymentDraft={v => setPaymentDrafts(p => ({ ...p, [o.id]: v }))}
                  saving={savingOrderId === o.id}
                  onDispatch={onDispatch}
                />
              ))}
              {colB2B.map(o => (
                <B2BOrderCard
                  key={o.id}
                  order={o}
                  onAction={onB2BAction}
                  saving={savingB2BId === o.id}
                />
              ))}
              {total === 0 && (
                <div className="text-center py-8 px-3 bg-white/50 rounded-xl border-2 border-dashed border-slate-300">
                  <ChefHat className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Aucune commande</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklySchedule({ openingTime, closingTime }) {
  const todayIdx = (new Date().getDay() + 6) % 7;
  const week = buildWeek(openingTime, closingTime);
  const inService = isInService(openingTime, closingTime);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Planning</h3>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${inService ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span className={`text-xs font-semibold ${inService ? 'text-emerald-600' : 'text-slate-500'}`}>
              {inService ? 'Ouvert' : 'Fermé'}
            </span>
          </div>
        </div>
        <Calendar className="w-4 h-4 text-slate-400" />
      </div>
      <div className="space-y-2">
        {week.map((day, i) => {
          const isToday = i === todayIdx;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isToday ? 'bg-primary-50 border border-primary-200' : 'hover:bg-slate-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                isToday ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {day.init}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${isToday ? 'text-primary-900' : 'text-slate-700'}`}>
                  {day.name}
                </p>
                <p className={`text-[10px] truncate ${day.rest ? 'text-rose-500' : 'text-slate-500'}`}>
                  {day.hours}
                </p>
              </div>
              {isToday && <span className={`w-2 h-2 rounded-full ${inService ? 'bg-emerald-500' : 'bg-amber-500'}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToastList({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="bg-white rounded-xl p-4 shadow-2xl border border-slate-200 min-w-[300px] max-w-md animate-[slideIn_0.3s_ease-out] pointer-events-auto"
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              t.ok ? 'bg-emerald-50' : 'bg-primary-50'
            }`}>
              {t.ok ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <UtensilsCrossed className="w-5 h-5 text-primary-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 mb-0.5">{t.title}</p>
              <p className="text-xs text-slate-600">{t.msg}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StaffDashboard() {
  const { user, syncUser, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get('tab') || 'dashboard';
  const goTab = (id) => navigate(id === 'dashboard' ? '/staff' : `/staff?tab=${id}`);

  const [showPanel, setShowPanel] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [orders, setOrders] = useState([]);
  const [b2bOrders, setB2bOrders] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [stockFilter, setStockFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('board');
  const [loading, setLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState('');
  const [savingB2BId, setSavingB2BId] = useState('');
  const [savingStockId, setSavingStockId] = useState('');
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [actionHistory, setActionHistory] = useState([]);
  const [serverActivity, setServerActivity] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '' });
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const pushToast = useCallback((title, msg, ok = false) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, title, msg, ok }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

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
      try { localStorage.setItem(historyKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [historyKey]);

  const loadActivity = useCallback(async () => {
    try {
      const res = await commandesService.getRestaurantActivity(20);
      setServerActivity(Array.isArray(res.data) ? res.data : []);
    } catch {}
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
    } catch {}
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
  }, []);

  const userId = user?.id;
  const restaurantId = user?.restaurant?.id;
  const userRole = user?.role;

  useEffect(() => {
    if (!userId) return;
    const poll = setInterval(() => void refresh({ silent: true }), 8000);
    const socket = createCommandesSocket({ id: userId, role: userRole, restaurant: restaurantId ? { id: restaurantId } : undefined });

    socket.on('commande.nouvelle', p => {
      appendHistory('commande', `Commande #${p?.numero || ''}`, 'Nouvelle commande reçue');
      pushToast(`Commande #${p?.numero || ''}`, 'Nouvelle commande arrivée', true);
      void refresh({ silent: true });
    });
    socket.on('commande.statut', p => {
      appendHistory('statut', `#${p?.numero || ''} mis à jour`, `→ ${STATUS_LABELS[p?.statut] || p?.statut || '?'}`);
      void refresh({ silent: true });
    });
    socket.on('commande.paiement', p => {
      appendHistory('paiement', `Paiement #${p?.numero || ''}`, 'Encaissement validé');
      pushToast(`Paiement #${p?.numero || ''}`, 'Encaissement confirmé', true);
      void refresh({ silent: true });
    });
    socket.on('commande.b2b.nouvelle', p => {
      appendHistory('b2b', `B2B #${p?.numero || ''}`, p?.entreprise || 'Commande B2B');
      pushToast(`B2B #${p?.numero || ''}`, p?.entreprise || 'Commande entreprise', true);
      void refresh({ silent: true });
    });
    socket.on('commande.b2b.statut', () => void refresh({ silent: true }));
    socket.on('reconnect', () => void refresh({ silent: true }));

    return () => { clearInterval(poll); socket.disconnect(); };
  }, [appendHistory, pushToast, refresh, userId, restaurantId, userRole]);

  const activeOrders = useMemo(() => orders.filter(o => ['RECUE','CONFIRMEE','EN_PREP','PRETE','EN_LIVRAISON'].includes(o.statut)), [orders]);
  const urgentOrders = useMemo(() => activeOrders.filter(o => o.createdAt && Date.now() - new Date(o.createdAt).getTime() >= 15 * 60 * 1000), [activeOrders]);
  const todayStr = useMemo(() => new Date().toDateString(), []);
  const completedToday = useMemo(() => orders.filter(o => o.statut === 'LIVREE' && new Date(o.updatedAt || o.createdAt).toDateString() === todayStr), [orders, todayStr]);
  const encaissementsToday = useMemo(() => completedToday.reduce((s, o) => s + Number(o.montantTotal || 0), 0), [completedToday]);
  const activeB2B = useMemo(() => b2bOrders.filter(o => !['LIVREE','ANNULEE'].includes(o.statut)), [b2bOrders]);
  const allActive = useMemo(() => [...activeOrders.map(o => ({ ...o, _type: 'client' })), ...activeB2B.map(o => ({ ...o, _type: 'b2b' }))].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)), [activeOrders, activeB2B]);
  const stockAlerts = useMemo(() => stocks.filter(s => s.stock <= s.seuil), [stocks]);
  const displayedStocks = useMemo(() => stockFilter === 'alerts' ? stockAlerts : stocks, [stocks, stockAlerts, stockFilter]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'board') return allActive;
    if (orderFilter === 'b2b') return activeB2B.map(o => ({ ...o, _type: 'b2b' }));
    return [...activeOrders.map(o => ({ ...o, _type: 'client' })), ...completedToday.map(o => ({ ...o, _type: 'client' })), ...b2bOrders.map(o => ({ ...o, _type: 'b2b' }))].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orderFilter, allActive, activeB2B, activeOrders, completedToday, b2bOrders]);

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
    } catch (err) { setProfileError(err?.response?.data?.message || 'Erreur'); }
    finally { setSavingProfile(false); }
  };

  const initials = ((user?.prenom?.[0] ?? '') + (user?.nom?.[0] ?? '')).toUpperCase() || 'S';
  const firstName = user?.prenom || user?.nom || 'vous';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'commandes', label: 'Commandes', icon: ListOrdered, badge: allActive.length || undefined },
    { id: 'stocks', label: 'Stocks', icon: Boxes, badge: stockAlerts.length || undefined, badgeRed: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <OnboardingWizard />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-tight">Resto d'ici</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Espace Staff</p>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {TABS.map(({ id, label, icon: Icon, badge, badgeRed }) => (
                <button
                  key={id}
                  onClick={() => goTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === id
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {badge != null && badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      activeTab === id ? 'bg-primary-200 text-primary-800' : badgeRed ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewOrder(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                Nouvelle
              </button>
              <Link
                to="/staff/kds"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
              >
                <UtensilsCrossed className="w-4 h-4" />
                KDS
              </Link>
              <NotificationBell accentColor={COLORS.primary[600]} />
              <button
                onClick={() => void refresh()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setShowPanel(true)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold text-sm flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
              >
                {initials}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Hero */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-2xl font-bold text-primary-700 border-2 border-primary-300">
                      {initials}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">
                      {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Bonjour, {firstName} !</h1>
                    <p className="text-sm text-slate-600">
                      {allActive.length === 0
                        ? 'Aucune commande active pour le moment'
                        : `${allActive.length} commande${allActive.length > 1 ? 's' : ''} active${allActive.length > 1 ? 's' : ''} · ${urgentOrders.length > 0 ? `${urgentOrders.length} urgente${urgentOrders.length > 1 ? 's' : ''}` : 'Tout sous contrôle'}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1">
                  <button
                    onClick={() => setIsAvailable(true)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      isAvailable ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Disponible
                  </button>
                  <button
                    onClick={() => setIsAvailable(false)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      !isAvailable ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Occupé
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
                {[
                  { label: 'Actives', value: allActive.length, icon: Clock, color: 'text-primary-600', bg: 'bg-primary-50' },
                  { label: 'Livrées', value: completedToday.length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Encaissé', value: encaissementsToday > 0 ? `${Math.round(encaissementsToday/1000)}k` : '—', icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'B2B actifs', value: activeB2B.length, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-white border border-slate-200">
                    <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                    <p className="text-2xl font-bold text-slate-900 mb-0.5">{stat.value}</p>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={Clock}
                iconBg="bg-primary-50"
                iconColor={COLORS.primary[600]}
                eyebrow="En cours"
                label="Commandes actives"
                value={allActive.length}
                sub={urgentOrders.length > 0 ? `${urgentOrders.length} urgente${urgentOrders.length > 1 ? 's' : ''}` : 'Tout sous contrôle'}
                subOk={urgentOrders.length === 0}
              />
              <KpiCard
                icon={Wallet}
                iconBg="bg-emerald-50"
                iconColor={COLORS.success}
                eyebrow="Aujourd'hui"
                label="Encaissements"
                value={encaissementsToday > 0 ? formatFCFA(encaissementsToday) : '—'}
                sub={completedToday.length > 0 ? `${completedToday.length} livrée${completedToday.length > 1 ? 's' : ''}` : 'Aucun encaissement'}
                subOk={encaissementsToday > 0}
              />
              <KpiCard
                icon={Boxes}
                iconBg={stockAlerts.length > 0 ? 'bg-rose-50' : 'bg-emerald-50'}
                iconColor={stockAlerts.length > 0 ? COLORS.danger : COLORS.success}
                eyebrow="Inventaire"
                label="Alertes stock"
                value={stockAlerts.length}
                sub={stockAlerts.length > 0 ? `${stockAlerts.length} article${stockAlerts.length > 1 ? 's' : ''} en alerte` : 'Stocks OK'}
                subOk={stockAlerts.length === 0}
              />
              <KpiCard
                icon={Package}
                iconBg="bg-amber-50"
                iconColor={COLORS.warning}
                eyebrow="Entreprises"
                label="B2B actifs"
                value={activeB2B.length}
                sub={activeB2B.length > 0 ? 'Commandes entreprise' : 'Aucune commande B2B'}
                subOk={activeB2B.length === 0}
              />
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                        <ChefHat className="w-4 h-4 text-primary-600" />
                      </div>
                      <h3 className="font-bold text-slate-900">Commandes en cours</h3>
                      {allActive.length > 0 && (
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-md text-xs font-bold">{allActive.length}</span>
                      )}
                    </div>
                    <button
                      onClick={() => goTab('commandes')}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      Voir tout <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {allActive.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                        <Coffee className="w-8 h-8 text-primary-400" />
                      </div>
                      <p className="font-semibold text-slate-900 mb-1">Calme plat</p>
                      <p className="text-sm text-slate-600 mb-4">Les nouvelles commandes apparaissent ici en temps réel.</p>
                      <button
                        onClick={() => setShowNewOrder(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Nouvelle commande
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {allActive.slice(0, 4).map(order => order._type === 'b2b' ? (
                        <B2BOrderCard key={order.id} order={order} onAction={updateB2BStatus} saving={savingB2BId === order.id} />
                      ) : (
                        <StaffOrderCard
                          key={order.id}
                          order={order}
                          onAction={updateStatus}
                          onPayment={registerPayment}
                          paymentDraft={paymentDrafts[order.id]}
                          setPaymentDraft={v => setPaymentDrafts(p => ({ ...p, [order.id]: v }))}
                          saving={savingOrderId === order.id}
                          onDispatch={setDispatchOrder}
                        />
                      ))}
                      {allActive.length > 4 && (
                        <button
                          onClick={() => goTab('commandes')}
                          className="w-full py-2.5 text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        >
                          Voir les {allActive.length - 4} autres commandes →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <WeeklySchedule openingTime={user?.restaurant?.openingTime} closingTime={user?.restaurant?.closingTime} />
                
                {stockAlerts.length > 0 && (
                  <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-rose-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Alertes stock
                      </h3>
                      <button onClick={() => goTab('stocks')} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                        Gérer →
                      </button>
                    </div>
                    <div className="space-y-2">
                      {stockAlerts.slice(0, 3).map(item => (
                        <div key={item.id} className={`p-3 rounded-lg border ${item.stock <= 0 ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900 truncate flex-1">{item.nom}</p>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${item.stock <= 0 ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}`}>
                              {item.stock <= 0 ? 'RUPTURE' : 'FAIBLE'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">Stock: {item.stock} / Min: {item.seuil}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(serverActivity.length > 0 || actionHistory.length > 0) && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-primary-600" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">Activité récente</h3>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      {serverActivity.length > 0
                        ? serverActivity.slice(0, 5).map(entry => {
                            const color = entry.statutNouvel === 'LIVREE' ? 'emerald' : entry.statutNouvel === 'ANNULEE' ? 'rose' : entry.statutNouvel === 'EN_PREP' ? 'amber' : 'primary';
                            return (
                              <div key={entry.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50">
                                <div className={`w-7 h-7 rounded-md bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
                                  <span className={`w-2 h-2 rounded-full bg-${color}-500`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-900 truncate">
                                    #{entry.commandeNumero || entry.commandeId?.slice(0, 8)}
                                    <span className={`text-${color}-600 ml-1`}>→ {STATUS_LABELS[entry.statutNouvel] || entry.statutNouvel}</span>
                                  </p>
                                  {entry.actorNom && <p className="text-[10px] text-slate-500">par {entry.actorNom}</p>}
                                </div>
                                <p className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(entry.createdAt)}</p>
                              </div>
                            );
                          })
                        : actionHistory.slice(0, 4).map(entry => (
                            <div key={entry.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50">
                              <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                                entry.type === 'paiement' ? 'bg-emerald-100' : entry.type === 'commande' ? 'bg-primary-100' : entry.type === 'b2b' ? 'bg-amber-100' : 'bg-slate-200'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                  entry.type === 'paiement' ? 'bg-emerald-500' : entry.type === 'commande' ? 'bg-primary-500' : entry.type === 'b2b' ? 'bg-amber-500' : 'bg-slate-500'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">{entry.title}</p>
                                <p className="text-[10px] text-slate-500">{entry.desc}</p>
                              </div>
                              <p className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(entry.at)}</p>
                            </div>
                          ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'commandes' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {[
                { id: 'board', label: 'Tableau', count: allActive.length },
                { id: 'b2b', label: 'B2B', count: activeB2B.length },
                { id: 'all', label: 'Historique', count: null },
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setOrderFilter(id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    orderFilter === id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {label}
                  {count != null && count > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      orderFilter === id ? 'bg-white/20' : 'bg-slate-200'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
              <span className="ml-auto text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Màj auto 8s
              </span>
            </div>

            {orderFilter === 'board' && (
              allActive.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <ChefHat className="w-8 h-8 text-primary-400" />
                  </div>
                  <p className="font-semibold text-slate-900 mb-1">Le passe est calme</p>
                  <p className="text-sm text-slate-600 mb-4">Aucune commande active.</p>
                  <button
                    onClick={() => setShowNewOrder(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Nouvelle commande
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
                  onDispatch={setDispatchOrder}
                />
              )
            )}

            {orderFilter === 'b2b' && (
              activeB2B.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                  <p className="font-semibold text-slate-900 mb-1">Aucune commande B2B active</p>
                  <p className="text-sm text-slate-600">Les commandes entreprise apparaissent ici.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeB2B.map(o => (
                    <B2BOrderCard key={o.id} order={o} onAction={updateB2BStatus} saving={savingB2BId === o.id} />
                  ))}
                </div>
              )
            )}

            {orderFilter === 'all' && (
              filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                  <p className="font-semibold text-slate-900 mb-1">Aucune commande</p>
                  <p className="text-sm text-slate-600">Aucune commande trouvée.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredOrders.map(order => order._type === 'b2b' ? (
                    <B2BOrderCard key={order.id} order={order} onAction={updateB2BStatus} saving={savingB2BId === order.id} />
                  ) : (
                    <StaffOrderCard
                      key={order.id}
                      order={order}
                      onAction={updateStatus}
                      onPayment={registerPayment}
                      paymentDraft={paymentDrafts[order.id]}
                      setPaymentDraft={v => setPaymentDrafts(p => ({ ...p, [order.id]: v }))}
                      saving={savingOrderId === order.id}
                      onDispatch={setDispatchOrder}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'stocks' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Articles', value: stocks.length, color: 'text-primary-600', bg: 'bg-primary-50' },
                { label: 'Disponibles', value: stocks.filter(s => s.stock > s.seuil).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'En alerte', value: stockAlerts.length, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                  <p className="text-sm font-semibold text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Inventaire</h2>
                  <p className="text-sm text-slate-600">
                    {stocks.length} article{stocks.length > 1 ? 's' : ''}{' '}
                    <span className={stockAlerts.length > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                      {stockAlerts.length} alerte{stockAlerts.length !== 1 ? 's' : ''}
                    </span>
                  </p>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {[
                    ['all', 'Tous'],
                    ['alerts', `Alertes (${stockAlerts.length})`],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setStockFilter(key)}
                      className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                        stockFilter === key
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {displayedStocks.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                  <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 mb-1">Aucun article</p>
                  <p className="text-sm text-slate-600">
                    {stockFilter === 'alerts' ? 'Tous les stocks sont OK.' : 'Les articles apparaîtront ici.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedStocks.map((item, idx) => {
                    const isRupture = item.stock <= 0;
                    const isLow = !isRupture && item.stock <= item.seuil;
                    const pct = item.seuil > 0 ? Math.min(100, Math.round((item.stock / (item.seuil * 3)) * 100)) : 50;
                    return (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow">
                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isRupture ? 'bg-rose-100' : isLow ? 'bg-amber-100' : 'bg-emerald-100'
                        }`}>
                          {isRupture ? (
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                          ) : isLow ? (
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="font-semibold text-slate-900 truncate">{item.nom}</p>
                            {item.categorie && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                                {item.categorie}
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                            <div
                              className={`h-full rounded-full transition-all ${isRupture ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-600">
                            <span className={`font-bold ${isRupture ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                              {item.stock}
                            </span>{' '}
                            {item.unite || ''} en stock · seuil {item.seuil}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                          isRupture ? 'bg-rose-100 text-rose-700' : isLow ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isRupture ? 'RUPTURE' : isLow ? 'FAIBLE' : 'OK'}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => void adjustStock(item.id, -1, 'Correction')}
                            disabled={savingStockId === item.id || item.stock <= 0}
                            className="w-8 h-8 rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="w-4 h-4 text-rose-600" />
                          </button>
                          <button
                            onClick={() => void adjustStock(item.id, 1, 'Réception')}
                            disabled={savingStockId === item.id}
                            className="w-8 h-8 rounded-lg bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPanel(false)} />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-xl font-bold text-primary-700 border-2 border-primary-300">
                    {initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{[user?.prenom, user?.nom].filter(Boolean).join(' ') || 'Mon Profil'}</p>
                    <p className="text-sm text-slate-600">{user?.email}</p>
                  </div>
                </div>
                <button onClick={() => setShowPanel(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Prénom</label>
                    <input
                      type="text"
                      value={form.prenom}
                      onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nom</label>
                    <input
                      type="text"
                      value={form.nom}
                      onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Kouassi"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="jean@staff.ci"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Téléphone</label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+225 07 00 00 00"
                  />
                </div>
                {profileError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 font-medium">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
                    {profileSuccess}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {savingProfile ? <><Spinner size={16} /> Enregistrement...</> : <><Save className="w-4 h-4" /> Enregistrer</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

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

      {dispatchOrder && (
        <DispatchModal
          commande={dispatchOrder}
          onClose={() => setDispatchOrder(null)}
          onDispatched={() => { setDispatchOrder(null); void refresh({ silent: true }); }}
        />
      )}

      <ToastList toasts={toasts} />
    </div>
  );
}