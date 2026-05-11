import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TresorerieController } from './tresorerie.controller';
import { TresorerieService } from './tresorerie.service';

@Module({
  imports: [
    // Add entity imports here when created
  ],
  controllers: [TresorerieController],
  providers: [TresorerieService],
})
export class TresorerieModule {}
