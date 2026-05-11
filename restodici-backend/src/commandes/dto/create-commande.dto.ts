// src/commandes/dto/create-commande.dto.ts
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  IsUUID, //  AJOUTER CET IMPORT
} from 'class-validator';
import { ModeLivraison } from '../entities/commande.entity';

export class CreateLigneDto {
  @IsNotEmpty()
  @IsString()
  articleId!: string;

  @IsNumber()
  @Min(1) // RG-13
  quantite!: number;

  @IsOptional()
  @IsString()
  instructions?: string; // EN-1917
}

export class CreateCommandeDto {
  @IsArray()
  @IsNotEmpty()
  lignes!: CreateLigneDto[]; // RG-07

  @IsEnum(ModeLivraison)
  modeLivraison!: ModeLivraison; // RG-08

  @ValidateIf((o) => o.modeLivraison === 'LIVRAISON')
  @IsNotEmpty()
  @IsString()
  adresseLivraison?: string; // RG-09

  //  AJOUT : restaurantId optionnel (pour client qui choisit un resto)
  @IsOptional()
  @IsUUID()
  restaurantId?: string;
}
