import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ required: true })
  telegramChatId: string;

  @Prop({ required: false })
  telegramUsername?: string;

  @Prop({ required: false })
  telegramFirstName?: string;

  @Prop({ required: false })
  telegramLastName?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
