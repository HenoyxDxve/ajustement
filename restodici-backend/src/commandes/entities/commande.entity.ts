import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { LigneCommande } from './ligne-commande.entity';

export enum StatutCommande {
  RECUE = 'RECUE',
  CONFIRMEE = 'CONFIRMEE',
  EN_PREP = 'EN_PREP',
  PRETE = 'PRETE',
  LIVREE = 'LIVREE',
  ANNULEE = 'ANNULEE',
}

export enum ModeLivraison {
  SUR_PLACE = 'SUR_PLACE',
  EMPORTER = 'EMPORTER',
  LIVRAISON = 'LIVRAISON',
}

@Entity('commandes')
export class Commande {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  numero!: string; // Ex: CMD-2026-0042

  @Column({ type: 'enum', enum: StatutCommande, default: StatutCommande.RECUE })
  statut!: StatutCommande;

  @Column({ type: 'enum', enum: ModeLivraison })
  modeLivraison!: ModeLivraison;

  @Column({ nullable: true })
  adresseLivraison!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  montantTotal!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client!: User;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant!: Restaurant;

  @OneToMany(() => LigneCommande, (ligne) => ligne.commande, { cascade: true })
  lignes!: LigneCommande[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
