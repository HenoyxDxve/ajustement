import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle, AlertCircle, Mail } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage("Token de vérification manquant.");
      return;
    }

    (async () => {
      try {
        const res = await axios.post(`${API_URL}/auth/verify-email`, { token });
        setStatus('success');
        setMessage(res.data?.message || 'Email vérifié.');
        // On ne récupère pas l'email côté back dans la réponse actuelle
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Erreur lors de la vérification.');
      }
    })();
  }, [token]);

  const handleResend = async () => {
    setIsResending(true);
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/auth/resend-verification`, { email });
      setStatus('success');
      setMessage(res.data?.message || 'Lien de vérification renvoyé.');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Erreur lors du renvoi.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 space-y-6 border border-[#E8E2D9]">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFF5EB] mb-2">
            <Mail className="w-8 h-8 text-[#D94500]" />
          </div>
          <h1 className="text-3xl font-bold text-[#2D2720]">Vérification email</h1>
          <p className="text-[#8B7355] text-sm">Confirmez votre adresse pour activer votre compte</p>
        </div>

        {status === 'loading' && (
          <div className="flex items-center justify-center py-8">
            <div className="w-10 h-10 border-2 border-[#E8E2D9] border-t-[#D94500] rounded-full animate-spin" />
          </div>
        )}

        {status !== 'loading' && (
          <div className={status === 'success' ? 'text-green-700' : 'text-red-700'}>
            <div className="flex items-center justify-center gap-2">
              {status === 'success' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
              <p className="text-sm font-semibold">{message}</p>
            </div>

            {status === 'error' && (
              <div className="mt-6 space-y-4">
                <p className="text-xs text-[#8B7355] text-center">
                  Renseignez votre email pour renvoyer le lien de vérification.
                </p>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#2D2720]">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="votre@email.com"
                    className="block w-full px-3 py-3 bg-[#F9F7F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D94500] focus:border-transparent"
                  />
                </div>

                <button
                  type="button"
                  disabled={isResending || !email}
                  onClick={handleResend}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-white bg-[#D94500] hover:bg-[#B83A00] transition-colors ${
                    isResending || !email ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isResending ? 'Envoi...' : 'Renvoyer le lien'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-[#E8E2D9]">
          <Link to="/login" className="flex items-center text-[#8B7355] hover:text-[#2D2720] text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

