// src/commandes/commandes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandesController } from './commandes.controller';
import { CommandesService } from './commandes.service';
import { CommandesGateway } from './commandes.gateway';
import { Commande } from './entities/commande.entity';
import { LigneCommande } from './entities/ligne-commande.entity';
import { Article } from '../menu/entities/article.entity';
import { User } from '../auth/entities/user.entity'; // ✅ Import de l'entité User
import { AuthModule } from '../auth/auth.module'; // ✅ Import du module Auth pour UserRepository
import { MenuModule } from '../menu/menu.module'; // ✅ Optionnel : pour valider les articles

@Module({
  imports: [
    // Enregistrement des repositories TypeORM pour ce module
    TypeOrmModule.forFeature([Commande, LigneCommande, Article, User]),

    //  Import des modules externes pour résolution des dépendances
    AuthModule, // Fournit UserRepository
    MenuModule, // Optionnel : pour valider la disponibilité des articles
  ],
  controllers: [CommandesController],
  providers: [CommandesService, CommandesGateway],
  exports: [CommandesService], // Export si d'autres modules ont besoin de ce service
})
export class CommandesModule {}
