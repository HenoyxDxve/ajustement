import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, AlertCircle, CreditCard, Download, ArrowLeft, ShieldAlert } from 'lucide-react';
import { b2bAPI } from '../../services/api';
import { formatFCFA } from '../../utils/formatters';

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG     = '#F8FAFC';
const CARD   = '#FFFFFF';
const TEXT   = '#0F172A';
const MUTED  = '#64748B';
const FAINT  = '#94A3B8';
const BORDER = '#E2E8F0';
const ORANGE = '#FF8C00';    // CTA principal
const GREEN  = '#16A34A';    // PDF, payé, succès
const GREEN_L= '#DCFCE7';
const GREEN_D= '#15803D';
const RED    = '#DC2626';    // En retard, bloqué, risque
const RED_L  = '#FEF2F2';
const AMBER  = '#D97706';    // En attente
const AMBER_L= '#FFFBEB';
const SH     = '0 1px 3px rgba(15,23,42,0.07),0 1px 2px rgba(15,23,42,0.04)';
const SH2    = '0 4px 16px rgba(15,23,42,0.10),0 2px 4px rgba(15,23,42,0.06)';

// ── PDF builder ────────────────────────────────────────────────────────────────
function sanitizePdf(v) {
  return String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[()\\]/g, '').replace(/\s+/g, ' ').trim();
}

function buildInvoicePdfBlob(facture, montantHT, tva, montant) {
  const lines = [
    sanitizePdf(`Facture: ${facture.periode ?? facture.numeroFacture ?? facture.id}`),
    sanitizePdf(`Statut: ${facture.statut ?? 'EN_ATTENTE'}`), '',
    sanitizePdf(`Montant HT : ${Math.round(montantHT).toLocaleString()} FCFA`),
    sanitizePdf(`TVA 18%    : ${Math.round(tva).toLocaleString()} FCFA`),
    sanitizePdf(`Total TTC  : ${Math.round(montant).toLocaleString()} FCFA`), '',
    facture.nifClient  ? sanitizePdf(`NIF client : ${facture.nifClient}`)  : '',
    facture.rccmClient ? sanitizePdf(`RCCM       : ${facture.rccmClient}`) : '',
    facture.echeance   ? sanitizePdf(`Echeance   : ${facture.echeance}`)   : '',
    '', "Facture conforme SYSCOHADA - Resto d'ici",
  ].filter(l => l !== null);
  const safeTitle = "FACTURE ENTREPRISE - Resto d'ici";
  const contentLines = [safeTitle, ...lines]
    .map((line, i) => `BT /F1 11 Tf 50 ${780 - i * 18} Td (${line}) Tj ET`).join('\n');
  const stream = `${contentLines}\n`;
  const pdf = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n5 0 obj << /Length ${stream.length} >> stream\n${stream}endstream endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000063 00000 n \n0000000122 00000 n \n0000000248 00000 n \n0000000318 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${318 + stream.length}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function StatusPill({ statut }) {
  if (statut === 'PAYEE') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
      style={{ background: GREEN_L, color: GREEN }}>
      <CheckCircle className="w-3 h-3" /> Payée
    </span>
  );
  if (statut === 'RETARDEE') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
      style={{ background: RED_L, color: RED }}>
      <AlertCircle className="w-3 h-3" /> En retard
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
      style={{ background: AMBER_L, color: AMBER }}>
      <Clock className="w-3 h-3" /> En attente
    </span>
  );
}

export default function B2BInvoices() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await b2bAPI.getFacturesMensuelles();
      const data = res.data || [];
      if (data.length > 0) {
        setFactures(data);
      } else {
        const legacyRes = await b2bAPI.getInvoices();
        setFactures(legacyRes.data || []);
      }
    } catch { setError('Impossible de charger les factures'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const handlePay = async (id) => {
    setPaying(id); setError('');
    try {
      await b2bAPI.payerFacture(id);
      setSuccess('Paiement enregistré avec succès');
      await load();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du paiement');
    } finally { setPaying(''); }
  };

  const totalDu = factures
    .filter(f => f.statut !== 'PAYEE' && f.statut !== 'paid')
    .reduce((s, f) => s + (f.montantTTC ?? f.amount ?? 0), 0);
  const hasRetardee = factures.some(f => f.statut === 'RETARDEE');
  const paidCount   = factures.filter(f => f.statut === 'PAYEE' || f.statut === 'paid').length;

  return (
    <div className="min-h-screen" style={{ background: BG }}>

      {/* Header — unified white/orange */}
      <div className="sticky top-0 z-10 bg-white" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/b2b" className="flex items-center gap-1.5 text-[12px] font-medium hover:opacity-70 transition"
            style={{ color: '#6B7280' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <span style={{ color: 'rgba(0,0,0,0.15)' }}>›</span>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #FF8C00, #E07A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0, flex: 1 }}>Facturation</p>
          {/* Export SYSCOHADA CSV */}
          <button
            onClick={async () => {
              if (factures.length === 0) return;
              try {
                const res = await b2bAPI.exportSyscohadaCsv(factures[0].id);
                const { csv, filename } = res.data;
                const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
                URL.revokeObjectURL(url);
              } catch { /* ignore */ }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold text-white transition hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${GREEN}, ${GREEN_D})`, boxShadow: `0 2px 8px ${GREEN}50` }}>
            <Download className="w-3.5 h-3.5" /> CSV SYSCOHADA
          </button>
          {/* Export global PDF */}
          <button
            onClick={() => {
              if (factures.length > 0) {
                const f = factures[0];
                const m = f.montantTTC ?? f.amount ?? 0;
                const ht = f.montantHT ?? (m / 1.18);
                const t = f.tva ?? (m - ht);
                downloadBlob(buildInvoicePdfBlob(f, ht, t, m), `facture-${f.numeroFacture ?? f.id?.slice(0, 8)}.pdf`);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold text-white transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #374151, #1F2937)', boxShadow: '0 2px 8px rgba(55,65,81,0.35)' }}>
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: ORANGE, borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Messages */}
          {error && (
            <div className="rounded-xl border px-4 py-3 flex items-center gap-3"
              style={{ background: RED_L, borderColor: '#FECACA' }}>
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: RED }} />
              <p className="text-sm font-medium" style={{ color: '#B91C1C' }}>{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-xl border px-4 py-3 flex items-center gap-3"
              style={{ background: GREEN_L, borderColor: '#BBF7D0' }}>
              <CheckCircle className="w-4 h-4 shrink-0" style={{ color: GREEN }} />
              <p className="text-sm font-medium" style={{ color: GREEN_D }}>{success}</p>
            </div>
          )}

          {/* Compte bloqué — rouge (risque) */}
          {hasRetardee && (
            <div className="rounded-2xl border px-5 py-4 flex items-start gap-4"
              style={{ background: RED_L, borderColor: '#FECACA' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#FEE2E2' }}>
                <ShieldAlert className="w-5 h-5" style={{ color: RED }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: '#991B1B' }}>
                  Compte suspendu — nouvelles commandes désactivées
                </p>
                <p className="text-xs mt-1" style={{ color: '#B91C1C' }}>
                  Une ou plusieurs factures sont en retard. Votre accès aux commandes est suspendu jusqu'au règlement complet.
                </p>
              </div>
            </div>
          )}

          {/* Solde dû */}
          {totalDu > 0 && (
            <div className="rounded-2xl p-5 flex items-center justify-between gap-4"
              style={{ background: AMBER_L, border: `1.5px solid #FDE68A` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: '#FEF3C7' }}>
                  <AlertCircle className="w-5 h-5" style={{ color: AMBER }} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: AMBER }}>Total dû (TTC)</p>
                  <p className="text-2xl font-bold" style={{ color: TEXT }}>
                    {totalDu.toLocaleString()} <span className="text-sm font-normal">FCFA</span>
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold" style={{ color: AMBER }}>
                {factures.filter(f => f.statut !== 'PAYEE' && f.statut !== 'paid').length} facture(s) impayée(s)
              </p>
            </div>
          )}

          {/* KPI summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total factures', value: factures.length,             bg: '#111827' },
              { label: 'Payées',         value: paidCount,                   bg: GREEN    },
              { label: 'En attente',     value: factures.length - paidCount, bg: AMBER    },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center text-white"
                style={{ background: s.bg, boxShadow: `0 4px 14px ${s.bg}40` }}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.72)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Liste factures */}
          {factures.length === 0 ? (
            <div className="rounded-2xl py-20 text-center" style={{ background: CARD, boxShadow: SH }}>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: '#F5F3FF' }}>
                <FileText className="w-7 h-7" style={{ color: '#7C3AED' }} />
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: MUTED }}>Aucune facture disponible</p>
              <p className="text-xs" style={{ color: FAINT }}>Générées automatiquement en fin de mois</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: CARD, boxShadow: SH2 }}>
              {factures.map((facture, idx, arr) => {
                const isPaid    = facture.statut === 'PAYEE' || facture.statut === 'paid';
                const isOverdue = facture.statut === 'RETARDEE';
                const montant   = facture.montantTTC ?? facture.amount ?? 0;
                const montantHT = facture.montantHT ?? (montant / 1.18);
                const tva       = facture.tva ?? (montant - montantHT);

                return (
                  <div key={facture.id} className="px-5 py-5 transition"
                    style={{
                      borderBottom: idx < arr.length - 1 ? `1px solid ${BORDER}` : 'none',
                      background: isOverdue ? `${RED_L}60` : 'transparent',
                    }}
                    onMouseEnter={e => !isOverdue && (e.currentTarget.style.background = BG)}
                    onMouseLeave={e => !isOverdue && (e.currentTarget.style.background = 'transparent')}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                      {/* Icône statut */}
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: isPaid ? GREEN_L : isOverdue ? RED_L : AMBER_L,
                          border: `1.5px solid ${isPaid ? '#BBF7D0' : isOverdue ? '#FECACA' : '#FDE68A'}`,
                        }}>
                        <FileText className="w-5 h-5"
                          style={{ color: isPaid ? GREEN : isOverdue ? RED : AMBER }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-[13px] font-bold" style={{ color: TEXT }}>
                            {facture.periode ?? facture.mois ?? `Facture ${facture.id?.slice(0, 6)}`}
                          </span>
                          <StatusPill statut={facture.statut ?? (facture.status === 'paid' ? 'PAYEE' : 'EN_ATTENTE')} />
                          {facture.numeroFacture && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg"
                              style={{ background: BG, color: FAINT }}>
                              #{facture.numeroFacture}
                            </span>
                          )}
                        </div>
                        {/* Décomposition fiscale */}
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px]">
                          <span style={{ color: FAINT }}>
                            HT : <strong style={{ color: TEXT }}>{Math.round(montantHT).toLocaleString()} FCFA</strong>
                          </span>
                          <span style={{ color: FAINT }}>
                            TVA 18% : <strong style={{ color: TEXT }}>{Math.round(tva).toLocaleString()} FCFA</strong>
                          </span>
                          <span style={{ color: FAINT }}>
                            TTC : <strong style={{ color: TEXT, fontSize: 13 }}>{Math.round(montant).toLocaleString()} FCFA</strong>
                          </span>
                          {facture.echeance && (
                            <span style={{ color: isOverdue ? RED : FAINT }}>
                              Éch. {facture.echeance}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {/* Télécharger PDF — vert (extraction de données) */}
                        <button
                          onClick={() => downloadBlob(
                            buildInvoicePdfBlob(facture, montantHT, tva, montant),
                            `facture-${facture.numeroFacture ?? facture.id?.slice(0, 8)}.pdf`
                          )}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold text-white transition hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${GREEN}, ${GREEN_D})`, boxShadow: `0 2px 8px ${GREEN}40` }}>
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </button>

                        {!isPaid ? (
                          /* Payer — orange (CTA principal) */
                          <button
                            onClick={() => handlePay(facture.id)}
                            disabled={paying === facture.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold text-white transition disabled:opacity-50 hover:opacity-90"
                            style={{ background: isOverdue ? RED : ORANGE, boxShadow: `0 2px 8px ${isOverdue ? RED : ORANGE}40` }}>
                            <CreditCard className="w-3.5 h-3.5" />
                            {paying === facture.id ? 'Traitement…' : 'Payer maintenant'}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[12px] font-bold"
                            style={{ color: GREEN }}>
                            <CheckCircle className="w-4 h-4" /> Soldée
                          </div>
                        )}

                        {/* Contestation */}
                        {!isPaid && (
                          <button
                            onClick={() => {
                              const motif = prompt('Motif de la contestation :');
                              if (!motif) return;
                              b2bAPI.contesterFacture(facture.id, motif)
                                .then(() => { setSuccess('Contestation soumise. Nous vous recontacterons.'); load(); })
                                .catch(e => setError(e.response?.data?.message || 'Erreur'));
                            }}
                            className="text-[11px] font-semibold px-2 py-1 rounded-lg border transition hover:opacity-80"
                            style={{ borderColor: '#FDE68A', color: '#D97706', background: '#FFFBEB' }}>
                            Contester
                          </button>
                        )}
                        {facture.statut === 'EN_CONTESTATION' && (
                          <span className="text-[11px] font-bold px-2 py-1 rounded-lg"
                            style={{ background: '#F5F3FF', color: '#7C3AED' }}>En contestation</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-center text-[11px]" style={{ color: FAINT }}>
            Factures conformes SYSCOHADA · TVA 18% · Génération automatique fin de mois
          </p>
        </div>
      )}
    </div>
  );
}
