import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { ExpenseCategory } from '../expense.schema';

export class CreateExpenseDto {
  @IsMongoId()
  clientId: Types.ObjectId;

  @IsMongoId()
  userId: Types.ObjectId;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value as string))
  amount: number;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  date?: Date;

  @IsOptional()
  @IsNumber()
  telegramMessageId?: number;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value as string))
  amount?: number;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  date?: Date;
}

export class ExpenseQueryDto {
  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month' | 'year';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value as string, 10))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value as string, 10))
  limit?: number = 10;
}
