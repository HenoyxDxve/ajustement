import { useState, useEffect } from 'react';
import { User, Phone, Mail, Save, CheckCircle, AlertCircle, Camera } from 'lucide-react';

const A  = '#FF8C00';
const AL = '#FFF5E8';
const BOR = 'rgba(0,0,0,0.08)';

function Field({ label, icon: Icon, ...props }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9CA3AF', pointerEvents: 'none' }} />}
        <input {...props} style={{ width: '100%', boxSizing: 'border-box', padding: Icon ? '10px 14px 10px 36px' : '10px 14px', border: `1px solid ${BOR}`, borderRadius: 12, fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit', ...(props.style || {}) }} />
      </div>
    </div>
  );
}

export default function ProfileTab({ user, onSave, orders = [], totalSpent = 0, delivered = [] }) {
  const [form, setForm]       = useState({ nom: '', prenom: '', email: '', telephone: '' });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);
  const initials              = ((user?.prenom || user?.nom || 'U')[0] || 'U').toUpperCase();

  useEffect(() => {
    if (user) setForm({ nom: user.nom || '', prenom: user.prenom || '', email: user.email || '', telephone: user.telephone || '' });
  }, [user]);

  const handleSave = async e => {
    if (e?.preventDefault) e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await onSave(form);
      setMsg({ type: 'ok', text: 'Profil mis à jour avec succès !' });
    } catch (err) {
      setMsg({ type: 'err', text: err?.response?.data?.message || 'Erreur lors de la mise à jour.' });
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${BOR}`, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: A, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', border: `4px solid ${AL}` }}>
              {initials}
            </div>
            <button style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%', background: '#fff', border: `2px solid ${A}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera style={{ width: 11, height: 11, color: A }} />
            </button>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 3px' }}>{user?.prenom || user?.nom || 'Mon profil'}</h2>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{user?.email || ''}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <Field label="Prénom" icon={User} value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Prénom" />
          <Field label="Nom" icon={User} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email" icon={Mail} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
          <Field label="Téléphone" icon={Phone} type="tel" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="+225 XX XX XX XX XX" />
        </div>

        {msg && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: msg.type === 'ok' ? '#F0FDF4' : '#FFF1F2', border: `1px solid ${msg.type === 'ok' ? '#BBF7D0' : '#FECDD3'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            {msg.type === 'ok' ? <CheckCircle style={{ width: 14, height: 14, color: '#16A34A' }} /> : <AlertCircle style={{ width: 14, height: 14, color: '#EF4444' }} />}
            <span style={{ fontSize: 13, color: msg.type === 'ok' ? '#16A34A' : '#EF4444' }}>{msg.text}</span>
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{ marginTop: 18, width: '100%', padding: 12, borderRadius: 14, border: 'none', background: saving ? '#D1D5DB' : A, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {saving ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : <Save style={{ width: 14, height: 14 }} />}
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'Commandes', value: orders.length },
          { label: 'Livrées', value: delivered.length },
          { label: 'Dépensé', value: totalSpent.toLocaleString('fr-FR') + ' F' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${BOR}`, padding: '14px 10px', textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: A, margin: '0 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
