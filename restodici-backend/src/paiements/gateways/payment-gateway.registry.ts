import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Integration,
  IntegrationType,
} from '../../common/entities/integration.entity';
import { PaymentGateway } from './payment-gateway.interface';
import { NovaSendGateway } from './novasend.gateway';

@Injectable()
export class PaymentGatewayRegistry {
  private readonly logger = new Logger(PaymentGatewayRegistry.name);

  constructor(
    @InjectRepository(Integration)
    private readonly integrationRepo: Repository<Integration>,
  ) {}

  /**
   * Retourne le gateway correspondant au nom donné en chargeant
   * sa configuration depuis la table `integrations`.
   * Lève NotFoundException si l'intégration n'existe pas ou n'est pas active.
   */
  async getGateway(name: string): Promise<PaymentGateway> {
    const integration = await this.integrationRepo.findOne({
      where: { name, type: IntegrationType.PAYMENT, enabled: true },
    });

    if (!integration) {
      // Fallback : essayer sans la contrainte enabled pour un meilleur message d'erreur
      const exists = await this.integrationRepo.findOne({ where: { name } });
      if (exists) {
        throw new NotFoundException(
          `L'intégration de paiement "${name}" existe mais n'est pas activée`,
        );
      }
      throw new NotFoundException(
        `Aucune intégration de paiement "${name}" trouvée`,
      );
    }

    return this.buildGateway(integration);
  }

  /**
   * Retourne tous les gateways de paiement activés.
   */
  async getEnabledPaymentGateways(): Promise<PaymentGateway[]> {
    const integrations = await this.integrationRepo.find({
      where: { type: IntegrationType.PAYMENT, enabled: true },
    });

    return integrations
      .map((integration) => {
        try {
          return this.buildGateway(integration);
        } catch (err) {
          this.logger.warn(
            `Impossible de charger le gateway "${integration.name}": ${(err as Error).message}`,
          );
          return null;
        }
      })
      .filter((gw): gw is PaymentGateway => gw !== null);
  }

  // ── Factory interne ────────────────────────────────────────────────────────

  private buildGateway(integration: Integration): PaymentGateway {
    const normalized = integration.name.toLowerCase().trim();

    switch (normalized) {
      case 'novasend':
        return new NovaSendGateway(integration);

      default:
        throw new NotFoundException(
          `Type de gateway inconnu : "${integration.name}". Seul "novasend" est supporté pour l'instant.`,
        );
    }
  }
}
