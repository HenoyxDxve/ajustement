/**
 * StocksStaff — Gestion des Stocks (Staff)
 */
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Download, RefreshCw, Plus, Minus, Package } from 'lucide-react';
import { stocksAPI } from '../../services/api';

const SB     = '#5B2318';
const RED    = '#DC2626';
const GREEN  = '#16A34A';
const AMBER  = '#D97706';
const BORDER = '#E5E7EB';

function fmt(n) { return Math.round(Number(n) || 0).toLocaleString('fr-FR'); }

const FOURNISSEURS = ['Metro Cash & Carry', 'Marché Central Abidjan', 'Grossiste Import', 'Fournisseur Local'];

function statutCell(ecart, stock) {
  const qty    = Number(stock.quantitePhysique ?? stock.quantite ?? 0);
  const seuil  = Number(stock.seuilCritique ?? 0);
  if (qty <= seuil || ecart < -5) {
    return <span style={{ background: '#FEE2E2', color: RED, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99 }}>Critique</span>;
  }
  if (ecart < 0) {
    return <span style={{ background: '#FEF3C7', color: AMBER, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99 }}>Ajuster</span>;
  }
  return (
    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 13 }}>
      ✓
    </div>
  );
}

const MVT_ICONS = {
  ENTREE:     { e: '🚚', bg: '#D1FAE5' },
  RECEPTION:  { e: '🚚', bg: '#D1FAE5' },
  AJUSTEMENT: { e: '⚖️', bg: '#EDE9FE' },
  DEDUCTION:  { e: '🧾', bg: '#FEF3C7' },
};

export default function StocksStaff() {
  const [stocks,    setStocks]    = useState([]);
  const [mouvs,    setMouvs]     = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [phys,      setPhys]      = useState({});
  const [savingId,  setSavingId]  = useState('');
  const [savingRec, setSavingRec] = useState(false);
  const [toast,     setToast]     = useState(null);
  const [rec,       setRec]       = useState({ article: '', fournisseur: '', quantite: '', prix: '' });

  const restaurantId = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}')?.restaurant?.id || ''; } catch { return ''; } })();

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    try {
      const [sr, ar] = await Promise.all([
        stocksAPI.getAll({ restaurantId }),
        stocksAPI.getAlerts({ restaurantId }).catch(() => ({ data: [] })),
      ]);
      const list = sr.data || [];
      setStocks(list);
      setAlerts(ar.data || []);
      const init = {};
      list.forEach(s => { init[s.id] = Number(s.quantitePhysique ?? s.quantite ?? 0); });
      setPhys(init);
      const mvts = list
        .flatMap(s => (s.mouvements || []).map(m => ({ ...m, nomArt: s.article?.nom || s.nom || 'Article' })))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20);
      setMouvs(mvts);
    } catch { showToast('err', 'Impossible de charger les stocks.'); }
    finally { setLoading(false); }
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  const handleAdjust = async (stock) => {
    const current = Number(stock.quantitePhysique ?? stock.quantite ?? 0);
    const target  = Number(phys[stock.id]);
    const delta   = target - current;
    if (delta === 0) return;
    setSavingId(stock.id);
    try {
      await stocksAPI.adjust(stock.id, delta, 'Ajustement manuel inventaire');
      showToast('ok', 'Stock ajusté.');
      await load();
    } catch (e) { showToast('err', e.response?.data?.message || 'Erreur ajustement.'); }
    finally { setSavingId(''); }
  };

  const handleReception = async () => {
    if (!rec.article || !rec.quantite) return;
    setSavingRec(true);
    try {
      const match = stocks.find(s => (s.article?.nom || s.nom || '').toLowerCase().includes(rec.article.toLowerCase()));
      if (!match) { showToast('err', 'Article introuvable dans les stocks.'); setSavingRec(false); return; }
      await stocksAPI.entreeStock(match.id, Number(rec.quantite), rec.fournisseur || 'Fournisseur', `Réception — ${rec.fournisseur}`);
      showToast('ok', 'Réception enregistrée.');
      setRec({ article: '', fournisseur: '', quantite: '', prix: '' });
      await load();
    } catch (e) { showToast('err', e.response?.data?.message || 'Erreur réception.'); }
    finally { setSavingRec(false); }
  };

  const critCount = stocks.filter(s => {
    const q = Number(s.quantitePhysique ?? s.quantite ?? 0);
    const t = Number(s.seuilCritique ?? 0);
    return q <= t;
  }).length + alerts.length;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200, background: toast.type === 'ok' ? '#DCFCE7' : '#FEE2E2', border: `1px solid ${toast.type === 'ok' ? '#86EFAC' : '#FECACA'}`, color: toast.type === 'ok' ? '#15803D' : RED, borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: '0 0 3px', fontSize: 22, fontWeight: 800, color: '#1C1917' }}>Gestion des Stocks</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#78716C' }}>Supervision et réapprovisionnement logistique.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {critCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '7px 12px' }}>
              <AlertTriangle size={14} color={AMBER} />
              <span style={{ fontSize: 12, fontWeight: 700, color: AMBER }}>{critCount} articles en rupture imminente</span>
            </div>
          )}
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 'none', background: SB, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Download size={13} /> Bon de Commande PDF
          </button>
          <button onClick={load} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer' }}>
            <RefreshCw size={13} color="#6B7280" />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 295px', gap: 18, alignItems: 'start' }}>

        {/* ── Colonne gauche ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tableau stock */}
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: `1px solid ${BORDER}` }}>
              <Package size={15} color={SB} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1C1917' }}>État des Stocks Actuel</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 8px', borderRadius: 5, fontWeight: 600 }}>TBL-STK-01</span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Chargement…</div>
            ) : stocks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                <Package size={36} color="#D1D5DB" style={{ display: 'block', margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Aucun stock configuré</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      {['ARTICLE', 'CATÉGORIE', 'QTÉ THÉORIQUE', 'QTÉ PHYSIQUE', 'ÉCART', 'STATUT'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: ['QTÉ THÉORIQUE', 'QTÉ PHYSIQUE', 'ÉCART', 'STATUT'].includes(h) ? 'center' : 'left', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map(s => {
                      const theo    = Number(s.quantiteTheorique ?? s.quantite ?? 0);
                      const physVal = Number(phys[s.id] ?? theo);
                      const ecart   = physVal - theo;
                      const isDirty = physVal !== Number(s.quantitePhysique ?? s.quantite ?? 0);
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#1C1917', whiteSpace: 'nowrap' }}>{s.article?.nom || s.nom || 'Article'}</td>
                          <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7280' }}>{s.article?.categorie?.nom || s.categorie || '—'}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#1C1917', textAlign: 'center' }}>{fmt(theo)}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                              <button onClick={() => setPhys(p => ({ ...p, [s.id]: Math.max(0, (p[s.id] ?? theo) - 1) }))} style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={10} color="#374151" /></button>
                              <input
                                type="number" min="0"
                                value={physVal}
                                onChange={e => setPhys(p => ({ ...p, [s.id]: Number(e.target.value) }))}
                                style={{ width: 56, textAlign: 'center', border: `1px solid ${isDirty ? AMBER : BORDER}`, borderRadius: 7, padding: '5px 4px', fontSize: 13, fontWeight: 700, color: '#1C1917', outline: 'none', background: isDirty ? '#FFFBEB' : '#fff' }}
                              />
                              <button onClick={() => setPhys(p => ({ ...p, [s.id]: (p[s.id] ?? theo) + 1 }))} style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={10} color="#374151" /></button>
                            </div>
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: ecart < 0 ? RED : ecart > 0 ? GREEN : '#9CA3AF' }}>
                              {ecart > 0 ? '+' : ''}{ecart}
                            </span>
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                            {isDirty ? (
                              <button onClick={() => handleAdjust(s)} disabled={savingId === s.id} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: AMBER, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                {savingId === s.id ? '…' : 'Ajuster'}
                              </button>
                            ) : statutCell(ecart, s)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Journal mouvements */}
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1C1917' }}>⏱ Journal des Mouvements</span>
              <button style={{ fontSize: 11, color: '#6B7280', border: `1px solid ${BORDER}`, background: '#fff', padding: '4px 10px', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Filtrer</button>
            </div>
            {mouvs.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 36, color: '#9CA3AF', fontSize: 13 }}>Aucun mouvement</p>
            ) : (
              <div style={{ padding: '6px 14px 10px' }}>
                {mouvs.map((m, i) => {
                  const delta = Number(m.quantite ?? m.delta ?? 0);
                  const type  = m.type || (delta > 0 ? 'ENTREE' : 'DEDUCTION');
                  const { e: ico, bg } = MVT_ICONS[type] || { e: '📦', bg: '#F3F4F6' };
                  const label = type === 'ENTREE' || type === 'RECEPTION' ? 'Réception Fournisseur' : type === 'AJUSTEMENT' ? 'Ajustement Inventaire Manuel' : 'Déduction Automatique';
                  const dateStr = m.createdAt
                    ? `${new Date(m.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}, ${new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                    : '';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < mouvs.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{ico}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1C1917' }}>{label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>{dateStr}{m.nomArt ? ` • ${m.nomArt}` : ''}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: delta >= 0 ? GREEN : RED }}>{delta >= 0 ? '+' : ''}{delta}</p>
                        {m.quantiteRestante != null && <p style={{ margin: '1px 0 0', fontSize: 10, color: '#9CA3AF' }}>Restant: {m.quantiteRestante}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne droite : Réception ── */}
        <div style={{ position: 'sticky', top: 72 }}>
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🚚</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1C1917' }}>Réception Marchandises</span>
              </div>
              <span style={{ fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>FRM-REC</span>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Fournisseur */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 5 }}>Fournisseur</label>
                <select value={rec.fournisseur} onChange={e => setRec(r => ({ ...r, fournisseur: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${BORDER}`, fontSize: 13, color: '#374151', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                  <option value="">Sélectionner…</option>
                  {FOURNISSEURS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              {/* Article */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 5 }}>Article</label>
                <input type="text" placeholder="Ex: Pommes de terre Agata" list="arts-list"
                  value={rec.article} onChange={e => setRec(r => ({ ...r, article: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 9, border: `1px solid ${BORDER}`, fontSize: 13, color: '#374151', outline: 'none' }} />
                <datalist id="arts-list">{stocks.map(s => <option key={s.id} value={s.article?.nom || s.nom || ''} />)}</datalist>
              </div>
              {/* Quantité + Prix */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 5 }}>Quantité</label>
                  <input type="number" min="0" placeholder="0"
                    value={rec.quantite} onChange={e => setRec(r => ({ ...r, quantite: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 9, border: `1px solid ${BORDER}`, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 5 }}>Prix Unitaire (FCFA)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    value={rec.prix} onChange={e => setRec(r => ({ ...r, prix: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 9, border: `1px solid ${BORDER}`, fontSize: 13, outline: 'none' }} />
                </div>
              </div>
              {/* Bouton */}
              <button onClick={handleReception} disabled={savingRec || !rec.article || !rec.quantite}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                  background: !rec.article || !rec.quantite ? '#E5E7EB' : SB,
                  color: !rec.article || !rec.quantite ? '#9CA3AF' : '#fff',
                  fontSize: 14, fontWeight: 700, cursor: (!rec.article || !rec.quantite || savingRec) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}>
                <Plus size={15} />{savingRec ? 'Enregistrement…' : 'Enregistrer la réception'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
