// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, Role } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Restaurant } from '../restaurants/entities/restaurant.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    private jwtService: JwtService,
  ) {}

  private buildAuthResponse(
    user: User,
    message?: string,
  ): {
    access_token: string;
    token: string;
    user: Record<string, any>;
    message?: string;
  } {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        telephone: user.telephone,
        restaurant: user.restaurant
          ? { id: user.restaurant.id, nom: user.restaurant.nom }
          : undefined,
      },
      ...(message ? { message } : {}),
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email déjà utilisé');
    }

    // Utiliser password (envoyé par le frontend)
    const passwordToHash = dto.password;
    if (!passwordToHash || passwordToHash.length < 6) {
      throw new BadRequestException(
        'Le mot de passe doit contenir au moins 6 caractères',
      );
    }

    const passwordHash = await bcrypt.hash(passwordToHash, 12);

    // Déterminer le rôle basé sur le type
    let role = Role.CLIENT;
    let restaurant: Restaurant | null = null;

    if (dto.type === 'RESTAURANT') {
      role = Role.GERANT;

      // Vérifier que les données du restaurant sont présentes
      if (!dto.restaurantNom || !dto.adresse) {
        throw new BadRequestException(
          "Pour créer un restaurant, fournissez le nom et l'adresse",
        );
      }

      // Créer le restaurant
      const newRestaurant = this.restaurantRepository.create({
        nom: dto.restaurantNom,
        description: dto.description || '',
        adresse: dto.adresse,
        telephone: dto.restaurantTelephone || dto.telephone || '',
      });
      const savedRestaurant =
        await this.restaurantRepository.save(newRestaurant);
      restaurant = savedRestaurant;
    } else if (dto.type === 'BUSINESS_CLIENT') {
      role = Role.B2B;
    } else {
      role = Role.CLIENT;
    }

    // Créer l'utilisateur
    const user = this.userRepository.create({
      email,
      password: passwordHash,
      nom: dto.nom,
      role: role,
      telephone: dto.telephone,
      restaurant: restaurant ? { id: restaurant.id } : undefined,
    });

    const savedUser = await this.userRepository.save(user);
    savedUser.restaurant = restaurant ?? undefined;

    // Retourner le token et les infos utilisateur pour la redirection
    return this.buildAuthResponse(savedUser, 'Compte créé avec succès');
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['restaurant'], // Charger le restaurant
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    if (!user.actif) {
      throw new BadRequestException('Compte désactivé');
    }

    return this.buildAuthResponse(user);
  }
}
