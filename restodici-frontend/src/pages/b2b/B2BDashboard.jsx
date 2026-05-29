import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Users, FileText, Settings,
  Plus, X, RefreshCw, AlertCircle, UtensilsCrossed, Download,
  ArrowRight, Wallet, Package, TrendingDown, CalendarDays,
  Bell, CheckCircle, Trash2, Send, Menu, LogOut, Star, MapPin,
  Activity, Clock,
} from 'lucide-react';
import { b2bAPI, authAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { createCommandesSocket, commandesService } from '../../services/commandes.service';
import SecurityPanel from '../../components/security/SecurityPanel';
import { formatFCFA } from '../../utils/formatters';
import B2BOnboardingWizard from './B2BOnboardingWizard';

// ── Design tokens ──────────────────────────────────────────────────────────────
const A   = '#C05015';
const AL  = '#FBE8DC';
const SF  = '#F9F7F5';
const BD  = 'rgba(89,67,42,0.10)';
const SIDEBAR_BG = '#181A20';
const SIDEBAR_ACTIVE = '#C05015';

// ── Cache ──────────────────────────────────────────────────────────────────────
const cacheKey = (uid) => uid ? `b2b_v3:${uid}` : 'b2b_v3';
const readCache = (uid) => {
  try {
    const raw = localStorage.getItem(cacheKey(uid));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < 10 * 60 * 1000) return data;
  } catch { /* ignore */ }
  return null;
};
const writeCache = (uid, data) => {
  try { localStorage.setItem(cacheKey(uid), JSON.stringify({ data, ts: Date.now() })); }
  catch { /* ignore */ }
};

// ── Status ─────────────────────────────────────────────────────────────────────
const STATUS = {
  EN_ATTENTE:     { label: 'En attente',     color: '#D97706', bg: '#FFFBEB' },
  RECUE:          { label: 'Reçue',          color: '#2563EB', bg: '#EFF6FF' },
  CONFIRMEE:      { label: 'Confirmée',      color: '#16A34A', bg: '#F0FDF4' },
  EN_PREP:        { label: 'En préparation', color: '#B45309', bg: '#FEF3C7' },
  EN_PREPARATION: { label: 'En préparation', color: '#B45309', bg: '#FEF3C7' },
  PRETE:          { label: 'Prête',          color: '#15803D', bg: '#F0FDF4' },
  EN_LIVRAISON:   { label: 'En livraison',   color: '#2563EB', bg: '#EFF6FF' },
  LIVREE:         { label: 'Livrée ✓',       color: '#15803D', bg: '#F0FDF4' },
  ANNULEE:        { label: 'Annulée',        color: '#E11D48', bg: '#FFF1F2' },
};
const ACTIVE = ['EN_ATTENTE','RECUE','CONFIRMEE','EN_PREP','EN_PREPARATION','PRETE','EN_LIVRAISON'];

// ── Petits composants ──────────────────────────────────────────────────────────
function Avatar({ name = '', size = 34, light = false }) {
  const ini = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.36,
        background: light ? '#2C2F3A' : AL, color: light ? '#fff' : A,
      }}>
      {ini}
    </div>
  );
}

function StatusBadge({ statut }) {
  const s = STATUS[statut] || { label: statut, color: '#6B7280', bg: '#F3F4F6' };
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function BudgetBar({ spent, budget }) {
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const bar  = pct > 80 ? '#EF4444' : pct > 60 ? '#F97316' : '#16A34A';
  return (
    <div>
      <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-1">
        <span>{formatFCFA(spent)} FCFA</span>
        <span className="font-bold" style={{ color: pct > 80 ? '#EF4444' : '#6B7280' }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: bar }} />
      </div>
    </div>
  );
}

// ── Modal invitation collaborateur ────────────────────────────────────────────
function InviteModal({ onClose, onSave }) {
  const [form, setForm] = useState({ nom: '', email: '', budgetMensuel: '', poste: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.nom || !form.email) { setErr('Nom et email requis'); return; }
    setSaving(true);
    setErr('');
    try {
      await onSave(form);
      setSent(true);
    } catch (e) {
      setErr(e.response?.data?.message || "Erreur lors de l'invitation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BD }}>
          <h3 className="font-extrabold text-[#111827]">Inviter un collaborateur</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6]">
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <p className="font-bold text-[#111827]">Invitation envoyée !</p>
            <p className="text-sm text-[#6B7280]">
              Un email d'invitation a été envoyé à <strong>{form.email}</strong>.<br />
              Le collaborateur devra cliquer sur le lien pour activer son compte.
            </p>
            <button onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: A }}>
              Fermer
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {[
              { k: 'nom',           label: 'Nom complet *',         type: 'text',   ph: 'Jean Konan' },
              { k: 'email',         label: 'Email professionnel *',  type: 'email',  ph: 'jean@entreprise.ci' },
              { k: 'poste',         label: 'Poste',                  type: 'text',   ph: 'Directeur commercial' },
              { k: 'budgetMensuel', label: 'Budget mensuel (FCFA)',   type: 'number', ph: '50000' },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">{f.label}</label>
                <input type={f.type} value={form[f.k]} placeholder={f.ph} onChange={set(f.k)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ background: SF, border: `1px solid ${BD}` }} />
              </div>
            ))}
            {err && <p className="text-xs text-red-500 font-semibold">{err}</p>}
            <p className="text-[11px] text-[#9CA3AF]">
              Un email d'invitation sera envoyé. Le collaborateur devra l'accepter pour activer son compte.
            </p>
            <button onClick={submit} disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition"
              style={{ background: A, opacity: saving ? 0.7 : 1 }}>
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? 'Envoi en cours…' : "Envoyer l'invitation par email"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard principal ────────────────────────────────────────────────────────
export default function B2BDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const uid   = user?.id;
  const cached = readCache(uid);

  const [tab, setTab]               = useState('overview');
  const [sideOpen, setSideOpen]     = useState(false);
  const [dashboard, setDashboard]   = useState(cached?.dashboard || null);
  const [compte, setCompte]         = useState(cached?.compte || null);
  const [collabs, setCollabs]       = useState(cached?.collabs || []);
  const [orders, setOrders]         = useState(cached?.orders || []);
  const [factures, setFactures]     = useState(cached?.factures || []);
  const [loading, setLoading]       = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [orderFilter, setOrderFilter]       = useState('all');
  const [profileForm, setProfileForm]       = useState({ nom: user?.nom || '', email: user?.email || '', telephone: user?.telephone || '' });
  const [profileMsg, setProfileMsg]         = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications]   = useState([]);
  const [selectedOrder, setSelectedOrder]   = useState(null);
  const [avisForm, setAvisForm]             = useState({ note: 0, commentaire: '' });
  const [avisSubmitting, setAvisSubmitting] = useState(false);
  const [avisMsg, setAvisMsg]               = useState('');
  const [showWizard, setShowWizard]         = useState(false);
  const [auditLogs, setAuditLogs]           = useState([]);
  const [auditLoading, setAuditLoading]     = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError('');
    try {
      const [dashR, collabR, ordersR, menuR, factR] = await Promise.allSettled([
        b2bAPI.getDashboard(),
        b2bAPI.getCollaborateurs(),
        b2bAPI.getOrders(),
        commandesService.getMyOrders(),
        b2bAPI.getFacturesMensuelles(),
      ]);
      const newDash    = dashR.status    === 'fulfilled' ? dashR.value.data           : dashboard;
      const newCollabs = collabR.status  === 'fulfilled' ? (collabR.value.data || []) : collabs;
      const b2bOrds    = ordersR.status  === 'fulfilled' ? (ordersR.value.data || []) : [];
      const menuOrds   = menuR.status    === 'fulfilled'
        ? (menuR.value.data || []).map(o => ({ ...o, _src: 'menu' })) : [];
      const merged     = [...b2bOrds, ...menuOrds].sort(
        (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0),
      );
      const newFact    = factR.status === 'fulfilled' ? (factR.value.data || []) : factures;

      if (dashR.status    === 'fulfilled') setDashboard(newDash);
      if (collabR.status  === 'fulfilled') setCollabs(newCollabs);
      setOrders(merged);
      if (factR.status    === 'fulfilled') setFactures(newFact);

      let newCompte = compte;
      try { const r = await b2bAPI.getCompte(); newCompte = r.data; setCompte(newCompte); } catch { /* no compte yet */ }

      writeCache(uid, { dashboard: newDash, collabs: newCollabs, orders: merged, factures: newFact, compte: newCompte });
    } catch {
      setError('Erreur de chargement. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(!!readCache(uid)); }, [loadData, uid]);

  useEffect(() => {
    if (user) setProfileForm({ nom: user.nom || '', email: user.email || '', telephone: user.telephone || '' });
  }, [user?.nom, user?.email, user?.telephone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    const socket = createCommandesSocket(user);
    const refresh = () => loadData(true);
    ['commande.creee','commande.nouvelle','commande.statut','commande.b2b.nouvelle','commande.b2b.statut']
      .forEach(ev => socket.on(ev, refresh));
    return () => { socket.disconnect(); };
  }, [user, loadData]);

  useEffect(() => {
    if (tab !== 'historique') return;
    setAuditLoading(true);
    b2bAPI.getAuditLogs()
      .then(res => setAuditLogs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAuditLogs([]))
      .finally(() => setAuditLoading(false));
  }, [tab]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleInvite = async (form) => {
    await b2bAPI.createCollaborateur({
      nom: form.nom, email: form.email, poste: form.poste,
      budgetMensuel: form.budgetMensuel ? parseFloat(form.budgetMensuel) : undefined,
    });
    await loadData(true);
  };

  const handleDeleteCollab = async (id) => {
    if (!confirm('Supprimer ce collaborateur ?')) return;
    try { await b2bAPI.deleteCollaborateur(id); await loadData(true); } catch { /* ignore */ }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await authAPI.updateProfile(profileForm);
      setProfileMsg('Profil mis à jour !');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch { setProfileMsg('Erreur lors de la mise à jour'); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────────
  const activeOrders  = orders.filter(o => ACTIVE.includes(o.statut ?? o.status ?? ''));
  const doneOrders    = orders.filter(o => ['LIVREE','ANNULEE'].includes(o.statut ?? o.status ?? ''));
  const displayed     = orderFilter === 'active' ? activeOrders : orderFilter === 'done' ? doneOrders : orders;
  const monthlyExp    = dashboard?.monthlyExpenses || 0;
  const budgetTotal   = compte?.budgetMensuel || dashboard?.budgetMensuel || 0;
  const budgetPct     = budgetTotal > 0 ? Math.min(100, Math.round((monthlyExp / budgetTotal) * 100)) : 0;
  const budgetBar     = budgetPct > 80 ? '#EF4444' : budgetPct > 60 ? '#F97316' : '#16A34A';
  const upcoming      = orders.filter(o => ['EN_ATTENTE','CONFIRMEE'].includes(o.statut ?? o.status ?? '')).slice(0, 4);

  // ── Collect WebSocket notifications ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const socket = createCommandesSocket(user);
    const addNotif = (data) => {
      const msg = data.statut
        ? `Commande ${data.numero || ''} → ${data.statut}`
        : `Nouvelle commande ${data.numero || ''}`;
      setNotifications(prev => [
        { id: Date.now(), msg, ts: new Date(), read: false },
        ...prev.slice(0, 49),
      ]);
    };
    ['commande.b2b.nouvelle', 'commande.b2b.statut', 'commande.creee', 'commande.statut']
      .forEach(ev => socket.on(ev, addNotif));
    return () => { socket.disconnect(); };
  }, [user]);

  useEffect(() => {
    if (!loading && compte === null && uid && !localStorage.getItem(`b2b_onboarded_${uid}`)) {
      setShowWizard(true);
    }
  }, [loading, compte, uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  // ── Navigation ────────────────────────────────────────────────────────────────
  const NAV = [
    { key: 'overview',       label: 'Dashboard',      icon: LayoutDashboard },
    { key: 'orders',         label: 'Commandes',      icon: ShoppingBag,  badge: activeOrders.length },
    { key: 'collaborateurs', label: 'Équipe',          icon: Users,        badge: collabs.length },
    { key: 'factures',       label: 'Facturation',    icon: FileText },
    { key: 'historique',     label: 'Historique',     icon: Activity },
    { key: 'notifications',  label: 'Notifications',  icon: Bell,         badge: unreadCount },
    { key: 'settings',       label: 'Paramètres',     icon: Settings },
  ];

  const goTo = (key) => { setTab(key); setSideOpen(false); };

  // ── Sidebar ───────────────────────────────────────────────────────────────────
  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full`} style={{ background: SIDEBAR_BG }}>
      {/* Logo — identique au login */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: A }}>
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-bold text-white text-base">Resto d'ici</p>
          <p className="text-[10px] text-white/40 font-semibold tracking-widest uppercase">Entreprise</p>
        </div>
        {mobile && (
          <button onClick={() => setSideOpen(false)} className="ml-auto text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button key={item.key} onClick={() => goTo(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: active ? SIDEBAR_ACTIVE : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.5)',
              }}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={{ background: active ? 'rgba(255,255,255,0.25)' : A, color: '#fff' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: user + logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar name={user?.nom || 'B2B'} size={34} light />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.nom || 'Gestionnaire'}</p>
            <p className="text-[10px] text-white/40 truncate">{compte?.raisonSociale || 'Entreprise B2B'}</p>
          </div>
          <button onClick={() => setShowLogoutModal(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-red-400 transition"
            title="Déconnexion">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: SF }}>

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-56 shrink-0 h-full">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ──────────────────────────────────────────── */}
      {sideOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-56 h-full"><Sidebar mobile /></div>
          <div className="flex-1 bg-black/40" onClick={() => setSideOpen(false)} />
        </div>
      )}

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b shrink-0" style={{ borderColor: BD }}>
          <div className="h-14 px-4 lg:px-6 flex items-center gap-3">
            <button className="lg:hidden text-[#6B7280]" onClick={() => setSideOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#9CA3AF]">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h1 className="text-sm font-extrabold text-[#111827] leading-none">
                Bonjour, {user?.prenom || user?.nom?.split(' ')[0] || 'Gestionnaire'} 👋
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => loadData(true)} disabled={refreshing}
                className="w-9 h-9 rounded-xl border flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] transition"
                style={{ borderColor: BD }}>
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => goTo('notifications')}
                className="relative w-9 h-9 rounded-xl border flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] transition"
                style={{ borderColor: BD }}>
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ background: A }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button onClick={() => navigate('/b2b/order')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: A }}>
                <Plus className="w-3.5 h-3.5" /> Commander
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="flex-1 text-sm text-red-700">{error}</p>
              <button onClick={() => loadData(false)} className="text-xs font-bold text-red-700 underline">Réessayer</button>
            </div>
          )}

          {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-5">

              {/* No-compte banner */}
              {!compte && (
                <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed"
                  style={{ borderColor: A + '40', background: AL + '80' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: A }}>
                    <UtensilsCrossed className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#111827]">Configurez votre compte entreprise</p>
                    <p className="text-xs text-[#6B7280]">RCCM + coordonnées pour activer la facturation SYSCOHADA</p>
                  </div>
                  <Link to="/b2b/onboarding"
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white shrink-0"
                    style={{ background: A }}>
                    Configurer
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* LEFT: KPIs + recent orders */}
                <div className="xl:col-span-2 space-y-5">

                  {/* KPI row — inspired by "Client Account Overview" */}
                  <div className="bg-white rounded-2xl border p-5" style={{ borderColor: BD }}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-extrabold text-[#111827]">Aperçu du compte entreprise</h2>
                      <button onClick={() => goTo('orders')}
                        className="flex items-center gap-1 text-xs font-semibold" style={{ color: A }}>
                        Voir tout <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: TrendingDown, label: 'Dépenses mois',  val: loading ? '—' : formatFCFA(monthlyExp),     sub: 'FCFA', bg: AL, ic: A },
                        { icon: Wallet,       label: 'Budget restant', val: loading ? '—' : formatFCFA(Math.max(0, budgetTotal - monthlyExp)), sub: budgetTotal > 0 ? `${budgetPct}% utilisé` : 'non défini', bg: '#DCFCE7', ic: '#16A34A' },
                        { icon: Users,        label: 'Collaborateurs', val: loading ? '—' : String(collabs.length),     sub: 'membres', bg: '#DBEAFE', ic: '#2563EB' },
                        { icon: Package,      label: 'En cours',       val: loading ? '—' : String(activeOrders.length), sub: `${orders.length} total`, bg: '#EDE9FE', ic: '#7C3AED' },
                      ].map((k, i) => (
                        <div key={i} className="rounded-xl p-3" style={{ background: k.bg + '60' }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                            style={{ background: k.bg }}>
                            <k.icon className="w-4 h-4" style={{ color: k.ic }} />
                          </div>
                          <p className="text-lg font-extrabold text-[#111827] leading-none">{k.val}</p>
                          <p className="text-xs text-[#6B7280] mt-0.5">{k.label}</p>
                          {budgetTotal > 0 && k.label === 'Budget restant' ? (
                            <div className="mt-1.5 h-1 rounded-full bg-white/60 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${budgetPct}%`, background: budgetBar }} />
                            </div>
                          ) : (
                            <p className="text-[10px] text-[#9CA3AF]">{k.sub}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent orders — inspired by "Pending Tasks" */}
                  <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BD }}>
                    <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: BD }}>
                      <div>
                        <h2 className="text-sm font-extrabold text-[#111827]">Commandes récentes</h2>
                        <p className="text-xs text-[#9CA3AF]">{activeOrders.length} en cours · {orders.length} total</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => goTo('orders')}
                          className="text-xs font-semibold" style={{ color: A }}>Toutes →</button>
                        <button onClick={() => navigate('/b2b/order')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                          style={{ background: A }}>
                          <Plus className="w-3 h-3" /> Nouvelle
                        </button>
                      </div>
                    </div>

                    {loading ? (
                      <div className="p-4 space-y-2.5">
                        {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-[#F3F4F6] animate-pulse" />)}
                      </div>
                    ) : orders.slice(0, 6).length === 0 ? (
                      <div className="py-10 text-center">
                        <ShoppingBag className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
                        <p className="text-sm text-[#9CA3AF] mb-3">Aucune commande</p>
                        <Link to="/b2b/order" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                          style={{ background: A }}>
                          <ShoppingBag className="w-3.5 h-3.5" /> Commander maintenant
                        </Link>
                      </div>
                    ) : (
                      orders.slice(0, 6).map(o => {
                        const st = o.statut ?? o.status ?? '';
                        return (
                          <div key={o.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-0 hover:bg-[#F9F7F5] transition"
                            style={{ borderColor: BD }}>
                            <div className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: STATUS[st]?.color || '#9CA3AF' }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#111827] truncate">
                                {o.numero || o.restaurantNom || `Commande #${o.id?.slice(0, 8)}`}
                              </p>
                              <p className="text-xs text-[#9CA3AF]">
                                {o.dateLivraison ? new Date(o.dateLivraison).toLocaleDateString('fr-FR') : ''}
                                {o.heureLivraison ? ` · ${o.heureLivraison}` : ''}
                              </p>
                            </div>
                            <StatusBadge statut={st} />
                            <p className="text-sm font-bold text-[#111827] shrink-0">
                              {formatFCFA(o.total || o.totalEstime || o.montantTotal || 0)}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* RIGHT: Upcoming deliveries + collabs — inspired by "Upcoming Schedule" */}
                <div className="space-y-5">

                  {/* Upcoming deliveries */}
                  <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BD }}>
                    <div className="px-5 py-3.5 border-b" style={{ borderColor: BD }}>
                      <h2 className="text-sm font-extrabold text-[#111827]">Livraisons à venir</h2>
                    </div>
                    {upcoming.length === 0 ? (
                      <div className="py-8 text-center px-4">
                        <CalendarDays className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
                        <p className="text-xs text-[#9CA3AF]">Aucune livraison planifiée</p>
                        <button onClick={() => navigate('/b2b/order')}
                          className="mt-3 text-xs font-semibold underline" style={{ color: A }}>
                          Passer une commande
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 space-y-2">
                        {upcoming.map(o => {
                          const d = o.dateLivraison ? new Date(o.dateLivraison) : null;
                          return (
                            <button key={o.id}
                              onClick={() => navigate(o.numero?.startsWith('GRP-') || o.type === 'GROUPEE' ? `/b2b/suivi/${o.id}` : `/suivi/${o.id}`)}
                              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-[#F9F7F5] transition text-left">
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: AL }}>
                                <CalendarDays className="w-4 h-4" style={{ color: A }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-[#111827] truncate">
                                  {o.numero || o.restaurantNom || 'Livraison'}
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                  {d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                                  {o.heureLivraison ? `, ${o.heureLivraison}` : ''}
                                </p>
                              </div>
                              <StatusBadge statut={o.statut ?? o.status ?? ''} />
                            </button>
                          );
                        })}
                        <button onClick={() => goTo('orders')}
                          className="w-full text-center text-xs font-semibold py-2 rounded-xl transition"
                          style={{ color: A }}>
                          Voir toutes les commandes →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Team budgets */}
                  <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BD }}>
                    <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: BD }}>
                      <h2 className="text-sm font-extrabold text-[#111827]">Équipe</h2>
                      <button onClick={() => setShowInvite(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white"
                        style={{ background: A }}>
                        <Plus className="w-3 h-3" /> Inviter
                      </button>
                    </div>
                    {loading ? (
                      <div className="p-4 space-y-2">
                        {[1,2].map(i => <div key={i} className="h-12 rounded-xl bg-[#F3F4F6] animate-pulse" />)}
                      </div>
                    ) : collabs.length === 0 ? (
                      <div className="py-8 text-center px-4">
                        <Users className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
                        <p className="text-xs text-[#9CA3AF] mb-3">Aucun collaborateur</p>
                        <button onClick={() => setShowInvite(true)}
                          className="text-xs font-semibold underline" style={{ color: A }}>
                          Inviter votre équipe
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 space-y-2.5">
                        {collabs.slice(0, 4).map(c => (
                          <div key={c.id} className="flex items-center gap-3">
                            <Avatar name={c.nom || c.name || ''} size={32} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#111827] truncate">{c.nom || c.name || 'Collaborateur'}</p>
                              <BudgetBar spent={c.depenseActuelle || 0} budget={c.limiteBudget || 0} />
                            </div>
                          </div>
                        ))}
                        {collabs.length > 4 && (
                          <button onClick={() => goTo('collaborateurs')}
                            className="w-full text-xs font-semibold text-center py-2 rounded-xl transition"
                            style={{ color: A }}>
                            +{collabs.length - 4} autres →
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ── COMMANDES ─────────────────────────────────────────────────── */}
          {tab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-[#111827]">Commandes d'équipe</h2>
                  <p className="text-sm text-[#9CA3AF]">{activeOrders.length} en cours · {orders.length} au total</p>
                </div>
                <Link to="/b2b/order"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: A }}>
                  <Plus className="w-4 h-4" /> Nouvelle commande
                </Link>
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { k: 'all',    label: `Toutes (${orders.length})` },
                  { k: 'active', label: `En cours (${activeOrders.length})` },
                  { k: 'done',   label: `Terminées (${doneOrders.length})` },
                ].map(f => (
                  <button key={f.k} onClick={() => setOrderFilter(f.k)}
                    className="px-4 py-1.5 rounded-full text-sm font-semibold border transition"
                    style={{
                      background: orderFilter === f.k ? A : '#fff',
                      color: orderFilter === f.k ? '#fff' : '#6B7280',
                      borderColor: orderFilter === f.k ? A : BD,
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BD }}>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: A, borderTopColor: 'transparent' }} />
                  </div>
                ) : displayed.length === 0 ? (
                  <div className="py-16 text-center">
                    <ShoppingBag className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                    <p className="text-sm text-[#9CA3AF] mb-4">Aucune commande</p>
                    <Link to="/b2b/order"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: A }}>
                      <ShoppingBag className="w-4 h-4" /> Commander maintenant
                    </Link>
                  </div>
                ) : (
                  displayed.map(o => {
                    const st = o.statut ?? o.status ?? '';
                    const isGroupee = o.numero?.startsWith('GRP-') || o.type === 'GROUPEE';
                    return (
                      <button key={o.id}
                        className="w-full flex items-center gap-4 px-5 py-4 border-b last:border-0 hover:bg-[#F9F7F5] transition text-left"
                        style={{ borderColor: BD }}
                        onClick={() => {
                          if (isGroupee) navigate(`/b2b/suivi/${o.id}`);
                          else navigate(`/suivi/${o.id}`);
                        }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: isGroupee ? '#DBEAFE' : AL }}>
                          <ShoppingBag className="w-4 h-4" style={{ color: isGroupee ? '#2563EB' : A }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#111827] truncate">
                            {o.numero || o.restaurantNom || `#${o.id?.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">
                            {isGroupee ? 'Commande groupée · ' : ''}
                            {o.dateLivraison ? new Date(o.dateLivraison).toLocaleDateString('fr-FR') : ''}
                            {o.lieuLivraison ? ` · ${o.lieuLivraison}` : ''}
                          </p>
                        </div>
                        <StatusBadge statut={st} />
                        <p className="text-sm font-extrabold text-[#111827] shrink-0 hidden sm:block">
                          {formatFCFA(o.total || o.totalEstime || o.montantTotal || 0)}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── ÉQUIPE / COLLABORATEURS ────────────────────────────────────── */}
          {tab === 'collaborateurs' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-[#111827]">Équipe</h2>
                  <p className="text-sm text-[#9CA3AF]">{collabs.length} collaborateur{collabs.length !== 1 ? 's' : ''} · Budgets mensuels</p>
                </div>
                <button onClick={() => setShowInvite(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: A }}>
                  <Plus className="w-4 h-4" /> Inviter un collaborateur
                </button>
              </div>

              <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BD }}>
                {loading ? (
                  <div className="p-5 space-y-3">
                    {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-[#F3F4F6] animate-pulse" />)}
                  </div>
                ) : collabs.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
                    <p className="text-base font-bold text-[#374151] mb-2">Aucun collaborateur</p>
                    <p className="text-sm text-[#9CA3AF] mb-5">Invitez votre équipe pour gérer les déjeuners ensemble</p>
                    <button onClick={() => setShowInvite(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: A }}>
                      <Plus className="w-4 h-4" /> Inviter
                    </button>
                  </div>
                ) : (
                  collabs.map(c => {
                    const budget = Number(c.limiteBudget || c.budgetMax || 0);
                    const spent  = Number(c.depenseActuelle || c.depenses || 0);
                    return (
                      <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0 hover:bg-[#F9F7F5] transition"
                        style={{ borderColor: BD }}>
                        <Avatar name={c.nom || ''} size={40} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#111827]">{c.nom || 'Collaborateur'}</p>
                          <p className="text-xs text-[#9CA3AF] mb-1.5">{c.poste || c.email}</p>
                          <BudgetBar spent={spent} budget={budget} />
                        </div>
                        <div className="text-right shrink-0 hidden sm:block">
                          <p className="text-xs text-[#9CA3AF]">Budget</p>
                          <p className="text-sm font-bold text-[#111827]">{formatFCFA(budget)}</p>
                        </div>
                        <button onClick={() => handleDeleteCollab(c.id)}
                          className="w-8 h-8 rounded-xl border flex items-center justify-center text-[#9CA3AF] hover:text-red-500 hover:border-red-200 transition"
                          style={{ borderColor: BD }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── FACTURATION ───────────────────────────────────────────────── */}
          {tab === 'factures' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#111827]">Facturation</h2>
                <p className="text-sm text-[#9CA3AF]">Factures mensuelles consolidées · conformité SYSCOHADA</p>
              </div>
              <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BD }}>
                {loading ? (
                  <div className="p-5 space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-[#F3F4F6] animate-pulse" />)}
                  </div>
                ) : factures.length === 0 ? (
                  <div className="py-16 text-center">
                    <FileText className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
                    <p className="text-base font-bold text-[#374151] mb-2">Aucune facture disponible</p>
                    <p className="text-sm text-[#9CA3AF]">Les factures mensuelles sont générées automatiquement</p>
                  </div>
                ) : (
                  factures.map(f => {
                    const isPaid = f.statut === 'PAYEE';
                    const isLate = f.statut === 'RETARDEE';
                    return (
                      <div key={f.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0 hover:bg-[#F9F7F5] transition"
                        style={{ borderColor: BD }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: isPaid ? '#DCFCE7' : isLate ? '#FFF1F2' : AL }}>
                          <FileText className="w-4 h-4" style={{ color: isPaid ? '#16A34A' : isLate ? '#E11D48' : A }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#111827]">
                            {f.numeroFacture || `Facture ${f.periode || ''}`}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">
                            {f.periode || ''}{f.echeance ? ` · Échéance: ${new Date(f.echeance).toLocaleDateString('fr-FR')}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-extrabold text-[#111827]">{formatFCFA(f.montantTTC || f.montantTotal || 0)}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: isPaid ? '#DCFCE7' : isLate ? '#FFF1F2' : '#FFFBEB',
                              color: isPaid ? '#16A34A' : isLate ? '#E11D48' : '#D97706',
                            }}>
                            {isPaid ? 'Payée' : isLate ? 'En retard' : 'En attente'}
                          </span>
                        </div>
                        {!isPaid && (
                          <button onClick={() => {}}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] transition border"
                            style={{ borderColor: BD }}
                            title="Télécharger">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isPaid && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── HISTORIQUE / AUDIT ────────────────────────────────────────── */}
          {tab === 'historique' && (
            <div className="space-y-5 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-[#111827]">Historique d'activité</h2>
                  <p className="text-sm text-[#9CA3AF]">Toutes les actions enregistrées sur votre compte entreprise</p>
                </div>
                <button
                  onClick={() => {
                    setAuditLoading(true);
                    b2bAPI.getAuditLogs()
                      .then(res => setAuditLogs(Array.isArray(res.data) ? res.data : []))
                      .catch(() => {})
                      .finally(() => setAuditLoading(false));
                  }}
                  disabled={auditLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: A }}>
                  <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
              </div>

              {auditLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: A, borderTopColor: 'transparent' }} />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border" style={{ borderColor: BD }}>
                  <Activity className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                  <p className="text-sm font-semibold text-[#374151]">Aucun événement enregistré</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Les connexions, commandes et actions apparaissent ici</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BD }}>
                  {auditLogs.map((entry, idx) => {
                    const typeLabels = {
                      CONNEXION: 'Connexion',
                      CREATION_COLLABORATEUR: 'Ajout collaborateur',
                      CREATION_COMMANDE_GROUPEE: 'Commande groupée',
                      VALIDATION_BUDGET: 'Validation budget',
                      GENERATION_FACTURE: 'Génération facture',
                      PAIEMENT_FACTURE: 'Paiement facture',
                    };
                    const typeColors = {
                      CONNEXION: { bg: '#EFF6FF', color: '#2563EB' },
                      CREATION_COLLABORATEUR: { bg: '#F0FDF4', color: '#16A34A' },
                      CREATION_COMMANDE_GROUPEE: { bg: AL, color: A },
                      VALIDATION_BUDGET: { bg: '#FEF3C7', color: '#B45309' },
                      GENERATION_FACTURE: { bg: '#F5F3FF', color: '#7C3AED' },
                      PAIEMENT_FACTURE: { bg: '#F0FDF4', color: '#15803D' },
                    };
                    const style = typeColors[entry.type] || { bg: '#F3F4F6', color: '#374151' };
                    const date = new Date(entry.createdAt);
                    return (
                      <div key={entry.id || idx}
                        className="flex items-start gap-4 px-5 py-3.5 border-b last:border-0"
                        style={{ borderColor: BD }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: style.bg }}>
                          <Activity className="w-3.5 h-3.5" style={{ color: style.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#111827]">
                              {typeLabels[entry.type] || entry.type}
                            </span>
                            {entry.meta && Object.keys(entry.meta).length > 0 && (
                              <span className="text-xs text-[#9CA3AF]">
                                {entry.meta.commandeId ? `#${entry.meta.commandeId.slice(0, 8)}` : ''}
                                {entry.meta.collaborateurEmail ? `· ${entry.meta.collaborateurEmail}` : ''}
                              </span>
                            )}
                          </div>
                          {entry.actorEmail && (
                            <p className="text-xs text-[#9CA3AF] mt-0.5">{entry.actorEmail}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-[#9CA3AF]">
                            {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[10px] text-[#D1D5DB]">
                            {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS ─────────────────────────────────────────────── */}
          {tab === 'notifications' && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-[#111827]">Notifications</h2>
                  <p className="text-sm text-[#9CA3AF]">{unreadCount} non lue{unreadCount !== 1 ? 's' : ''}</p>
                </div>
                {notifications.length > 0 && (
                  <button onClick={markAllRead}
                    className="text-xs font-semibold" style={{ color: A }}>
                    Tout marquer lu
                  </button>
                )}
              </div>
              <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BD }}>
                {notifications.length === 0 ? (
                  <div className="py-16 text-center">
                    <Bell className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                    <p className="text-sm text-[#9CA3AF]">Aucune notification pour l'instant</p>
                    <p className="text-xs text-[#D1D5DB] mt-1">Les mises à jour de commandes apparaissent ici en temps réel</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id}
                      className="flex items-start gap-3 px-5 py-3.5 border-b last:border-0 transition"
                      style={{ background: n.read ? '#fff' : AL + '50', borderColor: BD }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: n.read ? '#D1D5DB' : A }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#111827]">{n.msg}</p>
                        <p className="text-xs text-[#9CA3AF]">
                          {new Date(n.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {' · '}{new Date(n.ts).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── PARAMÈTRES ────────────────────────────────────────────────── */}
          {tab === 'settings' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h2 className="text-lg font-extrabold text-[#111827]">Paramètres</h2>
                <p className="text-sm text-[#9CA3AF]">Profil et sécurité de votre compte</p>
              </div>

              {/* Profile card */}
              <div className="bg-white rounded-2xl border p-6" style={{ borderColor: BD }}>
                <div className="flex items-center gap-4 mb-5 pb-4 border-b" style={{ borderColor: BD }}>
                  <Avatar name={user?.nom || 'B2B'} size={48} />
                  <div>
                    <p className="font-bold text-[#111827]">{user?.nom || 'Gestionnaire'}</p>
                    <p className="text-sm text-[#9CA3AF]">{compte?.raisonSociale || 'Responsable B2B'}</p>
                  </div>
                </div>
                <form onSubmit={handleProfileSave} className="space-y-4">
                  {[
                    { k: 'nom',       label: 'Nom complet',  type: 'text'  },
                    { k: 'email',     label: 'Email',        type: 'email' },
                    { k: 'telephone', label: 'Téléphone',    type: 'tel'   },
                  ].map(f => (
                    <div key={f.k}>
                      <label className="block text-xs font-semibold text-[#374151] mb-1.5">{f.label}</label>
                      <input value={profileForm[f.k] || ''} type={f.type}
                        onChange={e => setProfileForm(p => ({ ...p, [f.k]: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: SF, border: `1px solid ${BD}` }} />
                    </div>
                  ))}
                  {profileMsg && (
                    <p className="text-sm font-semibold"
                      style={{ color: profileMsg.includes('Erreur') ? '#EF4444' : '#16A34A' }}>
                      {profileMsg}
                    </p>
                  )}
                  <button type="submit"
                    className="w-full py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: A }}>
                    Enregistrer les modifications
                  </button>
                </form>
              </div>

              {/* Security */}
              <SecurityPanel user={user} accentColor={A} />
            </div>
          )}

        </main>
      </div>

      {/* ── Modal invitation ─────────────────────────────────────────────────── */}
      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onSave={handleInvite} />
      )}

      {/* ── Modal détail commande + suivi + avis ───────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={e => e.target === e.currentTarget && setSelectedOrder(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-3xl z-10"
              style={{ borderColor: BD }}>
              <div>
                <p className="font-extrabold text-[#111827]">{selectedOrder.numero}</p>
                <StatusBadge statut={selectedOrder.statut} />
              </div>
              <button onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6]">
                <X className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Infos livraison */}
              <div className="rounded-2xl p-4 space-y-2" style={{ background: SF }}>
                <div className="flex items-center gap-2 text-sm text-[#374151]">
                  <CalendarDays className="w-4 h-4 shrink-0" style={{ color: A }} />
                  <span>
                    <strong>Livraison :</strong>{' '}
                    {selectedOrder.dateLivraison
                      ? new Date(selectedOrder.dateLivraison).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '—'}
                    {selectedOrder.heureLivraison ? ` à ${selectedOrder.heureLivraison}` : ''}
                  </span>
                </div>
                {selectedOrder.lieuLivraison && (
                  <div className="flex items-center gap-2 text-sm text-[#374151]">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: A }} />
                    <span>{selectedOrder.lieuLivraison}{selectedOrder.adresseLivraison ? ` — ${selectedOrder.adresseLivraison}` : ''}</span>
                  </div>
                )}
              </div>

              {/* Pipeline de statut */}
              <div>
                <p className="text-xs font-bold text-[#374151] mb-3 uppercase tracking-wide">Suivi de la commande</p>
                <div className="flex items-center gap-1">
                  {['EN_ATTENTE','CONFIRMEE','EN_PREPARATION','LIVREE'].map((st, i, arr) => {
                    const statuts = ['EN_ATTENTE','RECUE','CONFIRMEE','EN_PREP','EN_PREPARATION','PRETE','EN_LIVRAISON','LIVREE'];
                    const currentIdx = statuts.indexOf(selectedOrder.statut);
                    const stepIdx = statuts.indexOf(st);
                    const done = currentIdx >= stepIdx;
                    const LABELS = { EN_ATTENTE: 'Reçue', CONFIRMEE: 'Confirmée', EN_PREPARATION: 'En prépa.', LIVREE: 'Livrée' };
                    return (
                      <div key={st} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ background: done ? A : '#E5E7EB', color: done ? '#fff' : '#9CA3AF' }}>
                            {done ? '✓' : i + 1}
                          </div>
                          <p className="text-[9px] text-[#9CA3AF] text-center leading-tight">{LABELS[st]}</p>
                        </div>
                        {i < arr.length - 1 && (
                          <div className="h-0.5 flex-1 mx-1 mb-4 rounded-full"
                            style={{ background: done ? A : '#E5E7EB' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Articles */}
              {selectedOrder.lignes && selectedOrder.lignes.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#374151] mb-2 uppercase tracking-wide">Détail de la commande</p>
                  <div className="rounded-2xl overflow-hidden border" style={{ borderColor: BD }}>
                    {selectedOrder.lignes.map((l, i) => (
                      <div key={l.id || i}
                        className="flex items-center justify-between px-4 py-3 border-b last:border-0 text-sm"
                        style={{ borderColor: BD }}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#111827] truncate">{l.nomArticle || l.articleId}</p>
                          {l.instructions && <p className="text-xs text-[#9CA3AF]">{l.instructions}</p>}
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-xs text-[#9CA3AF]">×{l.quantite}</p>
                          <p className="font-bold text-[#111827]">{formatFCFA(l.quantite * l.prixUnitaire)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 font-extrabold text-sm"
                      style={{ background: SF }}>
                      <span>Total estimé</span>
                      <span style={{ color: A }}>{formatFCFA(selectedOrder.totalEstime)} FCFA</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Avis — uniquement si LIVREE et pas encore noté */}
              {selectedOrder.statut === 'LIVREE' && !selectedOrder.avisNote && (
                <div className="rounded-2xl border p-5" style={{ borderColor: BD }}>
                  <p className="text-sm font-bold text-[#111827] mb-3">Laisser un avis</p>
                  <div className="flex gap-2 mb-3">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setAvisForm(p => ({ ...p, note: n }))}
                        className="transition">
                        <Star className="w-7 h-7"
                          fill={avisForm.note >= n ? '#F59E0B' : 'none'}
                          color={avisForm.note >= n ? '#F59E0B' : '#D1D5DB'}
                          strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={avisForm.commentaire}
                    onChange={e => setAvisForm(p => ({ ...p, commentaire: e.target.value }))}
                    placeholder="Commentaire (optionnel)"
                    rows={2}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none mb-3"
                    style={{ background: SF, border: `1px solid ${BD}` }}
                  />
                  {avisMsg && (
                    <p className="text-xs font-semibold mb-2"
                      style={{ color: avisMsg.includes('Erreur') ? '#EF4444' : '#16A34A' }}>
                      {avisMsg}
                    </p>
                  )}
                  <button
                    disabled={avisForm.note === 0 || avisSubmitting}
                    onClick={async () => {
                      if (avisForm.note === 0) return;
                      setAvisSubmitting(true);
                      try {
                        await b2bAPI.submitAvis(selectedOrder.id, { note: avisForm.note, commentaire: avisForm.commentaire });
                        setAvisMsg('Avis enregistré, merci !');
                        setSelectedOrder(o => ({ ...o, avisNote: avisForm.note }));
                        setAvisForm({ note: 0, commentaire: '' });
                      } catch (e) {
                        setAvisMsg(e.response?.data?.message || 'Erreur lors de l\'envoi');
                      } finally {
                        setAvisSubmitting(false);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition"
                    style={{ background: A, opacity: avisForm.note === 0 || avisSubmitting ? 0.5 : 1 }}>
                    {avisSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" fill="white" />}
                    Envoyer l'avis
                  </button>
                </div>
              )}

              {/* Avis déjà soumis */}
              {selectedOrder.avisNote && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                  style={{ background: '#DCFCE7' }}>
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-sm text-green-800 font-semibold">
                    Avis soumis — {selectedOrder.avisNote}/5 étoiles
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Onboarding wizard (première connexion sans compte) ──────────────── */}
      {showWizard && (
        <B2BOnboardingWizard
          user={user}
          onComplete={(action) => {
            if (uid) localStorage.setItem(`b2b_onboarded_${uid}`, '1');
            setShowWizard(false);
            loadData(true);
            if (action === 'order') navigate('/b2b/order');
            else if (action === 'invite') setShowInvite(true);
          }}
        />
      )}

      {/* ── Modal confirmation déconnexion ─────────────────────────────────── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Confirmer la déconnexion ?</h3>
            <p className="text-sm text-[#737373] mb-6">Vous serez redirigé vers la page de connexion.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0F172A] font-medium hover:bg-[#F9F7F5]">
                Annuler
              </button>
              <button
                onClick={() => { logout?.(); navigate('/login'); setShowLogoutModal(false); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
