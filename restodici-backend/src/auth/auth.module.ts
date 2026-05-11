import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { Restaurant } from '../restaurants/entities/restaurant.entity'; // Import
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { CompteB2B } from '../b2b/entities/compte-b2b.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Restaurant, CompteB2B]), // Ajout de Restaurant + CompteB2B
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      signOptions: { expiresIn: '24h' },
    }),
    RestaurantsModule,
  ],
  providers: [AuthService, JwtStrategy, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
