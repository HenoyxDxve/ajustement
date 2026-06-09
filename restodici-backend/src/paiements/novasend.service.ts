import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomUUID } from 'crypto';

export type NovaSendProvider = 'WAVE' | 'NOVASEND' | 'ORANGE' | 'MOMO' | 'MOOV';

export interface InitiatePaymentParams {
  reference: string;
  amount: number;
  customerName: string;
  telephone?: string;
  otp?: string;
  provider: NovaSendProvider;
}

export interface InitiatePaymentResult {
  sessionId: string;
  paymentUrl?: string;
  simulated: boolean;
}

// Fournisseurs NovaSend qui utilisent un lien/QR de paiement
const LINK_PROVIDERS: NovaSendProvider[] = ['WAVE', 'NOVASEND'];

@Injectable()
export class NovaSendService {
  private readonly logger = new Logger(NovaSendService.name);
  private readonly BASE = 'https://business.novasend.app/v1';

  // Mapping en mémoire référence → provider pour enrichir le webhook
  private readonly pendingMap = new Map<string, NovaSendProvider>();

  constructor(private config: ConfigService) {}

  get isConfigured(): boolean {
    return !!(
      this.config.get<string>('NOVASEND_API_KEY') &&
      this.config.get<string>('NOVASEND_API_SECRET')
    );
  }

  getProvider(reference: string): NovaSendProvider | undefined {
    return this.pendingMap.get(reference);
  }

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    this.pendingMap.set(params.reference, params.provider);

    if (!this.isConfigured) {
      return this.simulateInitiation(params);
    }
    return this.callApi(params);
  }

  private async callApi(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const apiKey    = this.config.get<string>('NOVASEND_API_KEY')!;
    const apiSecret = this.config.get<string>('NOVASEND_API_SECRET')!;
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const appUrl = this.config.get<string>('APP_URL') || 'http://localhost:5173';

    // NOVASEND (propre à la plateforme) utilise le provider WAVE en back-end
    const apiProvider = params.provider === 'NOVASEND' ? 'WAVE' : params.provider;
    const isLink = LINK_PROVIDERS.includes(params.provider);

    const payload: Record<string, any> = {
      reference: params.reference,
      customerName: params.customerName,
      payin: {
        amount:   params.amount,
        provider: apiProvider,
        country:  'CI',
        ...(params.telephone ? { msisdn: params.telephone } : {}),
        ...(!isLink && params.otp ? { otp: params.otp } : {}),
      },
      action: {
        successUrl: `${appUrl}/paiement/success`,
        failureUrl: `${appUrl}/paiement/failure`,
      },
    };

    try {
      const { data } = await axios.post(`${this.BASE}/direct/payin`, payload, {
        headers: {
          Authorization:      `Basic ${credentials}`,
          'X-Idempotency-Key': randomUUID(),
          'Content-Type':     'application/json',
        },
        timeout: 15_000,
      });
      return { sessionId: data.id, paymentUrl: data.paymentUrl, simulated: false };
    } catch (err: any) {
      this.logger.error('NovaSend API error', err?.response?.data ?? err.message);
      throw err;
    }
  }

  private simulateInitiation(params: InitiatePaymentParams): InitiatePaymentResult {
    const sessionId = `sim_${randomUUID().slice(0, 8)}`;
    const isLink = LINK_PROVIDERS.includes(params.provider);
    const appUrl = this.config.get<string>('APP_URL') || 'http://localhost:5173';

    return {
      sessionId,
      // Lien factice pour afficher le QR en simulation
      paymentUrl: isLink
        ? `${appUrl}/paiement/preview?ref=${params.reference}&session=${sessionId}&montant=${params.amount}`
        : undefined,
      simulated: true,
    };
  }
}
