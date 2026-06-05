import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, FileText, Download, BarChart2, ArrowLeft, Activity, CheckCircle } from 'lucide-react';
import { b2bAPI } from '../../services/api';
import { formatFCFA } from '../../utils/formatters';

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG     = '#F8FAFC';
const CARD   = '#FFFFFF';
const NAVY   = '#0F172A';
const TEXT   = '#0F172A';
const MUTED  = '#64748B';
const FAINT  = '#94A3B8';
const BORDER = '#E2E8F0';
const ORANGE = '#FF8C00';
const GREEN  = '#16A34A';    // exports CSV/PDF — vert
const GREEN_L= '#DCFCE7';
const GREEN_D= '#15803D';
const RED    = '#DC2626';
const RED_L  = '#FEF2F2';
const AMBER  = '#D97706';
const AMBER_L= '#FFFBEB';
const SH     = '0 1px 3px rgba(15,23,42,0.07),0 1px 2px rgba(15,23,42,0.04)';
const SH2    = '0 4px 16px rgba(15,23,42,0.10),0 2px 4px rgba(15,23,42,0.06)';

function Avatar({ name = '', size = 36 }) {
  const ini = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const hue = ((name.charCodeAt(0) || 0) * 37) % 360;
  return (
    <div className="rounded-full flex items-center justify-center font-bold shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.38,
        background: `hsl(${hue},65%,88%)`, color: `hsl(${hue},65%,32%)` }}>
      {ini}
    </div>
  );
}

function exportCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function B2BReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('collaborateurs');
  const [exported, setExported] = useState(false);

  useEffect(() => {
    b2bAPI.getReports()
      .then(r => setReports(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const collaborateurs = reports?.collaborateurs ?? [];
  const auditLogs      = reports?.auditLogs ?? [];
  const factures       = reports?.factures ?? [];
  const totalDepenses  = collaborateurs.reduce((s, c) => s + (c.totalDepense ?? 0), 0);

  const handleExport = () => {
    exportCSV(
      collaborateurs.map(c => ({
        Collaborateur: c.collaborateur,
        Email: c.email,
        'Dépensé (FCFA)': c.totalDepense,
        'Limite (FCFA)': c.limite,
        'Solde restant (FCFA)': c.soldeRestant,
      })),
      'rapport-syscohada.csv',
    );
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="min-h-screen" style={{ background: BG }}>

      {/* Header dark */}
      <div className="sticky top-0 z-10" style={{ background: NAVY, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/b2b" className="flex items-center gap-1.5 text-[12px] font-medium hover:opacity-70 transition"
            style={{ color: 'rgba(255,255,255,0.55)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
          <p className="text-[13px] font-semibold text-white">Rapports & Analytique</p>
          <div className="flex-1" />

          {/* Export CSV — vert (extraction de données) */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold text-white transition hover:opacity-90"
            style={{
              background: exported
                ? `linear-gradient(135deg, ${GREEN_D}, ${GREEN})`
                : `linear-gradient(135deg, ${GREEN}, ${GREEN_D})`,
              boxShadow: `0 2px 10px ${GREEN}50`,
            }}>
            {exported
              ? <><CheckCircle className="w-3.5 h-3.5" /> Exporté !</>
              : <><Download className="w-3.5 h-3.5" /> Exporter CSV SYSCOHADA</>
            }
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

          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total dépensé',   value: formatFCFA(totalDepenses),           bg: ORANGE, icon: TrendingUp },
              { label: 'Collaborateurs',  value: collaborateurs.length,               bg: '#4F46E5', icon: Users },
              { label: 'Commandes mois',  value: reports?.totalCommandesMois ?? 0,    bg: GREEN,  icon: BarChart2 },
              { label: 'Factures',        value: factures.length,                     bg: '#7C3AED', icon: FileText },
            ].map(({ label, value, bg, icon: Icon }) => (
              <div key={label} className="rounded-2xl p-4 text-white"
                style={{ background: bg, boxShadow: `0 4px 16px ${bg}40` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-xl font-bold truncate">{value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.72)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Export info */}
          <div className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: GREEN_L, border: `1.5px solid #BBF7D0` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#fff' }}>
              <Download className="w-5 h-5" style={{ color: GREEN }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: GREEN_D }}>Export SYSCOHADA disponible</p>
              <p className="text-xs" style={{ color: GREEN }}>
                Format CSV conforme · TVA 18% · Norme OHADA ·{' '}
                {reports?.moisEnCours && `${reports.moisEnCours} ${reports.anneeEnCours}`}
              </p>
            </div>
            <button onClick={handleExport}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: GREEN, boxShadow: `0 2px 8px ${GREEN}40` }}>
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>

          {/* Période */}
          {(reports?.moisEnCours || reports?.anneeEnCours) && (
            <p className="text-[12px]" style={{ color: MUTED }}>
              Période : <strong style={{ color: TEXT }}>{reports.moisEnCours} {reports.anneeEnCours}</strong>
              {' · '}{collaborateurs.length} collaborateur(s) actif(s)
            </p>
          )}

          {/* Tabs */}
          <div className="flex gap-0 border-b" style={{ borderColor: BORDER }}>
            {[
              { id: 'collaborateurs', label: 'Collaborateurs', icon: Users },
              { id: 'audit',          label: 'Historique',     icon: Activity },
              { id: 'factures',       label: 'Factures',       icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex items-center gap-1.5 px-5 py-3 text-[12px] font-semibold border-b-2 transition"
                style={{
                  borderBottomColor: tab === id ? ORANGE : 'transparent',
                  color: tab === id ? ORANGE : MUTED,
                  background: 'transparent',
                }}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* ── Collaborateurs ── */}
          {tab === 'collaborateurs' && (
            <div className="space-y-3">
              {collaborateurs.length === 0 ? (
                <div className="rounded-2xl py-16 text-center" style={{ background: CARD, boxShadow: SH }}>
                  <Users className="w-10 h-10 mx-auto mb-3" style={{ color: FAINT }} />
                  <p className="text-sm font-medium" style={{ color: MUTED }}>Aucune donnée de consommation ce mois</p>
                </div>
              ) : collaborateurs.map((c, i) => {
                const pct = c.limite > 0 ? Math.min(100, (c.totalDepense / c.limite) * 100) : 0;
                const barColor = pct >= 100 ? RED : pct >= 80 ? ORANGE : GREEN;
                return (
                  <div key={i} className="rounded-2xl p-5" style={{ background: CARD, boxShadow: SH2 }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar name={c.collaborateur || ''} size={40} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold" style={{ color: TEXT }}>{c.collaborateur}</p>
                          <p className="text-[11px] mb-3" style={{ color: FAINT }}>{c.email}</p>

                          {/* Barre de budget */}
                          <div className="flex justify-between text-[11px] mb-1.5" style={{ color: MUTED }}>
                            <span>{(c.totalDepense ?? 0).toLocaleString()} FCFA dépensés</span>
                            <span style={{
                              color: pct >= 100 ? RED : pct >= 80 ? ORANGE : GREEN,
                              fontWeight: 700,
                            }}>{Math.round(pct)}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: BORDER }}>
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: barColor }} />
                          </div>

                          {/* Badge dépassement */}
                          {pct >= 100 && (
                            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: RED_L, color: RED }}>
                              Budget dépassé
                            </span>
                          )}
                          {pct >= 80 && pct < 100 && (
                            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: AMBER_L, color: AMBER }}>
                              Limite proche (80%)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px]" style={{ color: FAINT }}>Solde restant</p>
                        <p className="text-[15px] font-bold" style={{ color: (c.soldeRestant ?? 0) > 0 ? GREEN : RED }}>
                          {(c.soldeRestant ?? 0).toLocaleString()} FCFA
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: FAINT }}>
                          sur {(c.limite ?? 0).toLocaleString()} FCFA
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Historique ── */}
          {tab === 'audit' && (
            <div className="space-y-1.5">
              {auditLogs.length === 0 ? (
                <div className="rounded-2xl py-16 text-center" style={{ background: CARD, boxShadow: SH }}>
                  <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: FAINT }} />
                  <p className="text-sm font-medium" style={{ color: MUTED }}>Aucune action enregistrée</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: CARD, boxShadow: SH2 }}>
                  {auditLogs.map((log, i, arr) => {
                    const TYPE_COLORS = {
                      CONNEXION:                { bg: '#EFF6FF', color: '#2563EB' },
                      CREATION_COLLABORATEUR:   { bg: GREEN_L,  color: GREEN },
                      CREATION_COMMANDE_GROUPEE:{ bg: `${ORANGE}15`, color: ORANGE },
                      VALIDATION_BUDGET:        { bg: AMBER_L,  color: AMBER },
                      GENERATION_FACTURE:       { bg: GREEN_L,  color: GREEN },
                      PAIEMENT_FACTURE:         { bg: GREEN_L,  color: GREEN_D },
                    };
                    const s = TYPE_COLORS[log.type] || { bg: BG, color: MUTED };
                    return (
                      <div key={i} className="flex items-center gap-3 px-5 py-3.5 transition"
                        style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = BG}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ background: s.bg, color: s.color }}>
                          {(log.actorEmail ?? log.user ?? '?')[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold" style={{ color: TEXT }}>
                            {(log.type?.replaceAll('_', ' ') ?? log.action)}
                          </p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: FAINT }}>
                            {log.actorEmail ?? log.user}
                            {log.meta ? ` · ${JSON.stringify(log.meta).slice(0, 50)}` : log.details ? ` · ${log.details}` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] shrink-0 font-medium" style={{ color: FAINT }}>
                          {new Date(log.createdAt ?? log.date).toLocaleString('fr-FR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Factures ── */}
          {tab === 'factures' && (
            <div className="rounded-2xl overflow-hidden" style={{ background: CARD, boxShadow: SH2 }}>
              {factures.length === 0 ? (
                <div className="py-16 text-center">
                  <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: FAINT }} />
                  <p className="text-sm font-medium" style={{ color: MUTED }}>Aucune facture générée</p>
                </div>
              ) : factures.map((f, i, arr) => {
                const isPaid = f.statut === 'PAYEE' || f.statut === 'paid';
                const isLate = f.statut === 'RETARDEE';
                return (
                  <div key={i} className="flex items-center justify-between px-5 py-4 transition"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = BG}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: isPaid ? GREEN_L : isLate ? RED_L : AMBER_L }}>
                        <FileText className="w-4 h-4"
                          style={{ color: isPaid ? GREEN : isLate ? RED : AMBER }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold" style={{ color: TEXT }}>
                          {f.periode ?? f.mois} {f.annee}
                        </p>
                        <p className="text-[11px]" style={{ color: FAINT }}>#{f.numeroFacture}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[13px] font-bold" style={{ color: TEXT }}>
                          {(f.montantTTC ?? f.amount ?? 0).toLocaleString()} FCFA
                        </p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: isPaid ? GREEN_L : isLate ? RED_L : AMBER_L,
                            color: isPaid ? GREEN : isLate ? RED : AMBER,
                          }}>
                          {isPaid ? 'Payée' : isLate ? 'En retard' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-center text-[11px]" style={{ color: FAINT }}>
            Données SYSCOHADA · TVA 18% · Export CSV disponible en haut de page
          </p>
        </div>
      )}
    </div>
  );
}
