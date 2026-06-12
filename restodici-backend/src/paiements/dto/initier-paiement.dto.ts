import { NovaSendProvider } from '../novasend.service';

export class InitierPaiementDto {
  commandeId!: string;
  provider!: NovaSendProvider;
  montant!: number;
  telephone?: string;
  customerName?: string;
  otp?: string;
  /** Nom de l'intégration de paiement à utiliser (ex: 'novasend'). Fallback sur NovaSendService direct si absent. */
  integrationName?: string;
}
