import { Request } from 'express';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  clientId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
