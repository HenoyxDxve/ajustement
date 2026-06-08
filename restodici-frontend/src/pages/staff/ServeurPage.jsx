/* ═══════════════════════════════════════════════════════════════
   ServeurPage.jsx — Interface de prise de commande en salle
   Grille d'articles + panneau panier latéral fixe
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useState } from 'react';
import {
  Search, Plus, Minus, Send, ChevronDown, Users,
  UtensilsCrossed, Clock, CheckCircle, X,
  ChefHat, ShoppingCart, Receipt, Zap, RefreshCw,
} from 'lucide-react';
import { menuAPI, commandesService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

/* ── Palette ── */
const TER     = '#ab3500';
const TER_D   = '#8a2b00';
const TER_L   = 'rgba(171,53,0,0.10)';
const TER_G   = 'linear-gradient(135deg, #ab3500 0%, #ff6b35 100%)';
const NAVY    = '#0F172A';
const MUTED   = '#64748B';
const FAINT   = '#94A3B8';
const BORDER  = '#E2E8F0';
const SURFACE = '#F8FAFC';
const CARD    = '#FFFFFF';
const GREEN   = '#16A34A';

const TABLES = Array.from({ length: 20 }, (_, i) => i + 1);

const STATUS_META = {
  RECUE:        { bg: '#dbeafe', color: '#1d4ed8', label: 'Reçue'       },
  CONFIRMEE:    { bg: '#ede9fe', color: '#6d28d9', label: 'Confirmée'   },
  EN_PREP:      { bg: '#fef3c7', color: '#b45309', label: 'En prép.'    },
  PRETE:        { bg: '#d1fae5', color: '#065f46', label: 'Prête !'     },
  EN_LIVRAISON: { bg: '#fce7f3', color: '#9d174d', label: 'Livraison'   },
};

function fmt(n) { return Math.round(Number(n) || 0).toLocaleString('fr-FR'); }

/* ── Carte article ─────────────────────────────────────────────── */
function ArticleCard({ art, qty, onAdd, onRemove }) {
  const dispo = art.disponible !== false;

  return (
    <div
      style={{
        background: CARD, borderRadius: 20, overflow: 'hidden',
        border: qty > 0 ? `2px solid ${TER}` : `1px solid ${BORDER}`,
        boxShadow: qty > 0 ? `0 4px 20px rgba(171,53,0,0.18)` : '0 2px 10px rgba(15,23,42,0.06)',
        opacity: dispo ? 1 : 0.5, position: 'relative',
        transition: 'transform 0.12s, box-shadow 0.12s, border-color 0.15s',
        cursor: dispo ? 'default' : 'not-allowed',
      }}
      onMouseEnter={e => { if (dispo) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = qty > 0 ? `0 8px 28px rgba(171,53,0,0.25)` : '0 8px 24px rgba(15,23,42,0.1)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = qty > 0 ? `0 4px 20px rgba(171,53,0,0.18)` : '0 2px 10px rgba(15,23,42,0.06)'; }}
    >
      {/* Image zone */}
      <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden', background: '#F1F5F9', flexShrink: 0 }}>
        {art.photoUrl ? (
          <img src={art.photoUrl} alt={art.nom}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg,#FFF5F0,#FFE8D6)' }}>
            <span style={{ fontSize: 40 }}>🍽️</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#D1A89A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Photo à venir</span>
          </div>
        )}

        {/* Overlay rupture */}
        {!dispo && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
            <span style={{ background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 99, letterSpacing: '0.05em' }}>RUPTURE</span>
          </div>
        )}

        {/* Badge quantité */}
        {qty > 0 && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: TER, color: '#fff', fontSize: 12, fontWeight: 900, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', border: '2px solid #fff' }}>
            {qty}
          </div>
        )}

        {/* Catégorie badge */}
        {(art.categorie?.nom || art.categorieNom) && (
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, backdropFilter: 'blur(4px)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {art.categorie?.nom || art.categorieNom}
          </div>
        )}
      </div>

      {/* Info + contrôles */}
      <div style={{ padding: '12px 12px 13px' }}>
        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
          {art.nom}
        </p>
        <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 900, color: TER, letterSpacing: '-0.01em' }}>
          {fmt(art.prix)} <span style={{ fontSize: 10, fontWeight: 600, color: FAINT }}>FCFA</span>
        </p>

        {dispo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: qty > 0 ? 'space-between' : 'flex-end' }}>
            {qty > 0 && (
              <>
                <button onClick={() => onRemove(art)}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${BORDER}`, background: CARD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = SURFACE)}
                  onMouseLeave={e => (e.currentTarget.style.background = CARD)}>
                  <Minus size={12} color={NAVY} />
                </button>
                <span style={{ fontSize: 15, fontWeight: 900, color: NAVY, minWidth: 18, textAlign: 'center' }}>{qty}</span>
              </>
            )}
            <button onClick={() => onAdd(art)}
              style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: TER_G, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px rgba(171,53,0,0.35)`, transition: 'transform 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              <Plus size={13} color="#fff" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ServeurPage — Page principale
   ══════════════════════════════════════════════════════════════════ */
export default function ServeurPage() {
  const { user } = useAuth();
  const restaurantId = [user?.restaurant?.id, user?.restaurantId].find(id => id && id.length > 10) || '';

  const [articles,   setArticles]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('Tous');
  const [cart,       setCart]       = useState({});
  const [table,      setTable]      = useState(1);
  const [couverts,   setCouverts]   = useState(2);
  const [sending,    setSending]    = useState(false);
  const [myOrders,   setMyOrders]   = useState([]);
  const [toast,      setToast]      = useState(null);

  const showToast = (ok, msg) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const params = { cible: 'TOUS', ...(restaurantId ? { restaurantId } : {}) };
        const [mr, cr] = await Promise.all([
          menuAPI.get(params),
          menuAPI.getCategories({ restaurantId }).catch(() => ({ data: [] })),
        ]);
        setArticles(mr.data || []);
        setCategories(cr.data || []);
      } catch { /* */ }
      finally { setLoading(false); }
    })();
  }, [restaurantId]);

  const refreshOrders = () => {
    commandesService.getKDS()
      .then(r => setMyOrders((r.data || []).filter(o => !['LIVREE', 'ANNULEE'].includes(o.statut)).slice(0, 8)))
      .catch(() => {});
  };
  useEffect(() => { refreshOrders(); }, []);

  const allCats = ['Tous', ...categories.map(c => c.nom)];

  const shown = articles.filter(a => {
    const matchSearch = !search || a.nom.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'Tous' || a.categorie?.nom === catFilter || a.categorieNom === catFilter;
    return matchSearch && matchCat;
  });

  const addToCart    = art => setCart(p => ({ ...p, [art.id]: { art, qty: (p[art.id]?.qty || 0) + 1 } }));
  const removeFromCart = art => setCart(p => {
    const qty = (p[art.id]?.qty || 0) - 1;
    if (qty <= 0) { const n = { ...p }; delete n[art.id]; return n; }
    return { ...p, [art.id]: { ...p[art.id], qty } };
  });

  const entries    = Object.values(cart);
  const subtotal   = entries.reduce((s, e) => s + Number(e.art.prix || 0) * e.qty, 0);
  const tva        = Math.round(subtotal - subtotal / 1.18);
  const totalItems = entries.reduce((s, e) => s + e.qty, 0);

  const handleSend = async () => {
    if (entries.length === 0) return;
    setSending(true);
    try {
      await commandesService.create({
        restaurantId,
        lignes: entries.map(e => ({ articleId: e.art.id, quantite: e.qty })),
        modeLivraison: 'SUR_PLACE',
        tableNumber: String(table),
      });
      setCart({});
      showToast(true, `Commande envoyée en cuisine ! Table ${String(table).padStart(2, '0')}`);
      refreshOrders();
    } catch (e) {
      showToast(false, e?.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: SURFACE, fontFamily: "'Manrope', Inter, system-ui, sans-serif", position: 'relative' }}>
      <style>{`
        @keyframes slide-in { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fade-in   { from { opacity:0; } to { opacity:1; } }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 300, animation: 'slide-in 0.25s ease',
          background: toast.ok ? '#ECFDF5' : '#FEF2F2',
          color: toast.ok ? '#065F46' : '#991B1B',
          border: `1px solid ${toast.ok ? '#6EE7B7' : '#FCA5A5'}`,
          borderRadius: 16, padding: '14px 18px',
          fontSize: 13, fontWeight: 700,
          boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
          display: 'flex', alignItems: 'center', gap: 10, maxWidth: 320,
        }}>
          {toast.ok
            ? <CheckCircle size={16} color="#16A34A" style={{ flexShrink: 0 }} />
            : <X size={16} color="#EF4444" style={{ flexShrink: 0 }} />
          }
          {toast.msg}
        </div>
      )}

      {/* ── HERO HEADER ── */}
      <div style={{
        background: TER_G, position: 'relative', overflow: 'hidden',
        padding: '20px 24px 18px',
        boxShadow: '0 4px 20px rgba(171,53,0,0.3)',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '35%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.25)' }}>
              <UtensilsCrossed size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Prise de Commande
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                {articles.length} article{articles.length !== 1 ? 's' : ''} disponible{articles.length !== 1 ? 's' : ''} · Salle
              </p>
            </div>
          </div>

          {/* Sélecteurs table + couverts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Table select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: '10px 14px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span style={{ fontSize: 16 }}>🍽️</span>
              <select
                value={table}
                onChange={e => setTable(Number(e.target.value))}
                style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 800, color: '#fff', background: 'transparent', cursor: 'pointer', WebkitAppearance: 'none' }}>
                {TABLES.map(n => <option key={n} value={n} style={{ color: NAVY, background: '#fff' }}>Table {String(n).padStart(2, '0')}</option>)}
              </select>
              <ChevronDown size={12} color="rgba(255,255,255,0.7)" />
            </div>

            {/* Couverts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: '8px 12px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Users size={14} color="rgba(255,255,255,0.8)" />
              <button
                onClick={() => setCouverts(v => Math.max(1, v - 1))}
                style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Minus size={10} color="#fff" />
              </button>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', minWidth: 18, textAlign: 'center' }}>{couverts}</span>
              <button
                onClick={() => setCouverts(v => v + 1)}
                style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plus size={10} color="#fff" />
              </button>
            </div>

            <button onClick={refreshOrders}
              style={{ width: 40, height: 40, borderRadius: 13, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
              title="Rafraîchir les commandes">
              <RefreshCw size={14} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* ── CORPS ── */}
      <div style={{ padding: '20px 24px 32px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>

        {/* ── PANNEAU MENU ── */}
        <div>
          {/* Barre de recherche */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, padding: '11px 16px', marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', transition: 'border-color 0.15s' }}
            onFocus={() => {}} onClick={() => document.getElementById('search-serveur')?.focus()}>
            <Search size={15} color={FAINT} style={{ flexShrink: 0 }} />
            <input
              id="search-serveur"
              type="text" placeholder="Rechercher un plat…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: NAVY, background: 'transparent', fontFamily: 'inherit' }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background: BORDER, border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={10} color={MUTED} />
              </button>
            )}
          </div>

          {/* Chips catégories */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
            {allCats.map(c => {
              const active = c === catFilter;
              return (
                <button key={c} onClick={() => setCatFilter(c)}
                  style={{
                    padding: '8px 18px', borderRadius: 99,
                    border: active ? 'none' : `1.5px solid ${BORDER}`,
                    background: active ? TER_G : CARD,
                    color: active ? '#fff' : MUTED,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: active ? '0 3px 12px rgba(171,53,0,0.35)' : '0 1px 4px rgba(0,0,0,0.05)',
                    transform: active ? 'scale(1.03)' : 'scale(1)',
                    transition: 'all 0.14s',
                  }}>
                  {c}
                </button>
              );
            })}
          </div>

          {/* Compteur résultats */}
          {!loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 12, color: MUTED, fontWeight: 600 }}>
                {shown.length} article{shown.length !== 1 ? 's' : ''}
                {search && ` pour "${search}"`}
                {catFilter !== 'Tous' && ` · ${catFilter}`}
              </p>
              {totalItems > 0 && (
                <p style={{ margin: 0, fontSize: 12, color: TER, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ShoppingCart size={12} />
                  {totalItems} article{totalItems > 1 ? 's' : ''} au panier
                </p>
              )}
            </div>
          )}

          {/* Grille articles */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ width: 40, height: 40, border: `4px solid ${TER_L}`, borderTopColor: TER, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
              <p style={{ fontSize: 14, color: MUTED, fontWeight: 600, margin: 0 }}>Chargement du menu…</p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : shown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: TER_L, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <ChefHat size={24} color={TER} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>Aucun article trouvé</p>
              <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>Essayez une autre recherche ou catégorie.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
              {shown.map(a => (
                <ArticleCard key={a.id} art={a} qty={cart[a.id]?.qty || 0} onAdd={addToCart} onRemove={removeFromCart} />
              ))}
            </div>
          )}
        </div>

        {/* ── PANNEAU PANIER ── */}
        <div style={{ position: 'sticky', top: 20 }}>

          {/* Cart card */}
          <div style={{ background: CARD, border: entries.length > 0 ? `1.5px solid ${TER}22` : `1px solid ${BORDER}`, borderRadius: 24, overflow: 'hidden', boxShadow: entries.length > 0 ? '0 8px 32px rgba(171,53,0,0.12)' : '0 2px 12px rgba(0,0,0,0.07)' }}>

            {/* En-tête panier */}
            <div style={{ background: entries.length > 0 ? TER_G : `linear-gradient(135deg, #1E293B, #0F172A)`, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', gap: 10, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Receipt size={17} color="#fff" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Commande en cours</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                      Table {String(table).padStart(2, '0')} · {couverts} couvert{couverts > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {entries.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 800, color: '#fff', backdropFilter: 'blur(4px)' }}>
                    {totalItems} art.
                  </div>
                )}
              </div>
            </div>

            {/* Lignes panier */}
            <div style={{ padding: '12px 16px', minHeight: 80, maxHeight: 320, overflowY: 'auto' }}>
              {entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <ShoppingCart size={20} color={FAINT} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: FAINT, margin: 0 }}>Panier vide</p>
                  <p style={{ fontSize: 11, color: FAINT, margin: '4px 0 0' }}>Ajoutez des articles depuis le menu.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {entries.map(e => (
                    <div key={e.art.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}` }}>
                      {/* Thumb */}
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F1F5F9', overflow: 'hidden', flexShrink: 0 }}>
                        {e.art.photoUrl
                          ? <img src={e.art.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          : <span style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🍽️</span>
                        }
                      </div>

                      {/* Nom + prix */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.art.nom}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: TER, fontWeight: 800 }}>
                          {fmt(e.art.prix * e.qty)} FCFA
                        </p>
                      </div>

                      {/* Qtés */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => removeFromCart(e.art)}
                          style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${BORDER}`, background: CARD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={10} color={NAVY} />
                        </button>
                        <span style={{ fontSize: 14, fontWeight: 900, color: NAVY, minWidth: 16, textAlign: 'center' }}>{e.qty}</span>
                        <button onClick={() => addToCart(e.art)}
                          style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: TER_G, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(171,53,0,0.3)' }}>
                          <Plus size={10} color="#fff" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totaux */}
            <div style={{ padding: '14px 18px 16px', borderTop: `1px solid ${BORDER}`, background: '#FAFAFA' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>Sous-total HT</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{fmt(subtotal - tva)} FCFA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>TVA 18%</span>
                <span style={{ fontSize: 12, color: MUTED }}>{fmt(tva)} FCFA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: entries.length > 0 ? TER_L : SURFACE, borderRadius: 14, border: `1px solid ${entries.length > 0 ? TER + '30' : BORDER}` }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>Total TTC</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: entries.length > 0 ? TER : MUTED, letterSpacing: '-0.02em' }}>
                  {fmt(subtotal)} <span style={{ fontSize: 12, fontWeight: 600 }}>FCFA</span>
                </span>
              </div>
            </div>

            {/* Bouton envoyer */}
            <div style={{ padding: '0 16px 18px' }}>
              <button
                onClick={handleSend}
                disabled={entries.length === 0 || sending}
                style={{
                  width: '100%', padding: '15px', borderRadius: 16, border: 'none',
                  background: entries.length === 0
                    ? '#E2E8F0'
                    : sending
                      ? 'linear-gradient(135deg, #8a2b00, #cc5522)'
                      : TER_G,
                  color: entries.length === 0 ? MUTED : '#fff',
                  fontSize: 15, fontWeight: 800,
                  cursor: entries.length === 0 || sending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: entries.length > 0 ? '0 6px 22px rgba(171,53,0,0.42)' : 'none',
                  transition: 'all 0.15s', letterSpacing: '0.01em',
                }}>
                {sending ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Envoyer en Cuisine
                  </>
                )}
              </button>
              {entries.length > 0 && (
                <button onClick={() => setCart({})}
                  style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 12, border: `1px solid ${BORDER}`, background: CARD, color: MUTED, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Vider le panier
                </button>
              )}
            </div>
          </div>

          {/* ── Tables en cours ── */}
          {myOrders.length > 0 && (
            <div style={{ marginTop: 14, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '13px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: TER_L, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={12} color={TER} />
                </div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: NAVY }}>Tables en cours</p>
                <span style={{ marginLeft: 'auto', background: TER, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>
                  {myOrders.length}
                </span>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {myOrders.map(o => {
                  const meta = STATUS_META[o.statut] || { bg: '#F3F4F6', color: MUTED, label: o.statut };
                  const isPrete = o.statut === 'PRETE';
                  return (
                    <div key={o.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 12,
                      background: isPrete ? '#F0FDF4' : SURFACE,
                      border: isPrete ? '1px solid #86EFAC' : `1px solid ${BORDER}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isPrete
                          ? <Zap size={13} color="#16A34A" />
                          : <ChefHat size={13} color={MUTED} />
                        }
                        <span style={{ fontSize: 13, fontWeight: 700, color: isPrete ? '#16A34A' : NAVY }}>
                          {o.tableNumero ? `Table ${String(o.tableNumero).padStart(2, '0')}` : `#${o.numero || o.id?.slice(0, 5)}`}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, background: meta.bg, color: meta.color, padding: '3px 10px', borderRadius: 99 }}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
