import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  botTelegram?: string;

  @IsOptional()
  @IsString()
  botToken?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  botTelegram?: string;

  @IsOptional()
  @IsString()
  botToken?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
