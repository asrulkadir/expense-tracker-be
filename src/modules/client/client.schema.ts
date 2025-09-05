import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true })
export class Client {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: false })
  botTelegram?: string;

  @Prop({ required: false })
  botToken?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
