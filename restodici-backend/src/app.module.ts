// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { CommandesModule } from './commandes/commandes.module';
import { StocksModule } from './stocks/stocks.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { TresorerieModule } from './tresorerie/tresorerie.module';
import { B2BModule } from './b2b/b2b.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      username: process.env.DB_USER || 'restodici_user',
      password: process.env.DB_PASSWORD || 'restodici_pass',
      database: process.env.DB_NAME || 'restodici_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize:
        process.env.DB_SYNC !== undefined
          ? process.env.DB_SYNC === 'true'
          : process.env.NODE_ENV !== 'production',
      logging: process.env.DB_LOGGING === 'true' || false,
      ssl: process.env.DB_SSL === 'true' || false,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 1000, // 1 minute
    }),
    AuthModule,
    B2BModule,
    RestaurantsModule,
    MenuModule,
    CommandesModule,
    StocksModule,
    TresorerieModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
