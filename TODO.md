# TODO — Intégration NovaSend Direct Payin (5 canaux)

## Étape 1 — Préparer le code existant (mapping & simulation)
- [ ] Modifier `restodici-backend/src/paiements/novasend.service.ts` : passer endpoint vers `POST /v1/direct/payin` et construire payload `reference/customerName/payin.amount/payin.provider/payin.msisdn/payin.otp/action.successUrl/action.failureUrl`
- [ ] Garder `simulateInitiation()` tant que `NOVASEND_API_KEY/NOVASEND_API_SECRET` manquent, et renvoyer `simulated=true`.
- [ ] Ajouter `otp` support dans DTO si nécessaire côté backend.

## Étape 2 — Persistance `reference -> provider` (remplacer pendingMap mémoire)
- [ ] Créer entité + module/DAO pour stocker `reference`, `provider`, `commandeId`.
- [ ] Lors de `initier`: persist `reference->provider`.
- [ ] Lors de webhook: lire depuis DB et déterminer `modePaiement`.

## Étape 3 — Webhook robuste NovaSend
- [ ] Ajuster `paiements.service.ts` / webhook pour extraire la reference/provider selon le body réel NovaSend.
- [ ] Conserver validation signature.

## Étape 4 — Frontend Caisse (NovaSend)
- [ ] Dans `restodici-frontend/src/pages/staff/CaissePage.jsx` : montrer champ OTP Orange (si mode ORANGE) et messages failback (*133#, *155#, *144*82#) selon canal.
- [ ] Pour Wave (provider WAVE): si `paymentUrl` reçu, rediriger automatiquement.
- [ ] Tant que backend simule: garder simulation réussie (UI bouton “Simuler…”).

## Étape 5 — Tests & formatage
- [ ] Corriger lint/prettier et relancer `npm test` (en traitant les échecs existants non bloquants).

