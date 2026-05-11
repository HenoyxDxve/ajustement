// src/commandes/commandes.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CommandesService } from './commandes.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { StatutCommande } from './entities/commande.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('commandes')
export class CommandesController {
  constructor(private readonly commandesService: CommandesService) {}

  // ✅ EN-1919 : Créer une commande (CLIENT/B2B)
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Body() dto: CreateCommandeDto,
    @Req() req: any,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const clientId = req.user.id;

    // Détermination du restaurantId :
    // 1. Via query param (client qui choisit un resto)
    // 2. Via user.restaurant (gérant qui teste)
    // 3. Via premier article (fallback - à éviter)
    const targetRestaurantId =
      restaurantId || req.user.restaurant?.id || dto.restaurantId; // Si tu ajoutes ce champ au DTO racine

    if (!targetRestaurantId) {
      throw new BadRequestException(
        'restaurantId requis pour créer une commande',
      );
    }

    return this.commandesService.createCommande(
      dto,
      clientId,
      targetRestaurantId,
    );
  }

  // ✅ US-07 : Historique commandes du client connecté
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async findMyOrders(@Req() req: any) {
    return this.commandesService.findAllByUser(req.user.id);
  }

  // ✅ US-08 : Liste commandes pour un restaurant (GERANT/STAFF)
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('GERANT', 'STAFF', 'ADMIN')
  async findAll(
    @Query('restaurantId') restaurantId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Req() req: any,
  ) {
    // RG-31: Un gérant ne voit que SON restaurant
    const targetRestaurantId =
      req.user.role === 'GERANT' ? req.user.restaurant?.id : restaurantId;

    if (!targetRestaurantId) {
      throw new BadRequestException('restaurantId requis pour ce rôle');
    }

    return this.commandesService.findAllForRestaurant(
      targetRestaurantId,
      limit,
      offset,
    );
  }

  // ✅ US-08 : Interface KDS (Kitchen Display System)
  @Get('kds')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('GERANT', 'STAFF')
  async getKDS(@Req() req: any) {
    const restaurantId = req.user.restaurant?.id;
    if (!restaurantId) {
      throw new BadRequestException('Compte gérant sans restaurant associé');
    }
    return this.commandesService.getKDS(restaurantId);
  }

  // ✅ US-07 : Détail d'une commande
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string, @Req() req: any) {
    // clientId optionnel pour vérification d'accès
    const clientId = req.user.role === 'CLIENT' ? req.user.id : undefined;
    return this.commandesService.findOne(id, clientId);
  }

  // ✅ RG-10 : Mise à jour statut (GERANT/STAFF uniquement)
  @Patch(':id/statut')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('GERANT', 'STAFF')
  async updateStatut(
    @Param('id') id: string,
    @Body('statut') statut: StatutCommande,
    @Req() req: any,
  ) {
    // RG-31: Un gérant ne modifie que SES commandes
    const restaurantId =
      req.user.role === 'GERANT' ? req.user.restaurant?.id : undefined;
    return this.commandesService.updateStatut(id, statut, restaurantId);
  }
}
