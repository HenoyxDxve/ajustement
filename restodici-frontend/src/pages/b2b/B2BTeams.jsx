import { useState, useEffect } from 'react';
import { UserPlus, Users, ShieldCheck, MapPin, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { b2bAPI } from '../../services/api';

export default function B2BTeams() {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCollaborator, setNewCollaborator] = useState({
    nom: '',
    email: '',
    limiteBudget: '',
  });
  const [success, setSuccess] = useState('');

  // Mock data for collaborators with spending limits (RG-33)
  const mockCollaborators = [
    { 
      id: 'collab-1', 
      nom: 'Jean Kouassi', 
      email: 'jean.kouassi@entreprise.ci', 
      role: 'employe',
      limiteBudget: 50000,
      depenseActuelle: 32000,
      actif: true 
    },
    { 
      id: 'collab-2', 
      nom: 'Marie Koné', 
      email: 'marie.kone@entreprise.ci', 
      role: 'manager',
      limiteBudget: 75000,
      depenseActuelle: 68000,
      actif: true 
    },
    { 
      id: 'collab-3', 
      nom: 'Paul Traoré', 
      email: 'paul.traore@entreprise.ci', 
      role: 'employe',
      limiteBudget: 45000,
      depenseActuelle: 45000,
      actif: false // Budget exceeded
    }
  ];

  useEffect(() => {
    const loadCollaborators = async () => {
      try {
        setLoading(true);
        const response = await b2bAPI.getCollaborators();
        setCollaborators(response.data || mockCollaborators);
      } catch (err) {
        console.error('Error loading collaborators:', err);
        setError('Impossible de charger les collaborateurs');
        setCollaborators(mockCollaborators);
      } finally {
        setLoading(false);
      }
    };

    loadCollaborators();
  }, []);

  const validateEmail = (email) => {
    const professionalDomains = ['.ci', '.com', '.org', '.net']; // Allow professional domains
    const forbiddenDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    
    if (!/\S+@\S+\.\S+/.test(email)) return false;
    
    const domain = email.split('@')[1].toLowerCase();
    if (forbiddenDomains.some(fd => domain.includes(fd))) return false;
    
    return true;
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newCollaborator.nom.trim()) {
      setError('Le nom du collaborateur est requis');
      return;
    }
    
    if (!validateEmail(newCollaborator.email)) {
      setError('Email professionnel invalide (pas Gmail/Yahoo)');
      return;
    }
    
    const budgetLimit = parseInt(newCollaborator.limiteBudget);
    if (isNaN(budgetLimit) || budgetLimit < 10000) {
      setError('Limite de budget minimale: 10,000 FCFA');
      return;
    }

    try {
      const collaboratorData = {
        nom: newCollaborator.nom.trim(),
        email: newCollaborator.email.toLowerCase().trim(),
        limiteBudget: budgetLimit,
        role: 'employe'
      };
      
      // In real implementation: await b2bAPI.createCollaborator(collaboratorData);
      
      // Add to local state for demo
      const newCollab = {
        ...collaboratorData,
        id: `collab-${Date.now()}`,
        depenseActuelle: 0,
        actif: true
      };
      
      setCollaborators(prev => [...prev, newCollab]);
      setNewCollaborator({ nom: '', email: '', limiteBudget: '' });
      setSuccess('Collaborateur ajouté avec succès!');
      setError('');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding collaborator:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout du collaborateur');
    }
  };

  const deleteCollaborator = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce collaborateur ?')) {
      try {
        // In real implementation: await b2bAPI.deleteCollaborator(id);
        setCollaborators(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        console.error('Error deleting collaborator:', err);
        setError('Erreur lors de la suppression du collaborateur');
      }
    }
  };

  const getBudgetStatus = (depense, limite) => {
    const percentage = (depense / limite) * 100;
    if (percentage >= 100) return { text: 'Budget dépassé', color: 'text-red-600', icon: AlertCircle };
    if (percentage >= 80) return { text: 'Presque complet', color: 'text-yellow-600', icon: AlertCircle };
    return { text: 'Actif', color: 'text-green-600', icon: CheckCircle };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#2D2720] mb-6">Gestion des Collaborateurs</h1>
          <div className="bg-white rounded-2xl p-8 border border-[#E8E2D9]">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-[#F9F7F5] rounded w-1/3"></div>
              <div className="h-12 bg-[#F9F7F5] rounded"></div>
              <div className="h-12 bg-[#F9F7F5] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F5] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2D2720] mb-6">Gestion des Collaborateurs</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6">
            {success}
          </div>
        )}

        {/* Add Collaborator Form */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8E2D9] mb-8">
          <h2 className="text-xl font-bold text-[#2D2720] mb-4 flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Ajouter un collaborateur
          </h2>
          
          <form onSubmit={handleAddCollaborator} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2720] mb-2">Nom complet *</label>
                <input
                  type="text"
                  value={newCollaborator.nom}
                  onChange={(e) => setNewCollaborator(prev => ({ ...prev, nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E8E2D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3498DB]"
                  placeholder="Jean Kouassi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#2D2720] mb-2">Email professionnel *</label>
                <input
                  type="email"
                  value={newCollaborator.email}
                  onChange={(e) => setNewCollaborator(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E8E2D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3498DB]"
                  placeholder="nom@entreprise.ci"
                />
                <p className="text-xs text-[#8B7355] mt-1">Email professionnel uniquement (pas Gmail/Yahoo)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#2D2720] mb-2">Limite de dépense mensuelle (FCFA) *</label>
                <input
                  type="number"
                  value={newCollaborator.limiteBudget}
                  onChange={(e) => setNewCollaborator(prev => ({ ...prev, limiteBudget: e.target.value }))}
                  min="10000"
                  className="w-full px-3 py-2 border border-[#E8E2D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3498DB]"
                  placeholder="50000"
                />
                <p className="text-xs text-[#8B7355] mt-1">Minimum: 10,000 FCFA</p>
              </div>
            </div>
            
            <button
              type="submit"
              className="px-6 py-2 bg-[#3498DB] text-white rounded-xl hover:bg-[#2980B9] transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter le collaborateur
            </button>
          </form>
        </div>

        {/* Collaborators List */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8E2D9]">
          <h2 className="text-xl font-bold text-[#2D2720] mb-6 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Vos collaborateurs ({collaborators.length})
          </h2>
          
          {collaborators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-[#E8E2D9] mx-auto mb-4" />
              <p className="text-[#8B7355]">Aucun collaborateur ajouté pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {collaborators.map((collab) => {
                const budgetStatus = getBudgetStatus(collab.depenseActuelle, collab.limiteBudget);
                const StatusIcon = budgetStatus.icon;
                
                return (
                  <div key={collab.id} className="border border-[#E8E2D9] rounded-xl p-4 hover:bg-[#FFF5EB] transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="mb-3 md:mb-0">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${collab.actif ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <h3 className="font-bold text-[#2D2720]">{collab.nom}</h3>
                          {collab.role === 'manager' && (
                            <ShieldCheck className="w-4 h-4 text-[#3498DB] ml-2" title="Manager" />
                          )}
                        </div>
                        <p className="text-sm text-[#8B7355]">{collab.email}</p>
                        
                        {/* Budget Info */}
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#8B7355]">Dépensé:</span>
                            <span className="font-medium">{collab.depenseActuelle.toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#8B7355]">Limite:</span>
                            <span className="font-medium">{collab.limiteBudget.toLocaleString()} FCFA</span>
                          </div>
                          <div className="w-full bg-[#E8E2D9] rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                collab.depenseActuelle >= collab.limiteBudget 
                                  ? 'bg-red-500' 
                                  : collab.depenseActuelle >= collab.limiteBudget * 0.8 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, (collab.depenseActuelle / collab.limiteBudget) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${budgetStatus.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {budgetStatus.text}
                        </div>
                        
                        <button
                          onClick={() => deleteCollaborator(collab.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}