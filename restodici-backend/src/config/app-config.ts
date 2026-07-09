/* ═══════════════════════════════════════════════════════════════
   config/app-config.ts — Source UNIQUE des URLs & origines
   Plus aucune URL/CORS en dur dispersée dans le code : tout passe
   par des variables d'environnement, avec des valeurs de repli
   uniquement en développement.
   ═══════════════════════════════════════════════════════════════ */

/** Origines autorisées en développement (front Vite, proxies locaux). */
const DEV_ORIGINS: string[] = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:3000',
];

/**
 * Origines CORS autorisées.
 * - Production : uniquement celles listées dans `CORS_ORIGINS` (ou `FRONTEND_URL`).
 * - Développement : les defaults locaux + celles de l'environnement.
 */
export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '';
  const fromEnv = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === 'production') {
    return fromEnv;
  }
  return [...new Set([...DEV_ORIGINS, ...fromEnv])];
}

/** Base URLs des services externes — surchargées par l'environnement. */
export const EXTERNAL_URLS = {
  novasend: process.env.NOVASEND_BASE_URL || 'https://business.novasend.app/v1',
  novasendPayments:
    process.env.NOVASEND_PAYMENTS_URL || 'https://api.novasend.ci/v1/payments',
  fcmSend: process.env.FCM_SEND_URL || 'https://fcm.googleapis.com/fcm/send',
};
