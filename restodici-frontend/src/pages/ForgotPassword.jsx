// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, UtensilsCrossed, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email requis');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Email invalide');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, {
        email: email.trim()
      });

      setSuccess(true);
      console.log(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 space-y-6 border border-[#E8E2D9]">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#2D2720]">Email envoyé !</h1>
            <p className="text-[#8B7355] text-sm">
              Si un compte existe avec cet email, vous recevrez un lien de réinitialisation de mot de passe.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-[#8B7355] text-center">
              Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
            </p>

            <Link
              to="/login"
              className="flex items-center justify-center w-full py-3 px-4 rounded-2xl font-bold text-white bg-[#D94500] hover:bg-[#B83A00] transition-colors"
            >
              Retour à la connexion
            </Link>
          </div>
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
          <h1 className="text-3xl font-bold text-[#2D2720]">Mot de passe oublié</h1>
          <p className="text-[#8B7355] text-sm">
            Entrez votre email pour réinitialiser votre mot de passe
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2D2720]">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-[#8B7355]" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="votre@email.com"
                className="block w-full pl-10 pr-3 py-3 bg-[#F9F7F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D94500] focus:border-transparent transition-all"
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-white bg-[#D94500] hover:bg-[#B83A00] transition-colors ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Envoi en cours...' : 'Réinitialiser le mot de passe'}
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