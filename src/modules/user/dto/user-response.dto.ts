export class UserResponseDto {
  id: string;
  email: string;
  clientId: string;
  telegramChatId?: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
