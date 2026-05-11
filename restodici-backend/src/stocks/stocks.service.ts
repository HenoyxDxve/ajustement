// src/stocks/stocks.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../menu/entities/article.entity';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Article) private articleRepo: Repository<Article>,
  ) {}

  // GET /stocks/alerts — Articles en rupture ou sous seuil
  async getAlerts(restaurantId?: string) {
    const query = this.articleRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.categorie', 'categorie')
      .where('article.disponible = true')
      .andWhere('(article.stock IS NULL OR article.stock <= 5)'); // Seuil configurable

    if (restaurantId) {
      query.andWhere('article.restaurantId = :restaurantId', { restaurantId });
    }

    const alerts = await query.orderBy('article.stock', 'ASC').getMany();

    return alerts.map((article) => ({
      id: article.id,
      nom: article.nom,
      stock: article.stock || 0,
      seuil: 5, // Configurable
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
    const article = await this.articleRepo.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!article) {
      throw new Error('Article not found');
    }

    if (restaurantId && article.restaurant?.id !== restaurantId) {
      throw new Error('Access denied');
    }

    const newStock = Math.max(0, (article.stock || 0) + quantity);
    await this.articleRepo.update(id, { stock: newStock });

    return {
      id,
      nom: article.nom,
      stock: newStock,
      disponible: newStock > 0,
      motif: motif || 'Ajustement manuel',
    };
  }
}
