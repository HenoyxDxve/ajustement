import { useState, useEffect } from 'react';
import { TrendingUp, Users, Clock, Package, FileText, Calendar } from 'lucide-react';
import { b2bAPI } from '../../services/api';

export default function B2BReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('expenses');

  // Mock data for expense tracking and audit logs (US-26, US-36)
  const mockReports = {
    expenses: [
      { 
        collaborator: 'Jean Kouassi', 
        email: 'jean.kouassi@entreprise.ci', 
        totalSpent: 32000, 
        ordersCount: 8,
        averageOrder: 4000,
        lastOrder: '2026-05-10'
      },
      { 
        collaborator: 'Marie Koné', 
        email: 'marie.kone@entreprise.ci', 
        totalSpent: 68000, 
        ordersCount: 12,
        averageOrder: 5667,
        lastOrder: '2026-05-11'
      },
      { 
        collaborator: 'Paul Traoré', 
        email: 'paul.traore@entreprise.ci', 
        totalSpent: 45000, 
        ordersCount: 9,
        averageOrder: 5000,
        lastOrder: '2026-05-08'
      }
    ],
    auditLogs: [
      { 
        date: '2026-05-11 14:30', 
        user: 'Marie Koné', 
        action: 'Commande groupée', 
        details: '50 repas (30 Attiéké, 20 Alloco)', 
        amount: 325000 
      },
      { 
        date: '2026-05-10 12:15', 
        user: 'Jean Kouassi', 
        action: 'Commande individuelle', 
        details: 'Riz Sauce + Jus', 
        amount: 4500 
      },
      { 
        date: '2026-05-09 18:45', 
        user: 'Responsable B2B', 
        action: 'Ajout collaborateur', 
        details: 'Paul Traoré - Limite 45,000 FCFA', 
        amount: 0 
      },
      { 
        date: '2026-05-08 13:20', 
        user: 'Paul Traoré', 
        action: 'Commande individuelle', 
        details: 'Attiéké Poisson', 
        amount: 5000 
      }
    ]
  };

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const response = await b2bAPI.getReports();
        setReports(response.data || mockReports);
      } catch (err) {
        console.error('Error loading reports:', err);
        setError('Impossible de charger les rapports');
        setReports(mockReports);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-[#2D2720] mb-6">Rapports & Audit</h1>
          <div className="bg-white rounded-2xl p-8 border border-[#E8E2D9]">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-[#F9F7F5] rounded w-1/4"></div>
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2D2720] mb-6">Rapports & Audit</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-[#F9F7F5] p-1 rounded-xl mb-6 border border-[#E8E2D9]">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'expenses' 
                ? 'bg-white text-[#2D2720] shadow-sm' 
                : 'text-[#8B7355] hover:text-[#2D2720]'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Suivi des Dépenses
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'audit' 
                ? 'bg-white text-[#2D2720] shadow-sm' 
                : 'text-[#8B7355] hover:text-[#2D2720]'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Journal d'Audit
          </button>
        </div>

        {activeTab === 'expenses' && (
          <div className="bg-white rounded-2xl p-6 border border-[#E8E2D9]">
            <h2 className="text-xl font-bold text-[#2D2720] mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Dépenses par Collaborateur
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E2D9]">
                    <th className="text-left py-3 px-4 font-medium text-[#8B7355]">Collaborateur</th>
                    <th className="text-left py-3 px-4 font-medium text-[#8B7355]">Email</th>
                    <th className="text-right py-3 px-4 font-medium text-[#8B7355]">Total Dépensé</th>
                    <th className="text-right py-3 px-4 font-medium text-[#8B7355]">Nb Commandes</th>
                    <th className="text-right py-3 px-4 font-medium text-[#8B7355]">Moyenne</th>
                    <th className="text-left py-3 px-4 font-medium text-[#8B7355]">Dernière Cmd</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.expenses.map((expense, index) => (
                    <tr key={index} className="border-b border-[#E8E2D9] hover:bg-[#FFF5EB]">
                      <td className="py-3 px-4 font-medium text-[#2D2720]">{expense.collaborator}</td>
                      <td className="py-3 px-4 text-[#8B7355] text-sm">{expense.email}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#2D2720]">
                        {expense.totalSpent.toLocaleString()} FCFA
                      </td>
                      <td className="py-3 px-4 text-right text-[#2D2720]">{expense.ordersCount}</td>
                      <td className="py-3 px-4 text-right text-[#2D2720]">
                        {expense.averageOrder.toLocaleString()} FCFA
                      </td>
                      <td className="py-3 px-4 text-[#8B7355]">
                        {new Date(expense.lastOrder).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-[#EBF5FB] rounded-xl border border-[#D4E8F2]">
              <h3 className="font-bold text-[#3498DB] mb-2">💡 Insights</h3>
              <p className="text-[#2D2720] text-sm">
                Total dépensé ce mois: {reports.expenses.reduce((sum, e) => sum + e.totalSpent, 0).toLocaleString()} FCFA
                {' • '}
                Moyenne par collaborateur: {Math.round(reports.expenses.reduce((sum, e) => sum + e.totalSpent, 0) / reports.expenses.length).toLocaleString()} FCFA
              </p>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl p-6 border border-[#E8E2D9]">
            <h2 className="text-xl font-bold text-[#2D2720] mb-6 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Journal d'Audit Complet
            </h2>
            
            <div className="space-y-4">
              {reports.auditLogs.map((log, index) => (
                <div key={index} className="border border-[#E8E2D9] rounded-xl p-4 hover:bg-[#FFF5EB] transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="mb-3 md:mb-0">
                      <div className="flex items-center mb-2">
                        <Clock className="w-4 h-4 text-[#8B7355] mr-2" />
                        <span className="text-sm text-[#8B7355]">
                          {new Date(log.date).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="font-medium text-[#2D2720]">{log.user}</div>
                      <div className="text-sm text-[#8B7355]">{log.action}</div>
                      <div className="text-sm mt-1">{log.details}</div>
                    </div>
                    <div className="text-right">
                      {log.amount > 0 && (
                        <div className="font-bold text-[#2D2720]">
                          {log.amount.toLocaleString()} FCFA
                        </div>
                      )}
                      {log.amount === 0 && (
                        <div className="text-[#8B7355] text-sm">Action administrative</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-[#FDEDEC] rounded-xl border border-[#FADBD8]">
              <h3 className="font-bold text-[#E74C3C] mb-2">🔒 Transparence Entreprise</h3>
              <p className="text-[#2D2720] text-sm">
                Ce journal d'audit fournit une traçabilité complète de toutes les actions effectuées 
                dans votre compte entreprise, conformément aux exigences de transparence en milieu professionnel.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}