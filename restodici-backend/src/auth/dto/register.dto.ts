// src/auth/dto/register.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  IsIn,
  MinLength,
  IsUUID,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  nom!: string;

  @IsString()
  @MinLength(6)
  password!: string; // Frontend envoie password (cohérent avec login)

  @IsString()
  @IsOptional()
  telephone?: string;

  // Type d'utilisateur : CLIENT, RESTAURANT, BUSINESS_CLIENT
  @IsString()
  @IsIn(['CLIENT', 'RESTAURANT', 'BUSINESS_CLIENT'])
  type!: string;

  // --- Champs pour RESTAURANT ---
  @IsOptional()
  @IsString()
  restaurantNom?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  restaurantTelephone?: string;

  @IsOptional()
  @IsString()
  restaurantEmail?: string;

  @IsOptional()
  @IsString()
  horaires?: string;

  @IsOptional()
  zonesLivraison?: string[];

  // --- Champs pour BUSINESS_CLIENT ---
  @IsOptional()
  @IsString()
  nomEntreprise?: string;

  @IsOptional()
  @IsString()
  emailProfessionnel?: string;

  @IsOptional()
  @IsString()
  numeroFiscal?: string;

  @IsOptional()
  @IsString()
  responsableCompte?: string;

  // --- Champs pour CLIENT (QR Code ou Sélection Restaurant) ---
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;
}
