/* ═══════════════════════════════════════════════════════════════
   StaffLayout.jsx — Mise en page pour le personnel de restaurant
   Contient : sidebar navy + topbar + notifications temps réel +
              panneau profil + modal déconnexion + onboarding tour
   Accès    : rôle STAFF uniquement
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ChefHat, CreditCard, UtensilsCrossed, Package,
  Bell, LogOut, X, User, Shield, CheckCircle, AlertCircle,
} from 'lucide-react';
import { createCommandesSocket } from '../services/commandes.service';
import { authAPI } from '../services/api';
import SecurityPanel from '../components/security/SecurityPanel';
import OnboardingTour from '../components/onboarding/OnboardingTour';

const STAFF_TOUR_STEPS = [
  {
    title: 'Bienvenue dans votre espace Staff !',
    body: 'En quelques secondes, découvrez les 4 outils essentiels à votre journée. Cliquez sur "Démarrer la visite" pour commencer.',
  },
  {
    selector: '[data-tour="staff-kds"]',
    title: 'KDS — Écran Cuisine',
    body: 'Visualisez toutes les commandes en temps réel, changez leur statut (reçue → en préparation → prête) et gardez la cuisine synchronisée.',
  },
  {
    selector: '[data-tour="staff-salle"]',
    title: 'Prise de commande — Salle',
    body: 'Sélectionnez une table, composez la commande depuis le menu et envoyez-la directement en cuisine en un clic.',
  },
  {
    selector: '[data-tour="staff-articles"]',
    title: 'Gestion des articles',
    body: 'Marquez un plat "en rupture" pour qu\'il disparaisse automatiquement du menu client. Réactivez-le dès qu\'il est de nouveau disponible.',
  },
  {
    selector: '[data-tour="staff-bell"]',
    title: 'Notifications en temps réel',
    body: 'Chaque nouvelle commande déclenche un bip sonore et apparaît ici. Cliquez sur la cloche pour voir le détail de toutes les alertes.',
  },
  {
    selector: '[data-tour="staff-avatar"]',
    title: 'Votre profil',
    body: 'Modifiez vos informations personnelles et sécurisez votre compte avec la double authentification (2FA) depuis ce menu.',
  },
  {
    title: "C'est parti !",
    body: 'Vous connaissez maintenant les outils essentiels. Bonne journée en cuisine !',
  },
];

/* ── Palette de couleurs et design tokens ── */
const BG     = '#F8FAFC';
const CARD   = '#FFFFFF';
const NAVY   = '#0F172A';
const NAVY2  = '#1E293B';
const BORDER = '#E2E8F0';
const MUTED  = '#64748B';
const FAINT  = '#94A3B8';
const TER    = '#ab3500';
const TER_L  = 'rgba(171,53,0,0.13)';
const TER_G  = 'linear-gradient(135deg,#ab3500,#ff6b35)';
const RED    = '#DC2626';
const RED_L  = '#FEF2F2';
const AMBER  = '#D97706';
const GREEN  = '#16A34A';
const SH     = '0 1px 3px rgba(15,23,42,0.07),0 1px 2px rgba(15,23,42,0.04)';
const SH3    = '0 20px 48px rgba(15,23,42,0.22),0 4px 10px rgba(15,23,42,0.08)';

const NAV = [
  { to: '/staff/kds',      label: 'KDS — Cuisine',  icon: ChefHat },
  { to: '/staff/caisse',   label: 'Caisse',         icon: CreditCard },
  { to: '/staff/salle',    label: 'Salle',          icon: UtensilsCrossed },
  { to: '/staff/articles', label: 'Articles',       icon: Package },
];

/* ── Fonctions utilitaires ── */
function Avatar({ name, size = 36, fontSize = 13 }) {
  const initials = name.split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || 'S';
  const hue = ((initials.charCodeAt(0) || 0) * 37) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue},65%,88%)`, color: `hsl(${hue},65%,30%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 800, flexShrink: 0, letterSpacing: '-0.02em',
    }}>
      {initials}
    </div>
  );
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60)  return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  return `${Math.floor(s / 3600)}h`;
}

const STATUT_LABEL = {
  RECUE: 'Reçue', CONFIRMEE: 'Confirmée', EN_PREP: 'En préparation',
  PRETE: 'Prête', EN_LIVRAISON: 'En livraison', LIVREE: 'Livrée',
};

/* ── Panneau de notifications ── */
function NotifPanel({ notifs, onMarkAllRead, onClear, onClose, anchorRef }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed', top: 0, left: 220, bottom: 0, zIndex: 300,
        width: 340, background: CARD,
        boxShadow: SH3,
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
        borderRight: `1px solid ${BORDER}`,
      }}
    >
      {/* Header */}
      <div style={{ padding: '18px 18px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: NAVY }}>Notifications</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: MUTED }}>
            {notifs.filter(n => !n.read).length} non lue{notifs.filter(n => !n.read).length > 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {notifs.some(n => !n.read) && (
            <button
              onClick={onMarkAllRead}
              style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: BG, fontSize: 11, fontWeight: 700, color: MUTED, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Tout lire
            </button>
          )}
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: BG, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={13} color={MUTED} />
          </button>
        </div>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {notifs.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Bell size={32} color={BORDER} style={{ display: 'block', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: 13, color: FAINT, fontWeight: 500 }}>Aucune notification</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: FAINT }}>Les nouvelles commandes apparaîtront ici</p>
          </div>
        ) : notifs.map((n, idx) => {
          const isNew = n.type === 'nouvelle';
          const accentColor = isNew ? TER : n.statut === 'PRETE' ? GREEN : AMBER;
          return (
            <div
              key={n.id}
              style={{
                display: 'flex', gap: 12, padding: '13px 16px',
                borderBottom: idx < notifs.length - 1 ? `1px solid ${BORDER}` : 'none',
                background: n.read ? 'transparent' : `${accentColor}08`,
                borderLeft: n.read ? '3px solid transparent' : `3px solid ${accentColor}`,
                transition: 'background 0.15s',
              }}
            >
              {/* Icône */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: n.read ? BG : `${accentColor}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isNew
                  ? <ChefHat size={16} color={n.read ? FAINT : accentColor} />
                  : <Bell size={16} color={n.read ? FAINT : accentColor} />
                }
              </div>

              {/* Texte */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: n.read ? MUTED : NAVY, lineHeight: 1.4 }}>
                  {isNew
                    ? `Nouvelle commande CMD-${n.numero}`
                    : `CMD-${n.numero} → ${STATUT_LABEL[n.statut] || n.statut}`
                  }
                </p>
                {isNew && n.lieu && (
                  <p style={{ margin: '1px 0 0', fontSize: 11, color: n.read ? FAINT : MUTED }}>
                    {n.lieu}{n.montant ? ` · ${Math.round(n.montant).toLocaleString('fr-FR')} F` : ''}
                  </p>
                )}
                <p style={{ margin: '3px 0 0', fontSize: 10, color: FAINT }}>{timeAgo(n.ts)}</p>
              </div>

              {/* Pastille non lu */}
              {!n.read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, flexShrink: 0, marginTop: 4 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {notifs.length > 0 && (
        <div style={{ padding: '10px 16px 14px', borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={onClear}
            style={{ width: '100%', padding: '9px', borderRadius: 9, border: `1px solid ${BORDER}`, background: BG, fontSize: 12, fontWeight: 600, color: MUTED, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Effacer tout
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Panneau glissant de profil utilisateur ── */
function ProfileDrawer({ user, onClose, syncUser }) {
  const [tab,    setTab]    = useState('profil');
  const [form,   setForm]   = useState({
    prenom: user?.prenom || '', nom: user?.nom || '',
    email: user?.email || '', telephone: user?.telephone || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');
  const [isErr,  setIsErr]  = useState(false);
  const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || 'Staff';

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const res = await authAPI.updateProfile(form);
      const updated = res?.data?.user || res?.data || { ...user, ...form };
      if (syncUser) syncUser(updated);
      setIsErr(false); setMsg('Profil mis à jour avec succès !');
      setTimeout(() => setMsg(''), 3500);
    } catch (err) {
      setIsErr(true);
      setMsg(err?.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.40)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201, width: 420, background: CARD, boxShadow: SH3, display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>

        {/* Header navy */}
        <div style={{ padding: '20px 22px 0', background: NAVY }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={fullName} size={48} fontSize={17} />
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff' }}>{fullName}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Staff</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.09)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} color="rgba(255,255,255,0.6)" />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {[{ id: 'profil', label: 'Profil', icon: User }, { id: 'securite', label: 'Sécurité', icon: Shield }].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', color: tab === id ? '#fff' : 'rgba(255,255,255,0.42)', borderBottom: tab === id ? `2px solid ${TER}` : '2px solid transparent', transition: 'all 0.13s' }}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 24px' }}>
          {tab === 'profil' && (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {msg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: isErr ? RED_L : '#F0FDF4', border: `1px solid ${isErr ? '#FECACA' : '#BBF7D0'}`, fontSize: 12, fontWeight: 600, color: isErr ? RED : GREEN }}>
                  {isErr ? <AlertCircle size={13} /> : <CheckCircle size={13} />}{msg}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[{ k: 'prenom', label: 'Prénom' }, { k: 'nom', label: 'Nom' }].map(f => (
                  <div key={f.k}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.label}</label>
                    <input type="text" value={form[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: NAVY, outline: 'none', background: BG, fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = TER} onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                ))}
              </div>
              {[{ k: 'email', label: 'Email', type: 'email' }, { k: 'telephone', label: 'Téléphone', type: 'tel' }].map(f => (
                <div key={f.k}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.label}</label>
                  <input type={f.type} value={form[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: NAVY, outline: 'none', background: BG, fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = TER} onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
              ))}
              <button type="submit" disabled={saving} style={{ marginTop: 4, padding: '12px', borderRadius: 10, border: 'none', background: saving ? MUTED : TER_G, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 14px rgba(171,53,0,0.28)' }}>
                {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
            </form>
          )}
          {tab === 'securite' && <SecurityPanel user={user} accentColor={TER} />}
        </div>
      </div>
    </>
  );
}

/* ═══ StaffLayout — Composant principal ═══ */
export default function StaffLayout() {
  const { user, logout, syncUser } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const bellRef   = useRef(null);

  const [notifs,       setNotifs]       = useState([]);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [drawer,       setDrawer]       = useState(false);
  const [logoutModal,  setLogoutModal]  = useState(false);

  // Tour — affiché une seule fois par utilisateur (staff)
  const tourKey = user?.id ? `tour_staff_${user.id}` : null;
  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    if (tourKey && !localStorage.getItem(tourKey)) setShowTour(true);
  }, [tourKey]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const pushNotif = (notif) => {
    setNotifs(prev => [{ ...notif, id: Date.now() + Math.random(), ts: Date.now(), read: false }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    if (!user?.id) return;
    const s = createCommandesSocket(user);

    s.on('commande.nouvelle', (p) => {
      const lieu = p?.modeLivraison === 'SUR_PLACE' ? `Table ${p?.tableNumero ?? '?'}`
        : p?.modeLivraison === 'EMPORTER' ? 'À emporter'
        : p?.modeLivraison === 'LIVRAISON' ? 'Livraison'
        : '';
      pushNotif({ type: 'nouvelle', numero: p?.numero, lieu, montant: p?.montantTotal });
      // Bip sonore
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'triangle'; o.frequency.value = 880;
        g.gain.setValueAtTime(0.001, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.22, ac.currentTime + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
        o.connect(g); g.connect(ac.destination);
        o.start(); o.stop(ac.currentTime + 0.3);
      } catch (_) {}
    });

    s.on('commande.statut', (p) => {
      if (p?.statut && ['PRETE', 'EN_LIVRAISON'].includes(p.statut)) {
        pushNotif({ type: 'statut', numero: p?.numero, statut: p?.statut });
      }
    });

    return () => s.disconnect();
  }, [user]);

  const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || 'Staff';

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: BG, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        .snav:hover { background: rgba(171,53,0,0.07) !important; color: rgba(255,255,255,0.85) !important; }
        .snav-logout:hover { background: rgba(220,38,38,0.12) !important; color: #fca5a5 !important; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, flexShrink: 0, background: NAVY, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#FF8C00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(255,140,0,0.45)' }}>
              <UtensilsCrossed size={18} color="#fff" strokeWidth={2.2} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.03em', lineHeight: 1 }}>Resto d'ici</p>
              <p style={{ margin: '3px 0 0', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Espace Staff</p>
            </div>
          </div>
        </div>

        {/* Nav label */}
        <div style={{ padding: '16px 18px 7px' }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Navigation</p>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            const tourId = to === '/staff/kds' ? 'staff-kds'
              : to === '/staff/salle'    ? 'staff-salle'
              : to === '/staff/articles' ? 'staff-articles'
              : to === '/staff/caisse'   ? 'staff-caisse'
              : undefined;
            return (
              <NavLink key={to} to={to} className="snav" data-tour={tourId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, textDecoration: 'none', background: active ? TER_L : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.55)', borderLeft: active ? `3px solid ${TER}` : '3px solid transparent', fontSize: 13, fontWeight: active ? 700 : 500, transition: 'all 0.13s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Icon size={15} strokeWidth={active ? 2.3 : 1.8} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 16px' }} />

        {/* Footer */}
        <div style={{ padding: '10px 10px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Bell — notifications */}
          <button
            ref={bellRef}
            data-tour="staff-bell"
            onClick={() => {
              setNotifOpen(v => !v);
              if (!notifOpen) setNotifs(prev => prev.map(n => ({ ...n, read: true })));
            }}
            className="snav"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: notifOpen ? TER_L : 'transparent', border: 'none', cursor: 'pointer', color: unreadCount > 0 ? '#fb923c' : 'rgba(255,255,255,0.45)', width: '100%', transition: 'all 0.13s' }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Bell size={15} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -5, right: -5, background: RED, color: '#fff', fontSize: 8, fontWeight: 900, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, flex: 1, textAlign: 'left' }}>Notifications</span>
            {unreadCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(220,38,38,0.22)', color: '#fca5a5', padding: '1px 7px', borderRadius: 99 }}>{unreadCount}</span>
            )}
          </button>

          {/* Déconnexion */}
          <button
            onClick={() => setLogoutModal(true)}
            className="snav-logout"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.38)', width: '100%', transition: 'all 0.13s', fontSize: 12, fontWeight: 500 }}
          >
            <LogOut size={14} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{ height: 54, flexShrink: 0, background: CARD, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 22px', gap: 10, boxShadow: SH }}>
          {unreadCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, background: RED_L, color: RED, border: '1px solid #FECACA', padding: '4px 10px', borderRadius: 99 }}>
              {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} commande{unreadCount > 1 ? 's' : ''}
            </span>
          )}
          <button
            data-tour="staff-avatar"
            onClick={() => setDrawer(true)}
            title={`Profil — ${fullName}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 5px', borderRadius: 99, border: `1.5px solid ${BORDER}`, background: CARD, cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: SH }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = TER; e.currentTarget.style.boxShadow = `0 0 0 3px ${TER_L}`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = SH; }}
          >
            <Avatar name={fullName} size={30} fontSize={11} />
            <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{fullName}</span>
          </button>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 64px' }}>
          <Outlet />
        </main>
      </div>

      {/* ── Onboarding Tour ── */}
      {showTour && (
        <OnboardingTour
          steps={STAFF_TOUR_STEPS}
          accentColor={TER}
          storageKey={tourKey}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}

      {/* ── Notification Panel ── */}
      {notifOpen && (
        <NotifPanel
          notifs={notifs}
          anchorRef={bellRef}
          onClose={() => setNotifOpen(false)}
          onMarkAllRead={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))}
          onClear={() => setNotifs([])}
        />
      )}

      {/* ── Profile Drawer ── */}
      {drawer && (
        <ProfileDrawer
          user={user}
          onClose={() => setDrawer(false)}
          syncUser={syncUser}
        />
      )}

      {/* ── Logout Modal ── */}
      {logoutModal && (
        <div onClick={() => setLogoutModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: CARD, borderRadius: 22, padding: '26px 26px 22px', width: 310, boxShadow: SH3, border: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: NAVY, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Se déconnecter ?</h3>
              <button onClick={() => setLogoutModal(false)} style={{ width: 28, height: 28, borderRadius: 8, background: BG, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color={MUTED} />
              </button>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: MUTED }}>Vous serez redirigé vers la page de connexion.</p>
            <div style={{ display: 'flex', gap: 9 }}>
              <button onClick={() => setLogoutModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 99, border: `1px solid ${BORDER}`, background: BG, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: MUTED, fontFamily: 'inherit' }}>Annuler</button>
              <button onClick={() => { logout(); navigate('/login'); }} style={{ flex: 1, padding: '11px', borderRadius: 99, border: 'none', background: RED, cursor: 'pointer', fontWeight: 700, color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(220,38,38,0.32)', fontFamily: 'inherit' }}>
                <LogOut size={13} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
