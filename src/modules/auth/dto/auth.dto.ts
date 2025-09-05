import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  clientName: string;
}

export class AuthResponseDto {
  token: string;
  user: {
    id: string;
    email: string;
    clientId: string;
    clientName: string;
  };
}

export class AuthUserResponseDto {
  user: {
    id: string;
    email: string;
    clientId: string;
    clientName: string;
  };
}
