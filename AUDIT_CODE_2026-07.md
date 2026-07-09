# Audit du code — RESTODICI (mise à jour)

**Date :** 9 juillet 2026
**Périmètre :** Backend NestJS (`restodici-backend`, ~14 600 LOC) + Frontend React/Vite (`restodici-frontend`, ~38 400 LOC)
**Contexte :** Réalisé après application des correctifs de l'audit précédent (Sprints 1–4). Ce document reflète l'état **actuel** du dépôt (HEAD `0c4bad3`).

---

## Note globale : 7,5 / 10

Nette amélioration côté sécurité et performance depuis le précédent audit (7/10). Restent : **2 fallbacks JWT résiduels**, l'absence d'en-têtes de sécurité HTTP, la config `rawBody` du webhook, et la dette structurelle (God Components / God Service, migration TS, migrations DB) déjà identifiée et volontairement reportée.

| Domaine | Score | Évolution |
|---|---|---|
| Architecture | 8/10 | → |
| Sécurité | 7/10 | ▲ (5→7) |
| Performance | 7/10 | ▲ (6→7) |
| Qualité du code | 7/10 | → |
| Tests | 6/10 | ▼ (suite actuellement rouge) |
| Infrastructure | 6/10 | → |

---

## 1. Ce qui a été corrigé depuis le dernier audit ✅

Vérifié dans le code actuel :

- **JWT_SECRET obligatoire au démarrage** (`main.ts` lève une exception si absent).
- **`jwt.strategy.ts`** : fallback `dev-secret-change-me` supprimé.
- **CORS WebSocket fermé** (plus de `cors: true`, liste d'origines).
- **Signature webhook NovaSend obligatoire** (rejet si secret/signature absents).
- **`/paiements/simuler`** protégé par JWT + rôle ADMIN/GERANT.
- **Redis** : mot de passe requis, bind `127.0.0.1`, healthcheck.
- **N+1 corrigées** dans `createCommande` (`In` + `Map`).
- **Cache** activé sur `menu/restaurants`, `menu/categories`, `menu/restaurant/:id`.
- **Refresh token en O(1)** (colonne `refreshTokenId` indexée, plus d'itération bcrypt sur tous les users).
- **Swagger** exposé sur `/api/docs`.
- **Mot de passe min. 8** (backend DTO + service + `validators.js`).
- **Dépendances React retirées** du `package.json` backend ; fichiers d'entités vides supprimés.
- **Charte centralisée** (`theme/colors.js`) + **bibliothèque de composants** (`components/ui/`).
- **Contraintes de format** (téléphone CI, email, mdp, URL) sur tous les formulaires.

---

## 2. 🔴 Critique — à corriger en priorité

### 2.1 Deux fallbacks `dev-secret-change-me` subsistent

**Fichiers :**
- `src/auth/auth.module.ts:25` — **clé de signature** des JWT (`JwtModule.registerAsync`)
- `src/commandes/commandes.gateway.ts:75` — vérification des JWT WebSocket

```ts
// auth.module.ts
secret: configService.get<string>('JWT_SECRET') || 'dev-secret-change-me',
// commandes.gateway.ts
payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me') ...
```

Le premier (`auth.module.ts`) **n'avait jamais été listé** par l'audit précédent — c'est pourtant la clé qui **signe** les tokens. Le second a été corrigé puis **perdu** (probablement lors d'un cycle `git stash` pendant les tests) et n'a pas été recommité.

**Atténuation :** le garde de démarrage dans `main.ts` empêche l'application de booter sans `JWT_SECRET`, donc ces fallbacks sont **inatteignables en pratique** tant que `main.ts` s'exécute. Mais ils doivent être supprimés (défense en profondeur, lisibilité, et parce que certains contextes de test n'exécutent pas `main.ts`).

**Correction :** retirer `|| 'dev-secret-change-me'` aux deux endroits (le secret est déjà garanti par `main.ts`).

---

## 3. 🟠 Élevé

### 3.1 `rawBody` non configuré — signature webhook potentiellement inopérante

**Fichier :** `src/main.ts` (aucun `rawBody: true`) vs `paiements.controller.ts` :

```ts
const raw = req.rawBody?.toString() ?? JSON.stringify(body);
const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
```

`req.rawBody` est **toujours `undefined`** car `NestFactory.create(AppModule, { rawBody: true })` n'est pas activé. La vérification retombe sur `JSON.stringify(body)`, dont les octets ne correspondent quasi jamais à la charge signée par NovaSend → **les webhooks légitimes risquent d'être rejetés** (`invalid_signature`). Depuis que la signature est obligatoire, cela peut **bloquer les confirmations de paiement**.

**Correction :** activer `rawBody: true` à la création de l'app et un `bodyParser` `verify` conservant le buffer brut, puis signer/valider sur ces octets.

### 3.2 God Components (frontend) — pire que reporté

| Fichier | Lignes |
|---|---|
| `GerantDashboard.jsx` | **4 712** |
| `AdminDashboard.jsx` | **3 254** |
| `B2BDashboard.jsx` | **3 173** |
| `clientDashboard.jsx` | 1 909 |
| `StaffDashboard.jsx` | 1 738 |
| `Checkout.jsx` | 1 430 |

Découpage par onglet/section dans des fichiers dédiés (< 300–400 lignes). La bibliothèque `components/ui/` posée cette semaine facilite désormais ce découpage.

### 3.3 God Service B2B

`src/b2b/services/b2b.service.ts` = **2 363 lignes** (comptes, collaborateurs, équipes, commandes groupées, factures, invitations, rapports). Découper en sous-services.

---

## 4. 🟡 Moyen

- **Helmet absent** (`main.ts`) — aucun en-tête de sécurité HTTP (CSP, HSTS, X-Frame-Options, X-Content-Type-Options). Ajouter `helmet()`. *(nouveau — non relevé précédemment)*
- **`twoFactorSecret` en clair** en base (`user.entity.ts:65`) — chiffrer au repos (AES-256-GCM). *(reporté)*
- **Refresh token dans `localStorage`** (`api.js`) — exfiltrable en cas de XSS. Cible : cookie `HttpOnly`. *(reporté)*
- **Doublon `uploads/` + `storage/`** — deux modules d'upload S3 coexistent. Consolider. *(reporté)*
- **47 `window.confirm/alert`** côté frontend — UX dégradée, non stylable. Remplacer par une modale (le composant `Modal` existe désormais). *(reporté)*
- **Typage faible backend** : ~96 `: any` explicites.
- **Extensions mixtes frontend** : 66 `.jsx`, 18 `.js`, 1 `.tsx`, 1 `.ts` — pas de type-checking réel. Migration TS progressive. *(reporté)*

---

## 5. 🟢 Faible / Infrastructure

- **Pas de migrations TypeORM** : `synchronize` reste auto hors production. La nouvelle colonne `refreshTokenId` devra être créée par migration en prod. Mettre en place `migrations/` + `synchronize: false`. *(reporté)*
- **Suite de tests actuellement rouge** : ~22 tests backend en échec (échecs **pré-existants**, indépendants des correctifs récents — vérifié par comparaison avant/après). 21 specs backend, 6 tests unitaires frontend, 2 e2e Playwright. À stabiliser + ajouter des tests de contrôle d'accès (rôle interdit → 403) et un test webhook (signature valide/invalide).
- **`TypeOrmModule.forFeature` racine conservé** : contrairement à ce que suggérait l'audit précédent, il est **réellement utilisé** par `AppService` (et `SystemConfig` n'est déclaré nulle part ailleurs) — à **conserver**.

---

## 6. Points positifs

- Architecture modulaire NestJS propre ; `ThrottlerModule` global, `ValidationPipe` global, Swagger.
- **0 `console.log`** côté frontend, quasi aucun TODO/FIXME.
- **`.env` non tracké**, aucun secret en dur détecté dans le code.
- Contrôleurs sensibles gardés (`@UseGuards(AuthGuard, RolesGuard)` + `@Roles`) ; les 2 contrôleurs « sans garde de classe » (`app.controller`, `b2b-invitations`) sont **publics par conception** (health/stats publics, acceptation d'invitation par token).
- Charte + composants réutilisables désormais centralisés.

---

## 7. Plan d'action priorisé

| # | Action | Effort | Prio |
|---|---|---|---|
| 1 | Retirer les 2 fallbacks JWT (`auth.module.ts`, `commandes.gateway.ts`) | 15 min | 🔴 |
| 2 | Activer `rawBody` + valider la signature webhook sur les octets bruts | 1 h | 🟠 |
| 3 | Ajouter `helmet()` | 15 min | 🟡 |
| 4 | Chiffrer `twoFactorSecret` au repos | 4 h | 🟡 |
| 5 | Migrations TypeORM + `synchronize: false` | 4 h | 🟡 |
| 6 | Stabiliser la suite de tests + tests d'accès (403) + test webhook | 1 j | 🟡 |
| 7 | Découper les God Components (Gerant/Admin/B2B) et le God Service B2B | 3–5 j | 🟠 |
| 8 | Migration TypeScript progressive du frontend | 3–5 j | 🟢 |
| 9 | Refresh token en cookie HttpOnly ; consolider uploads/storage ; remplacer confirm() par Modal | 1–2 j | 🟢 |

---

*Les items 1 à 3 (≈1h30 au total) referment les dernières brèches concrètes ouvertes en production.*
