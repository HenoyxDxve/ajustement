import { useEffect, useState } from 'react';
import { Search, Plus, Minus, Send, ChevronDown, Users } from 'lucide-react';
import { menuAPI, commandesService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

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
const RED    = '#b91c1c';
const SH     = '0 1px 3px rgba(15,23,42,0.07),0 1px 2px rgba(15,23,42,0.04)';
const SH2    = '0 4px 16px rgba(15,23,42,0.10),0 2px 4px rgba(15,23,42,0.06)';

// Compat aliases
const T = {
  primary: TER, primaryContainer: '#ff6b35', primaryGlow: 'rgba(171,53,0,0.28)',
  primaryLight: TER_L, secondary: GREEN, red: RED,
  surface: BG, surfaceLow: BG, surfaceHigh: BORDER,
  onSurface: NAVY, onSurfaceVariant: MUTED,
};

function fmt(n) { return Math.round(Number(n) || 0).toLocaleString('fr-FR'); }

const TABLES = Array.from({ length: 20 }, (_, i) => i + 1);

const STATUS_META = {
  RECUE:        { bg: '#dbeafe', color: '#1d4ed8', label: 'Reçue' },
  CONFIRMEE:    { bg: '#ede9fe', color: '#6d28d9', label: 'Confirmée' },
  EN_PREP:      { bg: '#fef3c7', color: '#b45309', label: 'En prép.' },
  PRETE:        { bg: '#d1fae5', color: '#065f46', label: 'Prête' },
  EN_LIVRAISON: { bg: '#fce7f3', color: '#9d174d', label: 'Livraison' },
};

// ─── Carte article ─────────────────────────────────────────────────────────────
function ArticleCard({ art, qty, onAdd, onRemove }) {
  const dispo = art.disponible !== false;

  return (
    <div style={{
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 18,
      overflow: 'hidden',
      opacity: dispo ? 1 : 0.5,
      position: 'relative',
      transition: 'transform 0.12s, box-shadow 0.12s',
      boxShadow: SH2,
    }}
      onMouseEnter={e => { if (dispo) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: '100%', height: 112, overflow: 'hidden', background: T.surfaceHigh }}>
        {art.photoUrl ? (
          <img src={art.photoUrl} alt={art.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🍽️</div>
        )}
        {!dispo && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ background: T.red, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99 }}>Rupture</span>
          </div>
        )}
        {qty > 0 && (
          <span style={{ position: 'absolute', top: 7, left: 7, background: T.primary, color: '#fff', fontSize: 11, fontWeight: 900, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
            {qty}
          </span>
        )}
      </div>

      <div style={{ padding: '8px 10px 10px' }}>
        <p style={{ margin: '0 0 1px', fontSize: 12, fontWeight: 700, color: T.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {art.nom}
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: T.primary }}>
          {fmt(art.prix)} F
        </p>

        {dispo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: qty > 0 ? 'space-between' : 'flex-end' }}>
            {qty > 0 && (
              <>
                <button
                  onClick={() => onRemove(art)}
                  style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: T.surfaceHigh, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Minus size={11} color={T.onSurface} />
                </button>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.onSurface, minWidth: 14, textAlign: 'center' }}>{qty}</span>
              </>
            )}
            <button
              onClick={() => onAdd(art)}
              style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: T.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(171,53,0,0.35)' }}
            >
              <Plus size={11} color="#fff" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ServeurPage() {
  const { user } = useAuth();
  // Résolution stricte du restaurantId — on prend le premier UUID valide
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

  const entries  = Object.values(cart);
  const subtotal = entries.reduce((s, e) => s + Number(e.art.prix || 0) * e.qty, 0);
  const tva      = Math.round(subtotal - subtotal / 1.18);

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
      showToast(true, 'Commande envoyée en cuisine !');
      refreshOrders();
    } catch (e) {
      showToast(false, e?.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: 'relative', fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 300,
          background: toast.ok ? '#d1fae5' : '#fee2e2',
          color: toast.ok ? T.secondary : T.red,
          borderRadius: 14, padding: '12px 18px',
          fontSize: 13, fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        }}>
          {toast.ok ? '✓ ' : '⚠ '}{toast.msg}
        </div>
      )}

      {/* ── En-tête de page ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.onSurface, letterSpacing: '-0.5px' }}>
            Prise de Commande
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: T.onSurfaceVariant }}>
            Sélectionnez une table et composez la commande
          </p>
        </div>

        {/* Sélecteurs table + couverts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Table */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.surfaceLow, borderRadius: 12, padding: '8px 14px' }}>
            <span style={{ fontSize: 15 }}>🍽️</span>
            <select
              value={table}
              onChange={e => setTable(Number(e.target.value))}
              style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 700, color: T.onSurface, background: 'transparent', cursor: 'pointer' }}
            >
              {TABLES.map(n => <option key={n} value={n}>Table {String(n).padStart(2, '0')}</option>)}
            </select>
            <ChevronDown size={12} color={T.onSurfaceVariant} />
          </div>

          {/* Couverts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.surfaceLow, borderRadius: 12, padding: '8px 14px' }}>
            <Users size={14} color={T.onSurfaceVariant} />
            <button
              onClick={() => setCouverts(v => Math.max(1, v - 1))}
              style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: T.surfaceHigh, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            ><Minus size={10} color={T.onSurface} /></button>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.onSurface, minWidth: 16, textAlign: 'center' }}>{couverts}</span>
            <button
              onClick={() => setCouverts(v => v + 1)}
              style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: T.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            ><Plus size={10} color="#fff" /></button>
          </div>
        </div>
      </div>

      {/* ── Corps : menu + panier ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' }}>

        {/* ── Panneau menu ── */}
        <div>
          {/* Barre de recherche */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.surfaceLow, borderRadius: 12, padding: '9px 14px', marginBottom: 14 }}>
            <Search size={13} color={T.onSurfaceVariant} />
            <input
              type="text"
              placeholder="Rechercher un plat…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: T.onSurface, background: 'transparent', fontFamily: 'inherit' }}
            />
          </div>

          {/* Chips catégories */}
          <div style={{ display: 'flex', gap: 7, marginBottom: 18, overflowX: 'auto', paddingBottom: 2 }}>
            {allCats.map(c => {
              const active = c === catFilter;
              return (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  style={{
                    padding: '7px 16px', borderRadius: 99, border: 'none',
                    background: active ? T.primary : T.surfaceHigh,
                    color: active ? '#fff' : T.onSurfaceVariant,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    transform: active ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.14s',
                    fontFamily: 'inherit',
                  }}
                >{c}</button>
              );
            })}
          </div>

          {/* Grille articles */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: T.onSurfaceVariant, fontSize: 14 }}>
              Chargement du menu…
            </div>
          ) : shown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: T.onSurfaceVariant, fontSize: 14 }}>
              Aucun article trouvé
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 12 }}>
              {shown.map(a => (
                <ArticleCard
                  key={a.id}
                  art={a}
                  qty={cart[a.id]?.qty || 0}
                  onAdd={addToCart}
                  onRemove={removeFromCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Panneau panier ── */}
        <div style={{ position: 'sticky', top: 76 }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 22, overflow: 'hidden', boxShadow: SH2 }}>

            {/* En-tête panier */}
            <div style={{ padding: '14px 16px', background: T.surfaceLow }}>
              <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 800, color: T.onSurface }}>Commande en cours</p>
              <p style={{ margin: 0, fontSize: 12, color: T.onSurfaceVariant }}>
                Table {String(table).padStart(2, '0')} · {couverts} couvert{couverts > 1 ? 's' : ''}
              </p>
            </div>

            {/* Lignes */}
            <div style={{ padding: '10px 14px', minHeight: 80, maxHeight: 280, overflowY: 'auto' }}>
              {entries.length === 0 ? (
                <p style={{ textAlign: 'center', color: T.surfaceHigh, padding: '24px 0', fontSize: 13 }}>
                  — Panier vide —
                </p>
              ) : entries.map(e => (
                <div key={e.art.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: T.surfaceLow, overflow: 'hidden', flexShrink: 0 }}>
                    {e.art.imageUrl
                      ? <img src={e.art.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      : <span style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🍽️</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.art.nom}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: T.primary, fontWeight: 700 }}>
                      {fmt(e.art.prix * e.qty)} F
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <button
                      onClick={() => removeFromCart(e.art)}
                      style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: T.surfaceHigh, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    ><Minus size={10} color={T.onSurface} /></button>
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.onSurface, minWidth: 14, textAlign: 'center' }}>{e.qty}</span>
                    <button
                      onClick={() => addToCart(e.art)}
                      style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: T.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    ><Plus size={10} color="#fff" /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totaux */}
            <div style={{ padding: '10px 16px 12px', background: T.surfaceLow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: T.onSurfaceVariant }}>Sous-total HT</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.onSurface }}>{fmt(subtotal - tva)} F</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: T.onSurfaceVariant }}>TVA 18%</span>
                <span style={{ fontSize: 12, color: T.onSurfaceVariant }}>{fmt(tva)} F</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${T.surfaceHigh}` }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.onSurface }}>Total TTC</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: T.primary }}>{fmt(subtotal)} F</span>
              </div>
            </div>

            {/* Bouton envoyer */}
            <div style={{ padding: '12px 14px' }}>
              <button
                onClick={handleSend}
                disabled={entries.length === 0 || sending}
                style={{
                  width: '100%', padding: '13px', borderRadius: 99, border: 'none',
                  background: entries.length === 0 ? T.surfaceHigh : `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryContainer} 100%)`,
                  color: entries.length === 0 ? T.onSurfaceVariant : '#fff',
                  fontSize: 14, fontWeight: 800,
                  cursor: entries.length === 0 || sending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: entries.length > 0 ? '0 4px 16px rgba(171,53,0,0.35)' : 'none',
                  transition: 'all 0.14s',
                  fontFamily: 'inherit',
                }}
              >
                <Send size={15} />
                {sending ? 'Envoi en cours…' : 'Envoyer en Cuisine'}
              </button>
            </div>
          </div>

          {/* ── Commandes en cours ── */}
          {myOrders.length > 0 && (
            <div style={{ marginTop: 14, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 22, padding: '14px 16px', boxShadow: SH2 }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, textTransform: 'uppercase', fontWeight: 700, color: T.onSurfaceVariant, letterSpacing: '0.12em' }}>
                Tables en cours
              </p>
              {myOrders.map(o => {
                const meta = STATUS_META[o.statut] || { bg: T.surfaceHigh, color: T.onSurfaceVariant, label: o.statut };
                return (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.onSurface }}>
                      {o.tableNumero ? `Table ${String(o.tableNumero).padStart(2, '0')}` : `#${o.numero || o.id?.slice(0, 5)}`}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, background: meta.bg, color: meta.color, padding: '2px 9px', borderRadius: 99 }}>
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
