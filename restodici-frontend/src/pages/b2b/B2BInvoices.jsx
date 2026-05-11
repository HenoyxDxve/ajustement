import { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, Clock, AlertCircle, Calendar, Building2 } from 'lucide-react';
import { b2bAPI } from '../../services/api';

export default function B2BInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock data for SYSCOHADA compliant invoices
  const mockInvoices = [
    {
      id: 'INV-2026-05',
      month: 'MAI 2026',
      amount: 4500000,
      status: 'pending',
      dueDate: '2026-05-31',
      pdfUrl: '#',
      nifRestaurant: 'CI-ABJ-2026-B-1234',
      nifClient: 'CI-YAM-2025-A-5678',
      tva: 18,
      includesTVA: true
    },
    {
      id: 'INV-2026-04',
      month: 'AVRIL 2026',
      amount: 3200000,
      status: 'paid',
      dueDate: '2026-04-30',
      pdfUrl: '#',
      nifRestaurant: 'CI-ABJ-2026-B-1234',
      nifClient: 'CI-YAM-2025-A-5678',
      tva: 18,
      includesTVA: true
    }
  ];

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const response = await b2bAPI.getInvoices();
        setInvoices(response.data || mockInvoices);
      } catch (err) {
        console.error('Error loading invoices:', err);
        setError('Impossible de charger les factures');
        setInvoices(mockInvoices);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  const downloadPdf = (invoice) => {
    if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, '_blank');
    }
  };

  const payInvoice = (invoice) => {
    alert(`Paiement initié pour la facture ${invoice.id} - ${invoice.amount.toLocaleString()} FCFA`);
    // In real implementation, this would call b2bAPI.payInvoice(invoice.id)
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'En attente', icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
      case 'paid':
        return { text: 'Payée', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' };
      default:
        return { text: 'Inconnue', icon: AlertCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-[#2D2720] mb-6">Mes Factures</h1>
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
        <h1 className="text-3xl font-bold text-[#2D2720] mb-6">Mes Factures</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {invoices.map((invoice) => {
            const statusInfo = getStatusInfo(invoice.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div key={invoice.id} className="bg-white rounded-2xl p-6 border border-[#E8E2D9]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="mb-4 lg:mb-0">
                    <div className="flex items-center mb-2">
                      <FileText className="w-5 h-5 text-[#2ECC71] mr-2" />
                      <span className="font-bold text-lg">{invoice.month}</span>
                      <span className={`ml-3 px-2 py-1 rounded-full border text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {statusInfo.text}
                      </span>
                    </div>
                    
                    {/* SYSCOHADA Compliance Info */}
                    <div className="text-sm text-[#8B7355] mt-2">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-2" />
                        NIF Restaurant: {invoice.nifRestaurant} | NIF Client: {invoice.nifClient}
                      </div>
                      {invoice.includesTVA && (
                        <div className="flex items-center mt-1">
                          <Calendar className="w-4 h-4 mr-2" />
                          TVA {invoice.tva}% incluse - Conforme SYSCOHADA
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#2D2720] mb-2">
                      {invoice.amount.toLocaleString()} FCFA
                    </div>
                    {invoice.status === 'pending' && (
                      <div className="text-sm text-[#8B7355] mb-3">
                        Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    
                    <div className="flex space-x-3 justify-end">
                      <button
                        onClick={() => downloadPdf(invoice)}
                        className="flex items-center px-4 py-2 bg-[#EBF5FB] text-[#3498DB] rounded-xl hover:bg-[#D4E8F2] transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger PDF
                      </button>
                      
                      {invoice.status === 'pending' && (
                        <button
                          onClick={() => payInvoice(invoice)}
                          className="flex items-center px-4 py-2 bg-[#2ECC71] text-white rounded-xl hover:bg-[#27AE60] transition-colors"
                        >
                          Payer
                        </button>
                      )}
                      
                      {invoice.status === 'paid' && (
                        <button className="flex items-center px-4 py-2 bg-[#E6F7ED] text-[#2ECC71] rounded-xl cursor-default">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Voir Reçu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {invoices.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-12 border border-[#E8E2D9] text-center">
            <FileText className="w-16 h-16 text-[#E8E2D9] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#2D2720] mb-2">Aucune facture disponible</h3>
            <p className="text-[#8B7355]">Vos factures mensuelles apparaîtront ici une fois générées.</p>
          </div>
        )}
      </div>
    </div>
  );
}