// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, Role } from './entities/user.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
    private jwtService: JwtService,
    // ConfigService n'est pas essentiel pour la logique métier (liens/console logs)
    // le rendre optionnel évite les problèmes de résolution lors des tests.
    private configService?: ConfigService,
  ) {}

  private buildAuthResponse(
    user: User,
    message?: string,
  ): {
    accessToken: string;
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
      accessToken: accessToken,
      access_token: accessToken,
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom,
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

    // Déterminer le rôle basé sur le type ou le role directement
    let role = Role.CLIENT;
    let restaurant: Restaurant | null = null;

    // Si le champ role est fourni (pour tests et compatibilité), l'utiliser directement
    if (dto.role) {
      role = dto.role;
    } else if (dto.type === 'RESTAURANT') {
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
    } else if (!dto.role) {
      // Seulement si role n'a pas été défini manuellement
      role = Role.CLIENT;
    }

    // Créer l'utilisateur
    const user = this.userRepository.create({
      email,
      password: passwordHash,
      nom: dto.nom,
      prenom: dto.prenom || dto.nom, // Utiliser nom comme prenom si non fourni
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

    // Bloquer l'accès si l'email n'est pas vérifié
    if (!user.emailVerified) {
      throw new BadRequestException(
        'Email non vérifié. Veuillez vérifier votre email ou renvoyer le lien de vérification.',
      );
    }

    return this.buildAuthResponse(user);
  }

  // Google OAuth validation and user creation/update
  async validateGoogleLogin(googleProfile: any) {
    const { googleId, email, nom, prenom, photo } = googleProfile;

    // Check if user exists by googleId or email
    let user = await this.userRepository.findOne({
      where: [{ googleId }, { email }],
      relations: ['restaurant'],
    });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await this.userRepository.save(user);
      }
    } else {
      // Create new user
      user = this.userRepository.create({
        email: email.toLowerCase(),
        googleId,
        nom: nom || '',
        prenom: prenom || '',
        password: '', // Empty password for OAuth users
        role: Role.CLIENT,
        emailVerified: true, // Google verified the email
      });
      user = await this.userRepository.save(user);
    }

    return this.buildAuthResponse(user, 'Connecté avec Google');
  }

  // Password reset request
  async requestPasswordReset(email: string) {
    const userEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: userEmail },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return { message: "Si l'email existe, un lien de réinitialisation a été envoyé" };
    }

    // Sécurité: refuser la récupération si email non vérifié
    if (!user.emailVerified) {
      return {
        message:
          'Veuillez d\u2019abord vérifier votre email avant de réinitialiser votre mot de passe.',
      };
    }


    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token
    const resetRequest = this.passwordResetRepository.create({
      token,
      expiresAt,
      user,
      userId: user.id,
    });

    await this.passwordResetRepository.save(resetRequest);

    // In production, send email with reset link
    // For now, log the token (you would send this via email)
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(`Reset link: ${(this.configService?.get('FRONTEND_URL') || this.configService?.get('FRONTEND_URL') || 'http://localhost:5173')}/reset-password?token=${token}`);

    return { message: "Si l'email existe, un lien de réinitialisation a été envoyé" };
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 6 caractères');
    }

    // Find valid reset token
    const resetRequest = await this.passwordResetRepository.findOne({
      where: { token, used: false },
      relations: ['user'],
    });

    if (!resetRequest || resetRequest.expiresAt < new Date()) {
      throw new BadRequestException('Token de réinitialisation invalide ou expiré');
    }

    // Sécurité: refuser le reset si email non vérifié
    if (!resetRequest.user.emailVerified) {
      throw new BadRequestException(
        'Veuillez d\u2019abord vérifier votre email avant de réinitialiser votre mot de passe.',
      );
    }

    // Sécurité: empêcher la réinitialisation si l'email n'est pas vérifié
    if (!resetRequest.user.emailVerified) {
      throw new BadRequestException(
        'Email non vérifié. Veuillez vérifier votre email avant de réinitialiser le mot de passe.',
      );
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    resetRequest.user.password = passwordHash;
    await this.userRepository.save(resetRequest.user);

    // Mark token as used
    resetRequest.used = true;
    await this.passwordResetRepository.save(resetRequest);

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  // Verify email with token
  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token de vérification invalide');
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Token de vérification expiré');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await this.userRepository.save(user);

    return { message: 'Email vérifié avec succès', emailVerified: true };
  }

  // Resend verification email
  async resendVerificationEmail(email: string) {
    const userEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: userEmail },
    });

    if (!user || user.emailVerified) {
      return { message: 'Email déjà vérifié ou utilisateur inexistant' };
    }

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 86400000); // 24 hours

    user.emailVerificationToken = token;
    user.emailVerificationExpires = expiresAt;
    await this.userRepository.save(user);

    // In production, send verification email
    console.log(`Email verification token for ${email}: ${token}`);
    console.log(`Verification link: ${(this.configService?.get('FRONTEND_URL') || 'http://localhost:5173')}/verify-email?token=${token}`);

    return { message: 'Email de vérification envoyé' };
  }
}
