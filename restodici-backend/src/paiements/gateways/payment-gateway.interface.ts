export interface InitiatePaymentOptions {
  amount: number;
  currency?: string;
  provider?: string; // sous-provider (ex: 'WAVE', 'ORANGE')
  phone?: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
  webhookUrl?: string;
}

export interface PaymentGatewayResult {
  paymentUrl?: string;
  transactionId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

export interface PaymentGateway {
  readonly name: string;
  initiate(options: InitiatePaymentOptions): Promise<PaymentGatewayResult>;
  verifyWebhook(payload: any, signature?: string): boolean;
  handleWebhook(payload: any): Promise<{
    transactionId: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    metadata?: any;
  }>;
}
