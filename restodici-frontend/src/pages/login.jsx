// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, CheckCircle, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, syncUser } = useAuth();

  const [formData, setFormData]   = useState({ email: '', password: '' });
  const [errors, setErrors]       = useState({});
  const [isSubmitting, setSubmit] = useState(false);
  const [showPassword, setShowPw] = useState(false);
  const [twoFactorStep, set2FA]   = useState(false);
  const [tempToken, setTemp]      = useState('');
  const [twoFactorCode, set2FACode] = useState('');

  const redirectParam = searchParams.get('redirect') || location.state?.redirect || '/';
  const registered    = searchParams.get('registered') === '1';
  const verifyEmailCta = errors.verifyEmailCta === true;

  const validate = () => {
    const e = {};
    const email = formData.email.trim();
    const pwd   = formData.password.trim();
    if (!email) e.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email invalide';
    if (!pwd) e.password = 'Mot de passe requis';
    else if (pwd.length < 6) e.password = 'Minimum 6 caractères';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const redirectAfterLogin = (user) => {
    const role = user.role?.toUpperCase();
    if (redirectParam === 'checkout') navigate('/checkout');
    else if (role === 'ADMIN')  navigate('/admin');
    else if (role === 'GERANT') navigate('/gerant');
    else if (role === 'B2B')    navigate('/b2b/dashboard');
    else if (role === 'STAFF')  navigate('/staff');
    else navigate('/menu');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmit(true);
    try {
      const result = await login(formData.email.trim(), formData.password.trim());
      if (!result.success) {
        if (result.requiresTwoFactor && result.tempToken) {
          setTemp(result.tempToken); set2FA(true); setSubmit(false); return;
        }
        setErrors({ submit: result.error || 'Identifiants incorrects' });
        return;
      }
      redirectAfterLogin(result.user);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (typeof msg === 'string' && msg.toLowerCase().includes('email non vérifié')) {
        setErrors({ submit: msg, verifyEmailCta: true });
      } else {
        setErrors({ submit: msg || 'Erreur lors de la connexion' });
      }
    } finally {
      setSubmit(false);
    }
  };

  const handle2FA = async (e) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.length < 6) { setErrors({ submit: 'Code à 6 chiffres requis' }); return; }
    setSubmit(true);
    try {
      const { authAPI } = await import('../services/api');
      const res = await authAPI.verify2FALogin(tempToken, twoFactorCode);
      const userData = res.data?.user;
      if (!userData) throw new Error('Réponse invalide');
      const token = res.data.accessToken || res.data.access_token || res.data.token;
      localStorage.setItem('token', token);
      syncUser({ ...userData, token });
      redirectAfterLogin(userData);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Code invalide' });
    } finally {
      setSubmit(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F8FAFC' }}>

      {/* ── Left: form ── */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-sm mx-auto">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#FF8C00' }}>
              <UtensilsCrossed className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <span className="font-bold text-lg" style={{ color: '#0F172A' }}>Resto d'ici</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>
              {twoFactorStep ? 'Vérification' : 'Connexion'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
              {twoFactorStep ? "Entrez le code de votre application" : 'Bon retour sur votre espace'}
            </p>
          </div>

          {registered && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              Inscription réussie ! Connectez-vous maintenant.
            </div>
          )}

          {/* 2FA form */}
          {twoFactorStep ? (
            <form onSubmit={handle2FA} className="space-y-4">
              <p className="text-sm" style={{ color: '#64748B' }}>
                Entrez le code à 6 chiffres généré par votre application d'authentification.
              </p>
              <input
                type="text" inputMode="numeric" maxLength={8}
                value={twoFactorCode}
                onChange={e => set2FACode(e.target.value.replace(/\s/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl text-center text-2xl tracking-[0.4em] font-mono outline-none"
                style={{ background: '#F1F5F9', border: '1.5px solid #E2E8F0', color: '#0F172A' }}
                autoFocus
              />
              {errors.submit && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{errors.submit}</p>
              )}
              <button type="submit" disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition disabled:opacity-60"
                style={{ background: '#FF8C00' }}>
                {isSubmitting ? 'Vérification…' : 'Valider'}
              </button>
              <button type="button" onClick={() => { set2FA(false); set2FACode(''); setErrors({}); }}
                className="w-full py-2 text-sm" style={{ color: '#94A3B8' }}>
                ← Retour
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                  <input
                    type="email" value={formData.email} autoComplete="email"
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vous@exemple.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition"
                    style={{
                      background: '#F8FAFC',
                      border: `1.5px solid ${errors.email ? '#FCA5A5' : '#E2E8F0'}`,
                      color: '#0F172A',
                    }}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#475569' }}>Mot de passe</label>
                  <Link to="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: '#FF8C00' }}>
                    Oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'} value={formData.password} autoComplete="current-password"
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition"
                    style={{
                      background: '#F8FAFC',
                      border: `1.5px solid ${errors.password ? '#FCA5A5' : '#E2E8F0'}`,
                      color: '#0F172A',
                    }}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-70 transition"
                    style={{ color: '#94A3B8' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {errors.submit && (
                <div className="rounded-xl px-4 py-3 text-sm text-red-700"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  {errors.submit}
                  {verifyEmailCta && (
                    <Link to="/verify-email"
                      className="block mt-2 text-center py-1.5 px-4 rounded-lg font-semibold text-white text-xs"
                      style={{ background: '#EF4444' }}>
                      Vérifier mon email
                    </Link>
                  )}
                </div>
              )}

              <button type="submit" disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition disabled:opacity-60 active:scale-[0.99]"
                style={{ background: '#FF8C00' }}>
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connexion…
                  </span>
                ) : 'Se connecter'}
              </button>

              <p className="text-center text-sm pt-1" style={{ color: '#94A3B8' }}>
                Pas encore de compte ?{' '}
                <Link to="/register" className="font-semibold hover:underline" style={{ color: '#FF8C00' }}>
                  S'inscrire
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* ── Right: image ── */}
      <div className="hidden lg:block relative w-[44%] shrink-0">
        <img
          src="/burger-hero.jpg"
          alt="Plat Resto d'ici"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 50%, transparent 100%)' }} />
        <div className="absolute bottom-10 left-8 right-8">
          <p className="text-white font-bold text-xl">La table digitale</p>
          <p className="text-white/70 text-sm mt-1">Commandes, budgets et équipes en un seul endroit.</p>
        </div>
      </div>
    </div>
  );
}
