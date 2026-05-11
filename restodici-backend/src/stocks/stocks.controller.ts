// src/stocks/stocks.controller.ts
import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Req,
  Param,
  Body,
} from '@nestjs/common';
import { StocksService } from './stocks.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  // GET /stocks/alerts — Alertes seuils minimum (RG-23)
  @Get('alerts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('GERANT', 'ADMIN', 'STAFF')
  getAlerts(@Req() req) {
    const restaurantId = req.user?.restaurant?.id;
    return this.stocksService.getAlerts(restaurantId);
  }

  // PATCH /stocks/:id/adjust — Ajustement stock (RG-03)
  @Patch(':id/adjust')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('GERANT', 'ADMIN', 'STAFF')
  adjustStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Body('motif') motif: string,
    @Req() req,
  ) {
    const restaurantId = req.user?.restaurant?.id;
    return this.stocksService.adjustStock(id, quantity, restaurantId, motif);
  }
}
