# TODO - Auth améliorée (vérification email, mot de passe oublié, Google auto)

## Backend (NestJS)
- [x] Bloquer le login si `emailVerified === false` (sauf OAuth Google)
- [ ] Renforcer `register()` : générer token + expires et renvoyer un flag `needsEmailVerification`
- [x] Option sécurité: refuser `resetPassword` si email non vérifié (conformément au plan validé)
- [ ] Vérifier cohérence `validateGoogleLogin()` avec la propriété `emailVerified`

## Frontend (React)
- [x] Ajouter une page `VerifyEmail.jsx` : consommer `token` et appeler `/auth/verify-email`
- [x] Mettre à jour `Login.jsx` : gérer erreur “email non vérifié” + CTA “vérifier mon email”
- [x] Ajouter/ajuster la page Google callback pour redirection/connexion automatique
- [ ] Ajouter/ajuster l’UI “mot de passe oublié” si nécessaire (onglet / section)

## Tests / Validation
- [x] Mettre à jour `restodici-backend/test/auth.e2e-spec.ts` pour refléter le blocage login non vérifié (bloquage email non vérifié)
- [x] Lancer les tests backend

