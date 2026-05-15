import { useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, Chrome } from 'lucide-react';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const userRaw = searchParams.get('user');

  useEffect(() => {
    // Même logique que pour les autres providers : si token présent, on log l’utilisateur
    if (!token) return;
    try {
      const user = userRaw ? JSON.parse(decodeURIComponent(userRaw)) : null;
      if (user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Redirection selon rôle
      const role = user?.role?.toUpperCase?.() || user?.role;
      if (role === 'GERANT') navigate('/gerant', { replace: true });
      else if (role === 'B2B') navigate('/b2b/dashboard', { replace: true });
      else navigate('/menu', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  }, [token, userRaw, navigate]);

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 space-y-6 border border-[#E8E2D9]">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#2D2720]">Connexion Google impossible</h1>
            <p className="text-[#8B7355] text-sm">Données de callback manquantes.</p>
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center w-full py-3 px-4 rounded-2xl font-bold text-white bg-[#D94500] hover:bg-[#B83A00] transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 space-y-6 border border-[#E8E2D9]">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFF5EB] mb-2">
            <Chrome className="w-8 h-8 text-[#D94500]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2D2720]">Connexion en cours...</h1>
          <p className="text-[#8B7355] text-sm">Redirection automatique.</p>
        </div>

        <div className="flex items-center justify-center py-8">
          <div className="w-10 h-10 border-2 border-[#E8E2D9] border-t-[#D94500] rounded-full animate-spin" />
        </div>

        <div className="flex items-center justify-center text-[#8B7355] text-sm gap-2">
          <CheckCircle className="w-4 h-4" />
          Patientez...
        </div>
      </div>
    </div>
  );
}

