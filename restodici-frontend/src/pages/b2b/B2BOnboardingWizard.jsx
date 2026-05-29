// src/pages/b2b/B2BOnboardingWizard.jsx
import { useState } from 'react';
import {
  UtensilsCrossed, ShoppingBag, Users, FileText,
  CheckCircle, ArrowRight, Loader2, Building2, X,
} from 'lucide-react';
import { b2bAPI } from '../../services/api';

const A = '#C05015';
const AL = '#FBE8DC';
const SF = '#F9F7F5';
const BD = 'rgba(89,67,42,0.10)';

const STEPS = ['Bienvenue', 'Votre entreprise', 'Découverte', 'C\'est parti !'];

function StepDots({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((_, i) => (
        <div key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            background: i <= current ? A : '#E5E7EB',
          }} />
      ))}
    </div>
  );
}

export default function B2BOnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    raisonSociale: '',
    numeroRCCM: '',
    numeroContribuable: '',
    emailProfessionnel: user?.email || '',
    telephoneProfessionnel: '',
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleCompteSubmit = async () => {
    const required = ['raisonSociale', 'numeroRCCM', 'numeroContribuable', 'emailProfessionnel', 'telephoneProfessionnel'];
    const missing = required.filter(k => !form[k]?.trim());
    if (missing.length) { setErr('Tous les champs obligatoires sont requis'); return; }
    setSaving(true);
    setErr('');
    try {
      await b2bAPI.createCompte(form);
      setStep(2);
    } catch (e) {
      setErr(e.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">

        {/* Header gradient */}
        <div className="px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #181A20 0%, #2B1500 100%)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: A }}>
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-base leading-tight">Resto d'ici</p>
              <p className="text-[10px] text-white/40 font-semibold tracking-widest uppercase">Espace Entreprise</p>
            </div>
          </div>
          <StepDots current={step} />
          <p className="text-xs text-white/40 text-center">{STEPS[step]} · Étape {step + 1} / {STEPS.length}</p>
        </div>

        <div className="p-8">

          {/* ── STEP 0: Bienvenue ── */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: AL }}>
                <Building2 className="w-10 h-10" style={{ color: A }} />
              </div>
              <h2 className="text-2xl font-extrabold text-[#111827] mb-3">
                Bonjour {user?.prenom || user?.nom?.split(' ')[0] || ''} !
              </h2>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-6">
                Bienvenue sur <strong>Resto d'ici Entreprise</strong>. En 2 minutes, configurez votre espace pour passer des commandes groupées pour vos équipes avec facturation mensuelle SYSCOHADA.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { icon: ShoppingBag, label: 'Commandes groupées', desc: 'Min. 4h à l\'avance' },
                  { icon: Users,        label: 'Budgets équipe',      desc: 'Par collaborateur' },
                  { icon: FileText,     label: 'Facture SYSCOHADA',   desc: 'En fin de mois' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="rounded-2xl p-3 text-center" style={{ background: SF }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: AL }}>
                      <Icon className="w-4 h-4" style={{ color: A }} />
                    </div>
                    <p className="text-[11px] font-bold text-[#111827]">{label}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: A }}>
                Configurer mon compte entreprise <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={onComplete} className="mt-3 w-full text-sm text-[#9CA3AF] hover:text-[#6B7280]">
                Passer pour l'instant
              </button>
            </div>
          )}

          {/* ── STEP 1: Compte entreprise ── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-extrabold text-[#111827] mb-1">Votre entreprise</h2>
              <p className="text-sm text-[#6B7280] mb-5">Ces informations figureront sur vos factures SYSCOHADA.</p>

              <div className="space-y-3">
                {[
                  { k: 'raisonSociale',         label: 'Raison sociale *',              ph: 'SARL Mon Entreprise CI' },
                  { k: 'numeroRCCM',            label: 'N° RCCM *',                     ph: 'CI-ABJ-2024-B-12345' },
                  { k: 'numeroContribuable',    label: 'N° Contribuable (NIF) *',       ph: 'CI-123456789-A' },
                  { k: 'emailProfessionnel',    label: 'Email professionnel *',          ph: 'comptabilite@entreprise.ci' },
                  { k: 'telephoneProfessionnel', label: 'Téléphone professionnel *',    ph: '+225 01 23 45 67 89' },
                ].map(f => (
                  <div key={f.k}>
                    <label className="block text-xs font-semibold text-[#374151] mb-1.5">{f.label}</label>
                    <input
                      type={f.k === 'emailProfessionnel' ? 'email' : 'text'}
                      value={form[f.k]}
                      onChange={set(f.k)}
                      placeholder={f.ph}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ background: SF, border: `1px solid ${BD}` }}
                    />
                  </div>
                ))}
              </div>

              {err && <p className="mt-3 text-sm font-semibold text-red-500">{err}</p>}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)}
                  className="px-4 py-3 rounded-xl border text-sm font-medium text-[#6B7280]"
                  style={{ borderColor: BD }}>
                  Retour
                </button>
                <button onClick={handleCompteSubmit} disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: A, opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {saving ? 'Enregistrement…' : 'Continuer'}
                </button>
              </div>
              <p className="text-[11px] text-[#9CA3AF] text-center mt-3">
                Votre compte sera activé après validation par notre équipe (24–48h).
              </p>
            </div>
          )}

          {/* ── STEP 2: Tour des fonctionnalités ── */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-center mb-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-[#111827] text-center mb-1">Compte créé !</h2>
              <p className="text-sm text-[#6B7280] text-center mb-6">Voici ce que vous pouvez faire dès maintenant :</p>

              <div className="space-y-3 mb-6">
                {[
                  {
                    icon: ShoppingBag, color: A, bg: AL,
                    title: 'Commander pour toute l\'équipe',
                    desc: 'Choisissez les plats du menu, assignez les repas par collaborateur, planifiez la livraison. Délai min. 4h.',
                  },
                  {
                    icon: Users, color: '#2563EB', bg: '#DBEAFE',
                    title: 'Inviter les collaborateurs',
                    desc: 'Envoyez des invitations par email. Chaque collaborateur a un budget mensuel que vous contrôlez.',
                  },
                  {
                    icon: FileText, color: '#7C3AED', bg: '#EDE9FE',
                    title: 'Facturation mensuelle',
                    desc: 'Toutes vos commandes sont consolidées en une facture SYSCOHADA payable en fin de mois.',
                  },
                ].map(({ icon: Icon, color, bg, title, desc }) => (
                  <div key={title} className="flex items-start gap-4 p-4 rounded-2xl" style={{ background: SF }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111827]">{title}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setStep(3)}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: A }}>
                Suivant <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 3: C'est parti ! ── */}
          {step === 3 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-extrabold text-[#111827] mb-3">Vous êtes prêt !</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed mb-8">
                Votre espace entreprise est configuré. Commencez par passer votre première commande groupée pour votre équipe.
              </p>
              <button onClick={() => { onComplete('order'); }}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 mb-3"
                style={{ background: A }}>
                <ShoppingBag className="w-5 h-5" />
                Passer ma première commande
              </button>
              <button onClick={() => { onComplete('invite'); }}
                className="w-full py-3 rounded-2xl font-bold border text-sm flex items-center justify-center gap-2"
                style={{ borderColor: A, color: A }}>
                <Users className="w-4 h-4" />
                Inviter mon équipe d'abord
              </button>
              <button onClick={() => onComplete()} className="mt-3 w-full text-sm text-[#9CA3AF] hover:text-[#6B7280]">
                Explorer le tableau de bord
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
