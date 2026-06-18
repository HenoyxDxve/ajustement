import { useEffect, useState } from 'react';
import { X, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { livraisonsExtAPI } from '../../services/api';

export default function DispatchModal({ commande, onClose, onDispatched }) {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [fournisseurId, setFournisseurId] = useState('');
  const [adresse, setAdresse] = useState(commande?.adresseLivraison || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    livraisonsExtAPI.getFournisseurs()
      .then(r => {
        const actifs = (r.data || []).filter(f => f.actif);
        setFournisseurs(actifs);
        if (actifs.length > 0) setFournisseurId(actifs[0].id);
      })
      .catch(() => setFournisseurs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDispatch = async () => {
    if (!fournisseurId) { setError('Sélectionnez un fournisseur'); return; }
    setSaving(true); setError('');
    try {
      await livraisonsExtAPI.dispatch({
        commandeId: commande.id,
        fournisseurId,
        adresseLivraison: adresse || undefined,
      });
      setSuccess(true);
      setTimeout(() => { onDispatched?.(); onClose(); }, 1500);
    } catch (e) {
      setError(e?.response?.data?.message || 'Dispatch impossible');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)', zIndex: 990 }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 20, width: 440, maxWidth: '95vw',
        zIndex: 991, boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FF8C0018', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck style={{ width: 16, height: 16, color: '#FF8C00' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Dispatcher la livraison</h3>
              <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>Commande #{commande?.numero}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ padding: '20px 22px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckCircle style={{ width: 40, height: 40, color: '#10B981', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Commande dispatchée !</p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>Le livreur va prendre en charge la commande.</p>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8', fontSize: 13 }}>Chargement des fournisseurs…</div>
          ) : fournisseurs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <AlertTriangle style={{ width: 28, height: 28, color: '#F59E0B', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>Aucun fournisseur de livraison actif</p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>Configurez un fournisseur dans le tableau de bord admin → Livraisons ext.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Fournisseur *</label>
                <select
                  value={fournisseurId}
                  onChange={e => setFournisseurId(e.target.value)}
                  style={{ width: '100%', border: '1px solid #D1D9E6', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', background: '#fff' }}
                >
                  {fournisseurs.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nom} ({f.type}){f.fraisLivraisonDefaut ? ` — ${Number(f.fraisLivraisonDefaut).toLocaleString('fr-FR')} FCFA` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Adresse de livraison</label>
                <input
                  type="text"
                  value={adresse}
                  onChange={e => setAdresse(e.target.value)}
                  placeholder="Ex : Cocody Riviera 3, Villa 42"
                  style={{ width: '100%', border: '1px solid #D1D9E6', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {!success && fournisseurs.length > 0 && !loading && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onClose} style={{ border: '1px solid #D1D9E6', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 600, background: '#fff', cursor: 'pointer', color: '#64748B' }}>
              Annuler
            </button>
            <button
              onClick={handleDispatch}
              disabled={saving || !fournisseurId}
              style={{ border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 700, background: '#FF8C00', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 7 }}
            >
              {saving ? 'Dispatch…' : <><Truck style={{ width: 14, height: 14 }} /> Dispatcher</>}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
