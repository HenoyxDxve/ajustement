import { useState, useEffect } from 'react';
import { CreditCard, Phone, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { paiementsAPI } from '../../services/api';

import orangeMoneyLogo  from '../../assets/payments/orange-money.svg';
import mtnMomoLogo      from '../../assets/payments/mtn-momo.svg';
import moovMoneyLogo    from '../../assets/payments/moov-money.svg';
import carteBancaireLogo from '../../assets/payments/carte-bancaire.svg';

const A   = '#FF8C00';
const AL  = '#FFF5E8';
const BOR = 'rgba(0,0,0,0.08)';

const PROVIDER_META = {
  ORANGE: { logo: orangeMoneyLogo,   color: '#FF6600', bg: '#FFF3EB', label: 'Orange Money',  needsPhone: true  },
  MOMO:   { logo: mtnMomoLogo,       color: '#FFCC00', bg: '#FFFDE6', label: 'MTN MoMo',       needsPhone: true  },
  MOOV:   { logo: moovMoneyLogo,     color: '#0066CC', bg: '#E6F0FF', label: 'Moov Money',     needsPhone: true  },
  WAVE:   { logo: null,              color: '#1DA1F2', bg: '#E8F5FD', label: 'Wave',            needsPhone: false },
  CARTE:  { logo: carteBancaireLogo, color: '#1A1A2E', bg: '#F0F0F5', label: 'Carte Bancaire', needsPhone: false },
};

const genericMeta = m => ({
  logo: null,
  color: '#6B7280',
  bg: '#F9FAFB',
  label: m.label || m.id,
  needsPhone: m.needsPhone ?? false,
});

function WaveLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#1DA1F2" />
      <text x="50" y="66" textAnchor="middle" fontSize="46" fontWeight="bold" fill="white">W</text>
    </svg>
  );
}

function MethodCard({ method }) {
  const meta      = PROVIDER_META[method.provider] || genericMeta(method);
  const [tel, setTel] = useState('');
  const [added, setAdded] = useState(false);

  const handleSave = () => {
    if (meta.needsPhone && !tel.trim()) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${BOR}`, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${BOR}` }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {meta.logo ? (
            <img src={meta.logo} alt={meta.label} style={{ width: 28, height: 28, objectFit: 'contain' }} />
          ) : method.provider === 'WAVE' ? (
            <WaveLogo />
          ) : (
            <CreditCard style={{ width: 20, height: 20, color: meta.color }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0 }}>{meta.label}</p>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{meta.needsPhone ? 'Paiement mobile' : 'Paiement digital'}</p>
        </div>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
      </div>
      {meta.needsPhone && (
        <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Phone style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#9CA3AF' }} />
            <input value={tel} onChange={e => setTel(e.target.value)} placeholder="Numéro lié" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 30px', border: `1px solid ${BOR}`, borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <button onClick={handleSave} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: added ? '#22C55E' : A, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, transition: 'background 0.2s' }}>
            {added ? <CheckCircle style={{ width: 12, height: 12 }} /> : <Plus style={{ width: 12, height: 12 }} />}
            {added ? 'Ajouté' : 'Associer'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PaymentTab() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    paiementsAPI.getMethods()
      .then(r => {
        const list = r.data?.methods || r.data || [];
        setMethods(Array.isArray(list) ? list : []);
      })
      .catch(() => setError('Impossible de charger les modes de paiement.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>Modes de paiement</h2>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Moyens de paiement disponibles via l'agrégateur NovaSend</p>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 72, borderRadius: 18, background: '#F3F4F6' }} />)}
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '14px 18px', borderRadius: 14, background: '#FFF1F2', border: '1px solid #FECDD3', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#EF4444' }} />
          <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>
        </div>
      )}

      {!loading && !error && methods.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 20, border: `1px dashed ${BOR}` }}>
          <CreditCard style={{ width: 36, height: 36, color: '#E5E7EB', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#9CA3AF', margin: '0 0 6px' }}>Aucun moyen de paiement</p>
          <p style={{ fontSize: 12, color: '#D1D5DB', margin: 0 }}>L'administrateur n'a pas encore configuré de méthode de paiement.</p>
        </div>
      )}

      {!loading && methods.map((m, i) => (
        <MethodCard key={m.id || m.provider || i} method={m} />
      ))}

      {!loading && methods.length > 0 && (
        <div style={{ padding: '12px 16px', borderRadius: 14, background: AL, border: `1px solid ${A}22`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <CheckCircle style={{ width: 14, height: 14, color: A, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
            Vos paiements sont sécurisés via NovaSend. Les informations de paiement ne sont jamais stockées sur nos serveurs.
          </p>
        </div>
      )}
    </div>
  );
}
