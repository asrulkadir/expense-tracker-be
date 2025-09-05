import { Document, Types } from 'mongoose';

export interface MongooseDocument extends Document {
  _id: Types.ObjectId;
  id: string;
}

export interface UserDocument extends MongooseDocument {
  email: string;
  password: string;
  clientId: Types.ObjectId;
  isActive: boolean;
  toObject(): any;
}

export interface ClientDocument extends MongooseDocument {
  name: string;
  clientId?: string;
  email?: string;
  botTelegram?: string;
  botToken?: string;
  isActive: boolean;
}
