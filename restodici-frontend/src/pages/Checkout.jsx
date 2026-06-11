import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Tag, X, Phone, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { formatFCFA } from '../utils/formatters';
import { commandesService, createCommandesSocket } from '../services/commandes.service';
import { paiementsAPI, promosAPI } from '../services/api';
import orangeMoneyLogo from '../assets/payments/orange-money.svg';
import mtnMomoLogo from '../assets/payments/mtn-momo.svg';
import moovMoneyLogo from '../assets/payments/moov-money.svg';
import carteBancaireLogo from '../assets/payments/carte-bancaire.svg';

// Flip to true when NovaSend supports card payments in CI
const NOVASEND_CARD_ENABLED = false;

const ACCENT    = '#FF8C00';

const MODE_LABELS = {
  SUR_PLACE: 'Sur place', EMPORTER: 'À emporter', LIVRAISON: 'Livraison à domicile',
  sur_place: 'Sur place', emporter: 'À emporter', livraison: 'Livraison à domicile',
};

const PAYMENT_METHODS = [
  {
    id: 'orange_money', provider: 'ORANGE', name: 'Orange Money', shortName: 'Orange',
    logo: orangeMoneyLogo, accent: '#FF7900', accentLight: '#FFF3E0',
    borderActive: 'border-orange-400', bgActive: 'bg-orange-50',
    phoneRequired: true,
  },
  {
    id: 'mtn_money', provider: 'MOMO', name: 'MTN Mobile Money', shortName: 'MTN MoMo',
    logo: mtnMomoLogo, accent: '#FFCC00', accentLight: '#FFFDE7',
    borderActive: 'border-yellow-400', bgActive: 'bg-yellow-50',
    phoneRequired: true,
  },
  {
    id: 'moov_money', provider: 'MOOV', name: 'Moov Money', shortName: 'Moov',
    logo: moovMoneyLogo, accent: '#0066CC', accentLight: '#E3F0FF',
    borderActive: 'border-blue-400', bgActive: 'bg-blue-50',
    phoneRequired: true,
  },
  {
    id: 'wave', provider: 'WAVE', name: 'Wave', shortName: 'Wave',
    logo: null, accent: '#1DA1F2', accentLight: '#E8F5FD',
    borderActive: 'border-sky-400', bgActive: 'bg-sky-50',
    phoneRequired: false,
  },
  ...(NOVASEND_CARD_ENABLED ? [{
    id: 'card', provider: 'CARTE', name: 'Carte Bancaire', shortName: 'Carte',
    logo: carteBancaireLogo, accent: '#0F172A', accentLight: '#F5F0FF',
    borderActive: 'border-stone-600', bgActive: 'bg-[#FDF5EF]',
    phoneRequired: false,
  }] : []),
];

const PROVIDER_NOTE = {
  ORANGE: 'Vous allez recevoir une demande de paiement. Composez #144*46# pour récupérer votre OTP si nécessaire, puis confirmez dans votre application.',
  MOMO:   'Approuvez la transaction directement depuis l\'application MTN Mobile Money ou composez *133#.',
  MOOV:   'Assurez-vous que votre écran est déverrouillé pour recevoir la demande de paiement.',
  WAVE:   'Scannez le QR code ou appuyez sur le lien pour ouvrir l\'application Wave et confirmer le paiement.',
  CARTE:  'Votre banque va vérifier la transaction. Aucune action supplémentaire n\'est requise.',
};

const COUNTDOWN_SECS = 90;
const CLR_TER   = '#22C55E';
const CLR_AMBER = '#F59E0B';
const CLR_RED   = '#EF4444';

function CountdownRing({ total, current }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  const pct = current / total;
  const color = current > 30 ? CLR_TER : current > 10 ? CLR_AMBER : CLR_RED;
  return (
    <svg width={76} height={76} viewBox="0 0 76 76" className="block mx-auto">
      <circle cx={38} cy={38} r={R} fill="none" stroke="#E5E7EB" strokeWidth={5} />
      <circle
        cx={38} cy={38} r={R} fill="none"
        stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - pct)}
        transform="rotate(-90 38 38)"
        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
      />
      <text x={38} y={38} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 16, fontWeight: 700, fill: color, fontFamily: 'system-ui' }}>
        {current}
      </text>
    </svg>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const isB2B = user?.role === 'B2B';

  const [selectedMethod, setSelectedMethod] = useState('orange_money');
  const [pendingOrder, setPendingOrder]     = useState(null);
  const [phone, setPhone]                   = useState('');

  const [promoCode, setPromoCode]         = useState('');
  const [promoResult, setPromoResult]     = useState(null);
  const [promoError, setPromoError]       = useState('');
  const [promoLoading, setPromoLoading]   = useState(false);

  // Modal: idle | creating | waiting | success | failed
  const [modalState, setModalState]     = useState('idle');
  const [modalError, setModalError]     = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentUrl, setPaymentUrl]     = useState(null);
  const [countdown, setCountdown]       = useState(COUNTDOWN_SECS);
  const [canRetry, setCanRetry]         = useState(false);

  const socketRef  = useRef(null);
  const timerRef   = useRef(null);
  const orderIdRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('pendingOrder');
    if (saved) setPendingOrder(JSON.parse(saved));
    else navigate('/cart');
  }, [navigate]);

  useEffect(() => {
    if (user?.telephone && !phone) setPhone(user.telephone);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoError(''); setPromoResult(null);
    try {
      const r = await promosAPI.validate(promoCode.trim(), pendingOrder.restaurantId, pendingOrder.total ?? 0);
      setPromoResult(r.data);
    } catch (e) {
      setPromoError(e?.response?.data?.message || 'Code invalide');
    } finally { setPromoLoading(false); }
  };
  const removePromo = () => { setPromoResult(null); setPromoCode(''); setPromoError(''); };

  const cleanupSocket = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
  }, []);

  useEffect(() => () => cleanupSocket(), [cleanupSocket]);

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_SECS);
    setCanRetry(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setCanRetry(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const subscribePaymentSocket = useCallback((orderId) => {
    cleanupSocket();
    const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUser = cachedUser?.user || cachedUser;
    const socket = createCommandesSocket(currentUser);
    socketRef.current = socket;

    socket.on('commande.paiement', (payload) => {
      if (payload?.id === orderId) {
        cleanupSocket();
        setModalState('success');
        setTimeout(() => navigate(`/suivi/${orderId}`), 2000);
      }
    });

    socket.on('commande.paiement.echec', (payload) => {
      if (payload?.id === orderId) {
        cleanupSocket();
        setModalError(`Paiement refusé — ${payload.reason || 'transaction échouée'}`);
        setModalState('failed');
        setCanRetry(true);
      }
    });
  }, [cleanupSocket, navigate]);

  const doInitiatePayment = useCallback(async (orderId, total) => {
    const paiRes = await paiementsAPI.initier({
      commandeId: orderId,
      montant: total,
      customerName: user?.nom || user?.name || 'Client',
      telephone: phone.trim() || undefined,
      provider: method?.provider,
    });
    if (paiRes.data?.paymentUrl) setPaymentUrl(paiRes.data.paymentUrl);
  }, [user, phone, method]);

  const handlePay = async () => {
    const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const safeRestaurantId = UUID_V4_RE.test(pendingOrder?.restaurantId ?? '')
      ? pendingOrder.restaurantId : undefined;
    if (!safeRestaurantId) { navigate('/menu'); return; }

    setModalState('creating');
    setModalError('');
    setPaymentUrl(null);

    try {
      const VALID_MODES = ['SUR_PLACE', 'EMPORTER', 'LIVRAISON'];
      const rawMode = (pendingOrder.orderMode ?? '').toUpperCase();
      const modeLivraison = VALID_MODES.includes(rawMode) ? rawMode : 'SUR_PLACE';

      const orderPayload = {
        restaurantId: safeRestaurantId,
        modeLivraison,
        adresseLivraison: modeLivraison === 'LIVRAISON' ? pendingOrder.deliveryAddress : undefined,
        ...(modeLivraison === 'SUR_PLACE' && pendingOrder.tableNumber
          ? { tableNumber: String(pendingOrder.tableNumber) } : {}),
        lignes: pendingOrder.items.map(item => ({
          articleId: item.articleId,
          quantite: item.quantite ?? item.quantity ?? 1,
          ...(item.instructions ? { instructions: item.instructions } : {}),
          ...(item.variantLabel ? { variantLabel: item.variantLabel } : {}),
          ...(item.variantSupplement ? { variantSupplement: Number(item.variantSupplement) } : {}),
        })),
        ...(promoResult ? { codePromo: promoResult.promo.code } : {}),
      };

      const res = await commandesService.create(orderPayload);
      const order = res.data;
      orderIdRef.current = order.id;
      setCreatedOrder(order);
      clearCart();
      localStorage.removeItem('pendingOrder');

      if (isB2B) {
        setModalState('success');
        setTimeout(() => navigate('/b2b'), 2000);
        return;
      }

      setModalState('waiting');
      subscribePaymentSocket(order.id);
      startCountdown();
      await doInitiatePayment(order.id, effectiveTotal);

    } catch (err) {
      cleanupSocket();
      const raw = err?.response?.data?.message || err?.response?.data;
      const msg = Array.isArray(raw) ? raw.join(', ') : (typeof raw === 'string' ? raw : 'Une erreur est survenue');
      setModalError(msg);
      setModalState('failed');
      setCanRetry(true);
    }
  };

  const handleRetry = async () => {
    if (!orderIdRef.current) { setModalState('idle'); return; }
    setModalState('waiting');
    setModalError('');
    setPaymentUrl(null);
    subscribePaymentSocket(orderIdRef.current);
    startCountdown();
    try {
      await doInitiatePayment(orderIdRef.current, effectiveTotal);
    } catch (err) {
      cleanupSocket();
      const raw = err?.response?.data?.message || err?.response?.data;
      const msg = typeof raw === 'string' ? raw : 'Impossible de relancer le paiement';
      setModalError(msg);
      setModalState('failed');
    }
  };

  const handleClose = () => {
    cleanupSocket();
    setModalState('idle');
    setModalError('');
    setPaymentUrl(null);
    setCanRetry(false);
  };

  if (!pendingOrder) return null;

  const total          = pendingOrder.total ?? 0;
  const items          = pendingOrder.items ?? [];
  const effectiveTotal = Math.max(0, total - (promoResult?.remise ?? 0));
  const isOpen         = modalState !== 'idle';
  const phoneRequired  = !isB2B && (method?.phoneRequired ?? false);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[rgba(89,67,42,0.10)] shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/cart')}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white text-[#64748B] transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-[#0F172A] text-lg">
            {isB2B ? 'Confirmer la commande' : 'Paiement'}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Order summary */}
        <section className="bg-white rounded-2xl border border-[rgba(89,67,42,0.10)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(89,67,42,0.08)]">
            <p className="font-semibold text-[#0F172A] text-sm">{pendingOrder.restaurantName}</p>
            <p className="text-xs text-[#64748B]">
              {MODE_LABELS[pendingOrder.orderMode] || pendingOrder.orderMode}
              {pendingOrder.tableNumber && ` · Table ${pendingOrder.tableNumber}`}
              {pendingOrder.deliveryAddress && ` · ${pendingOrder.deliveryAddress}`}
            </p>
          </div>

          <div className="px-5 py-4 space-y-2.5">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-start text-sm">
                <div>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-lg bg-[#FFF0DF] text-[#FF8C00] font-bold text-xs flex items-center justify-center">
                      {item.quantite ?? item.quantity ?? 1}
                    </span>
                    <span className="text-[#0F172A] font-medium">{item.nom || 'Article'}</span>
                  </span>
                  {item.variantLabel && (
                    <p className="text-xs text-[#FF8C00] mt-0.5 ml-6 font-semibold">{item.variantLabel}</p>
                  )}
                  {item.instructions && (
                    <p className="text-xs text-[#64748B] mt-0.5 ml-6 italic">{item.instructions}</p>
                  )}
                </div>
                <span className="text-[#64748B] font-medium ml-4 shrink-0">
                  {formatFCFA((item.prix ?? 0) * (item.quantite ?? item.quantity ?? 1))}
                </span>
              </div>
            ))}
          </div>

          <div className="mx-5 border-t border-[rgba(89,67,42,0.08)]" />
          <div className="px-5 py-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#64748B]">Sous-total</span>
              <span className="text-sm font-semibold text-[#0F172A]">{formatFCFA(total)}</span>
            </div>
            {promoResult && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#059669] font-semibold flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Code {promoResult.promo.code}
                </span>
                <span className="text-sm font-bold text-[#059669]">−{formatFCFA(promoResult.remise)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-[rgba(89,67,42,0.08)]">
              <span className="font-bold text-[#0F172A]">Total à payer</span>
              <span className="text-xl font-extrabold text-[#FF8C00]">
                {formatFCFA(effectiveTotal)} FCFA
              </span>
            </div>
          </div>
        </section>

        {/* Code promo */}
        {!isB2B && (
          <section className="bg-white rounded-2xl border border-[rgba(89,67,42,0.10)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-[#FF8C00]" />
              <span className="text-sm font-bold text-[#0F172A]">Code promo</span>
            </div>
            {promoResult ? (
              <div className="flex items-center justify-between rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-[#059669]">{promoResult.promo.code} appliqué !</p>
                  <p className="text-xs text-[#064E3B] mt-0.5">
                    Réduction de {formatFCFA(promoResult.remise)} déduite
                    {promoResult.promo.type === 'PERCENT' ? ` (−${promoResult.promo.valeur}%)` : ''}
                  </p>
                </div>
                <button onClick={removePromo} className="text-[#059669] hover:text-[#065F46]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                  placeholder="Entrez votre code…"
                  className="flex-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm font-mono font-semibold uppercase tracking-widest text-[#0F172A] focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none transition"
                />
                <button onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()}
                  className="rounded-xl bg-[#FF8C00] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#E07A00] disabled:opacity-60 transition">
                  {promoLoading ? '…' : 'Appliquer'}
                </button>
              </div>
            )}
            {promoError && <p className="mt-2 text-xs text-red-600 font-semibold">{promoError}</p>}
          </section>
        )}

        {/* Payment method */}
        {isB2B ? (
          <section className="bg-[#FFF0DF] rounded-2xl border border-[rgba(192,80,21,0.20)] p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">📋</span>
              <div>
                <h2 className="font-bold text-[#FF8C00] mb-1">Facturation mensuelle B2B</h2>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Cette commande sera ajoutée à votre facture mensuelle consolidée.
                  Vous recevrez en fin de mois une <strong>facture SYSCOHADA</strong> globale.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-[rgba(89,67,42,0.10)] p-5">
            <h2 className="font-bold text-[#0F172A] mb-4">Méthode de paiement</h2>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(m => {
                const active = selectedMethod === m.id;
                return (
                  <button key={m.id} type="button" onClick={() => setSelectedMethod(m.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${active ? `${m.borderActive} ${m.bgActive}` : 'border-[rgba(89,67,42,0.12)] hover:border-[rgba(89,67,42,0.25)]'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      {m.logo ? (
                        <img src={m.logo} alt={m.name} className="h-8 w-auto object-contain" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-extrabold shrink-0"
                          style={{ background: m.accent }}>W</div>
                      )}
                      <div className={`ml-auto w-4 h-4 rounded-full border-2 transition ${active ? 'border-[#FF8C00] bg-[#FF8C00]' : 'border-[#64748B]/30'}`}>
                        {active && <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5" />}
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-[#0F172A] leading-tight">{m.name}</p>
                  </button>
                );
              })}
            </div>

            {/* Phone field for mobile money */}
            {method?.phoneRequired && (
              <div className="mt-4">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A] mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#FF8C00]" />
                  Numéro {method.name} *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ex : 07 XX XX XX XX"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#0F172A] focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none transition"
                />
                <p className="mt-1.5 text-xs text-[#64748B]">
                  Vous recevrez une demande de confirmation sur ce numéro.
                </p>
              </div>
            )}

            {method?.id === 'wave' && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-sky-50 border border-sky-200 px-4 py-3">
                <span className="text-sky-500 mt-0.5 shrink-0">💡</span>
                <p className="text-xs text-sky-700 leading-relaxed">
                  Vous serez redirigé vers Wave pour finaliser le paiement par QR code ou lien profond.
                </p>
              </div>
            )}
          </section>
        )}

        {!isB2B && (
          <div className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 text-xs text-[#64748B]">
            <span className="text-base mt-0.5">🔒</span>
            <p>Paiement sécurisé via NovaSend. Aucune donnée bancaire n'est stockée sur nos serveurs.</p>
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={phoneRequired && !phone.trim()}
          className="w-full py-4 rounded-2xl font-extrabold text-white text-base bg-[#FF8C00] hover:bg-[#E07A00] active:scale-[0.98] transition-all shadow-lg shadow-[#FF8C00]/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isB2B
            ? `Confirmer la commande · ${formatFCFA(effectiveTotal)} FCFA`
            : `Payer ${formatFCFA(effectiveTotal)} FCFA · ${method?.shortName}`}
        </button>

        <p className="text-center text-xs text-[#64748B]/70">
          En confirmant, vous acceptez nos conditions générales d'utilisation.
        </p>
      </main>

      {/* ── Payment modal ────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">

            <div className="px-6 py-5 flex items-center gap-3"
              style={{ background: method?.accentLight ?? '#FDF5EF' }}>
              {method?.logo ? (
                <img src={method.logo} alt={method.name} className="h-8 w-auto object-contain" />
              ) : (
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-extrabold"
                  style={{ background: method?.accent }}>W</div>
              )}
              <div className="flex-1">
                <p className="font-bold text-[#0F172A] text-sm">{method?.name}</p>
                <p className="text-xs text-[#64748B]">{formatFCFA(effectiveTotal)} FCFA</p>
              </div>
              {(modalState === 'idle' || modalState === 'failed') && (
                <button onClick={handleClose} className="text-[#64748B] hover:text-[#0F172A]">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="px-6 py-6">

              {modalState === 'creating' && (
                <div className="text-center py-2">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full animate-spin"
                    style={{ border: `3px solid ${ACCENT}`, borderTopColor: 'transparent' }} />
                  <p className="font-bold text-[#0F172A]">Création de la commande…</p>
                  <p className="text-xs text-[#64748B] mt-1">Veuillez patienter</p>
                </div>
              )}

              {modalState === 'waiting' && (
                <div className="text-center">
                  <CountdownRing total={COUNTDOWN_SECS} current={countdown} />
                  <p className="font-bold text-[#0F172A] mt-3 mb-1">
                    En attente de confirmation
                  </p>
                  {phone.trim() && (
                    <p className="text-sm text-[#64748B] mb-1">
                      Demande envoyée au <strong className="text-[#0F172A]">{phone}</strong>
                    </p>
                  )}
                  <p className="text-xs text-[#64748B] mb-4 leading-relaxed px-2">
                    {PROVIDER_NOTE[method?.provider] || 'Confirmez le paiement sur votre téléphone.'}
                  </p>

                  {paymentUrl && (
                    <a href={paymentUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold mb-4 transition hover:opacity-90"
                      style={{ background: method?.accent ?? ACCENT }}>
                      <ExternalLink className="w-4 h-4" />
                      Ouvrir Wave pour payer
                    </a>
                  )}

                  <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mx-4">
                    <div className="h-full rounded-full animate-pulse"
                      style={{ background: method?.accent ?? ACCENT, width: '60%' }} />
                  </div>

                  {canRetry && (
                    <button onClick={handleRetry}
                      className="mt-4 flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl border text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition"
                      style={{ borderColor: 'rgba(89,67,42,0.15)' }}>
                      <RefreshCw className="w-4 h-4" />
                      Relancer le paiement
                    </button>
                  )}
                </div>
              )}

              {modalState === 'success' && (
                <div className="text-center py-2">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="font-bold text-[#0F172A] text-lg mb-1">
                    {isB2B ? 'Commande enregistrée !' : 'Paiement confirmé !'}
                  </p>
                  {createdOrder && (
                    <p className="text-sm text-[#64748B] mb-1">
                      #{createdOrder.numero || createdOrder.id?.slice(0, 8).toUpperCase()}
                    </p>
                  )}
                  <p className="text-xs text-[#64748B] animate-pulse">
                    Redirection en cours…
                  </p>
                </div>
              )}

              {modalState === 'failed' && (
                <div className="text-center py-2">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="font-bold text-[#0F172A] mb-1">Paiement échoué</p>
                  {modalError && (
                    <p className="text-sm text-red-500 mb-4 leading-relaxed">{modalError}</p>
                  )}
                  {orderIdRef.current && (
                    <button onClick={handleRetry}
                      className="w-full py-3 rounded-2xl text-white font-bold text-sm mb-3 transition hover:opacity-90"
                      style={{ background: ACCENT }}>
                      Réessayer le paiement
                    </button>
                  )}
                  <button onClick={handleClose}
                    className="w-full py-2.5 rounded-xl border border-[rgba(89,67,42,0.12)] text-[#64748B] text-sm font-medium hover:bg-[#F8FAFC] transition">
                    Retour
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
