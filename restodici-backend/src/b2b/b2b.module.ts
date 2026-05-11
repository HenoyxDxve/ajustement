import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { B2BController } from './controllers/b2b.controller';
import { B2BService } from './services/b2b.service';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { BulkOrder } from './entities/bulk-order.entity';
import { Invoice } from './entities/invoice.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, TeamMember, BulkOrder, Invoice, User]),
    AuthModule,
  ],
  controllers: [B2BController],
  providers: [B2BService],
  exports: [B2BService],
})
export class B2BModule {}
