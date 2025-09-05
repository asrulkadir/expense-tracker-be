import {
  IsString,
  IsOptional,
  IsBoolean,
  IsMongoId,
  IsEmail,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateUserDto {
  @IsMongoId()
  clientId: Types.ObjectId;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  telegramChatId?: string;

  @IsOptional()
  @IsString()
  telegramUsername?: string;

  @IsOptional()
  @IsString()
  telegramFirstName?: string;

  @IsOptional()
  @IsString()
  telegramLastName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  telegramUsername?: string;

  @IsOptional()
  @IsString()
  telegramFirstName?: string;

  @IsOptional()
  @IsString()
  telegramLastName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
