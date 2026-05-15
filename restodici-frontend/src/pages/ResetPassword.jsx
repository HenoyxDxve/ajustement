// src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, UtensilsCrossed, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [validToken, setValidToken] = useState(false);

  // Validate token on mount (optional - could be done when submitting)
  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setError('Token de réinitialisation manquant');
      return;
    }
    // Token is present, allow form submission
    setIsValidating(false);
    setValidToken(true);
  }, [token]);

  const validateForm = () => {
    const newErrors = [];
    
    if (!formData.newPassword || formData.newPassword.length < 6) {
      newErrors.push('Le mot de passe doit contenir au moins 6 caractères');
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.push('Les mots de passe ne correspondent pas');
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        newPassword: formData.newPassword
      });

      setSuccess(true);
      console.log(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 space-y-6 border border-[#E8E2D9]">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#2D2720]">Lien invalide</h1>
            <p className="text-[#8B7355] text-sm">
              Le lien de réinitialisation est invalide ou a expiré.
            </p>
          </div>

          <Link
            to="/forgot-password"
            className="flex items-center justify-center w-full py-3 px-4 rounded-2xl font-bold text-white bg-[#D94500] hover:bg-[#B83A00] transition-colors"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 space-y-6 border border-[#E8E2D9]">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#2D2720]">Mot de passe réinitialisé !</h1>
            <p className="text-[#8B7355] text-sm">
              Votre mot de passe a été modifié avec succès.
            </p>
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center w-full py-3 px-4 rounded-2xl font-bold text-white bg-[#D94500] hover:bg-[#B83A00] transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 space-y-6 border border-[#E8E2D9]">
        
        {/* Logo + Titre */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFF5EB] mb-2">
            <UtensilsCrossed className="w-8 h-8 text-[#D94500]" />
          </div>
          <h1 className="text-3xl font-bold text-[#2D2720]">Nouveau mot de passe</h1>
          <p className="text-[#8B7355] text-sm">
            Créez un nouveau mot de passe sécurisé
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* New Password */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2D2720]">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-[#8B7355]" />
              <input
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                type="password"
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-3 bg-[#F9F7F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D94500] focus:border-transparent transition-all"
              />
            </div>
            <p className="text-xs text-[#8B7355]">Minimum 6 caractères</p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2D2720]">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-[#8B7355]" />
              <input
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                type="password"
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-3 bg-[#F9F7F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D94500] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-white bg-[#D94500] hover:bg-[#B83A00] transition-colors ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>

        {/* Liens */}
        <div className="pt-4 border-t border-[#E8E2D9]">
          <Link 
            to="/login" 
            className="flex items-center text-[#8B7355] hover:text-[#2D2720] text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}