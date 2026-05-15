// src/stocks/stocks.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../menu/entities/article.entity';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Article) private articleRepo: Repository<Article>,
  ) {}

  // GET /stocks — Inventaire complet
  async getAll(restaurantId?: string) {
    const query = this.articleRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.categorie', 'categorie')
      .leftJoinAndSelect('article.restaurant', 'restaurant');

    if (restaurantId) {
      query.where('article.restaurantId = :restaurantId', { restaurantId });
    }

    const articles = await query.orderBy('article.nom', 'ASC').getMany();

    return articles.map((article) => ({
      id: article.id,
      nom: article.nom,
      stock: article.stock || 0,
      seuil: article.seuilMin ?? 5,
      disponible: article.disponible,
      categorie: article.categorie?.nom,
      restaurantId: article.restaurantId,
      restaurantNom: article.restaurant?.nom,
    }));
  }

  // GET /stocks/alerts — Articles en rupture ou sous seuil
  async getAlerts(restaurantId?: string) {
    const query = this.articleRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.categorie', 'categorie')
      .where('article.disponible = true')
      .andWhere(
        '(article.stock IS NULL OR article.stock <= COALESCE(article.seuilMin, 5))',
      );

    if (restaurantId) {
      query.andWhere('article.restaurantId = :restaurantId', { restaurantId });
    }

    const alerts = await query.orderBy('article.stock', 'ASC').getMany();

    return alerts.map((article) => ({
      id: article.id,
      nom: article.nom,
      stock: article.stock || 0,
      seuil: article.seuilMin ?? 5,
      categorie: article.categorie?.nom,
    }));
  }

  // PATCH /stocks/:id/adjust — Ajustement manuel du stock
  async adjustStock(
    id: string,
    quantity: number,
    restaurantId?: string,
    motif?: string,
  ) {
    if (!Number.isFinite(Number(quantity))) {
      throw new BadRequestException('quantity doit être un nombre');
    }

    const article = await this.articleRepo.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!article) {
      throw new NotFoundException('Article introuvable');
    }

    if (restaurantId && article.restaurant?.id !== restaurantId) {
      throw new ForbiddenException("Accès refusé à l'article");
    }

    const newStock = Math.max(0, (article.stock || 0) + Number(quantity));
    const disponible = newStock > 0;
    await this.articleRepo.update(id, { stock: newStock, disponible });

    return {
      id,
      nom: article.nom,
      stock: newStock,
      disponible,
      motif: motif || 'Ajustement manuel',
    };
  }
}
