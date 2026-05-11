// src/restaurants/entities/restaurant.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Article } from '../../menu/entities/article.entity';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nom!: string;

  @Column({ nullable: true })
  logo!: string;

  @Column()
  telephone!: string;

  @Column()
  adresse!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ default: true })
  actif!: boolean;

  // Relations
  @OneToMany(() => User, (user) => user.restaurant)
  users!: User[];

  @ManyToMany(() => User, (user) => user.favorites)
  favoritedBy?: User[];

  @OneToMany(() => Article, (article) => article.restaurant)
  articles!: Article[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
