// src/pages/PaymentSuccess.jsx
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Clock, MapPin, Phone } from 'lucide-react';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const orderId = id || 'R1234';

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 sm:p-10 border border-stone-100">
        
        {/* Icône succès - Cercle vert */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Message principal */}
        <h1 className="text-3xl font-bold text-stone-900 text-center mb-2">
          Paiement réussi !
        </h1>
        <p className="text-stone-600 text-center mb-8">
          Votre commande <span className="font-bold text-orange-700">#{orderId}</span> a été confirmée.
        </p>

        {/* Temps de livraison */}
        <div className="bg-stone-100 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-orange-700 mr-2" />
            <span className="text-stone-600 font-medium">Livraison prévue dans</span>
          </div>
          <p className="text-4xl font-bold text-orange-700 text-center">
            25-35 min
          </p>
        </div>

        {/* Bouton principal - Suivre commande */}
        <button
          onClick={() => navigate(`/suivi/${orderId}`)}
          className="w-full bg-orange-700 hover:bg-orange-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 mb-3 transform hover:-translate-y-0.5"
        >
          SUIVRE MA COMMANDE
        </button>
        
        {/* Lien secondaire - Retour */}
        <button
          onClick={() => navigate('/menu')}
          className="w-full text-orange-700 font-semibold py-3 hover:bg-orange-50 rounded-xl transition-colors duration-200"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}