import { useState } from 'react';
import { MapPin, Home, Briefcase, MoreHorizontal, Plus, Check, Trash2, Pencil, X, Star } from 'lucide-react';
import DeliveryMap from '../../components/maps/DeliveryMap';

const A   = '#FF8C00';
const AL  = '#FFF5E8';
const AD  = '#E07A00';
const BOR = 'rgba(0,0,0,0.08)';

const TYPE_META = {
  home:  { icon: Home,        label: 'Domicile',   color: '#3B82F6', bg: '#EFF6FF' },
  work:  { icon: Briefcase,   label: 'Travail',    color: '#8B5CF6', bg: '#F5F3FF' },
  other: { icon: MoreHorizontal, label: 'Autre',  color: '#6B7280', bg: '#F9FAFB' },
};

function AddressCard({ addr, onEdit, onRemove, onSetDefault }) {
  const meta = TYPE_META[addr.type] || TYPE_META.other;
  const Icon = meta.icon;
  return (
    <div style={{ background: '#fff', border: addr.isDefault ? `2px solid ${A}` : `1px solid ${BOR}`, borderRadius: 18, overflow: 'hidden' }}>
      {addr.lat && addr.lng && (
        <div style={{ height: 100, pointerEvents: 'none' }}>
          <DeliveryMap value={{ lat: addr.lat, lng: addr.lng, address: addr.adresse }} onChange={() => {}} heightClassName="h-full" />
        </div>
      )}
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon style={{ width: 14, height: 14, color: meta.color }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', margin: 0 }}>{addr.label}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{addr.adresse}</p>
          </div>
          {addr.isDefault && (
            <span style={{ padding: '2px 8px', borderRadius: 20, background: AL, color: A, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>Défaut</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
          {!addr.isDefault && (
            <button onClick={() => onSetDefault(addr.id)} style={{ flex: 1, padding: 7, borderRadius: 9, border: `1px solid ${BOR}`, background: '#F9FAFB', fontSize: 11, fontWeight: 700, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Star style={{ width: 11, height: 11 }} />Par défaut
            </button>
          )}
          <button onClick={() => onEdit(addr)} style={{ flex: 1, padding: 7, borderRadius: 9, border: 'none', background: AL, fontSize: 11, fontWeight: 700, color: AD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Pencil style={{ width: 11, height: 11 }} />Modifier
          </button>
          <button onClick={() => onRemove(addr.id)} style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Trash2 style={{ width: 12, height: 12, color: '#EF4444' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

const emptyForm = () => ({ id: '', label: '', adresse: '', type: 'home', isDefault: false, lat: undefined, lng: undefined });

export default function AddressesTab({ savedAddresses = [], onAdd, onEdit, onRemove, onSetDefault }) {
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(emptyForm());
  const [mapValue, setMapValue]   = useState(null);
  const [saving, setSaving]       = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setMapValue(null);
    setShowForm(true);
  };

  const openEdit = addr => {
    setEditing(addr.id);
    setForm({ ...addr });
    setMapValue(addr.lat && addr.lng ? { lat: addr.lat, lng: addr.lng, address: addr.adresse } : null);
    setShowForm(true);
  };

  const handleMapChange = loc => {
    setMapValue(loc);
    setForm(f => ({ ...f, lat: loc.lat, lng: loc.lng, adresse: loc.address || f.adresse }));
  };

  const handleSubmit = async e => {
    e?.preventDefault();
    if (!form.label.trim() || !form.adresse.trim()) return;
    setSaving(true);
    try {
      const entry = { ...form, id: editing || String(Date.now()) };
      if (editing) await onEdit(entry);
      else         await onAdd(entry);
      setShowForm(false);
    } catch (err) {
      alert(err?.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 2px' }}>Mes adresses</h2>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{savedAddresses.length} adresse{savedAddresses.length !== 1 ? 's' : ''} enregistrée{savedAddresses.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 12, border: 'none', background: A, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus style={{ width: 14, height: 14 }} />Ajouter
        </button>
      </div>

      {savedAddresses.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 20, border: `1px dashed ${BOR}` }}>
          <MapPin style={{ width: 36, height: 36, color: '#E5E7EB', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#9CA3AF', margin: '0 0 6px' }}>Aucune adresse enregistrée</p>
          <p style={{ fontSize: 12, color: '#D1D5DB', margin: '0 0 16px' }}>Ajoutez une adresse pour faciliter vos commandes</p>
          <button onClick={openNew} style={{ padding: '9px 20px', borderRadius: 12, border: 'none', background: A, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Ajouter une adresse</button>
        </div>
      )}

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${BOR}`, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0 }}>{editing ? 'Modifier l\'adresse' : 'Nouvelle adresse'}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X style={{ width: 16, height: 16, color: '#9CA3AF' }} />
            </button>
          </div>

          <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 14, height: 200 }}>
            <DeliveryMap value={mapValue} onChange={handleMapChange} heightClassName="h-full" />
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {Object.entries(TYPE_META).map(([k, v]) => {
              const Icon = v.icon;
              const sel  = form.type === k;
              return (
                <button key={k} onClick={() => setForm(f => ({ ...f, type: k }))} style={{ flex: 1, padding: '8px 0', borderRadius: 12, border: sel ? `2px solid ${A}` : `1px solid ${BOR}`, background: sel ? AL : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Icon style={{ width: 14, height: 14, color: sel ? A : v.color }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: sel ? A : '#6B7280' }}>{v.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Nom (ex: Maison, Bureau...)" style={{ padding: '10px 14px', border: `1px solid ${BOR}`, borderRadius: 12, fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
            <input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Adresse complète" style={{ padding: '10px 14px', border: `1px solid ${BOR}`, borderRadius: 12, fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600 }}>
              <div onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))} style={{ width: 18, height: 18, borderRadius: 5, border: form.isDefault ? 'none' : `2px solid ${BOR}`, background: form.isDefault ? A : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {form.isDefault && <Check style={{ width: 10, height: 10, color: '#fff' }} />}
              </div>
              Définir comme adresse par défaut
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 10, borderRadius: 12, border: `1px solid ${BOR}`, background: '#F9FAFB', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Annuler</button>
            <button onClick={handleSubmit} disabled={saving || !form.label.trim() || !form.adresse.trim()} style={{ flex: 2, padding: 10, borderRadius: 12, border: 'none', background: (saving || !form.label.trim() || !form.adresse.trim()) ? '#D1D5DB' : A, fontSize: 13, fontWeight: 700, color: '#fff', cursor: (saving || !form.label.trim() || !form.adresse.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {saving ? <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : <Check style={{ width: 13, height: 13 }} />}
              {editing ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {savedAddresses.map(addr => (
          <AddressCard key={addr.id} addr={addr} onEdit={openEdit} onRemove={onRemove} onSetDefault={onSetDefault} />
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
