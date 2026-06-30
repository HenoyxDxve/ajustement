import SecurityPanel from '../../components/security/SecurityPanel';

const BOR = 'rgba(0,0,0,0.08)';

export default function SecurityTab({ user }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>Sécurité</h2>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Mot de passe et double authentification</p>
      </div>
      <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${BOR}`, padding: 20 }}>
        <SecurityPanel user={user} accentColor="#FF8C00" />
      </div>
    </div>
  );
}
