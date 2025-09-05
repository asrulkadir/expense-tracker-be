import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExpenseDocument = Expense & Document;

export enum ExpenseCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  HEALTH = 'health',
  EDUCATION = 'education',
  UTILITIES = 'utilities',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Expense {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, enum: ExpenseCategory, default: ExpenseCategory.OTHER })
  category: ExpenseCategory;

  @Prop({ required: false })
  note?: string;

  @Prop({ required: true, default: Date.now })
  date: Date;

  @Prop({ required: false })
  telegramMessageId?: number;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
