import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ClientService } from '../client/client.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private clientService: ClientService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a default client for the user
    const client = (await this.clientService.create({
      name: `${email}'s Client`,
    })) as { _id: Types.ObjectId };

    // Create user
    const user = (await this.userService.create({
      email,
      password: hashedPassword,
      clientId: client._id,
      isActive: true,
    })) as {
      _id: Types.ObjectId;
      email: string;
      password: string;
      clientId: Types.ObjectId;
    };

    // Generate JWT token
    const userId = user._id;
    const payload = { email: user.email, sub: userId.toString() };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: userId.toString(),
        email: user.email,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = (await this.userService.findByEmail(email)) as {
      _id: Types.ObjectId;
      email: string;
      password: string;
    };
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const userId = user._id;
    const payload = { email: user.email, sub: userId.toString() };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: userId.toString(),
        email: user.email,
      },
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string; clientId: string } | null> {
    const user = (await this.userService.findByEmail(email)) as {
      _id: Types.ObjectId;
      email: string;
      password: string;
      clientId: Types.ObjectId;
    } | null;
    if (user && (await bcrypt.compare(password, user.password))) {
      const userId = user._id;
      const clientId = user.clientId;
      return {
        id: userId.toString(),
        email: user.email,
        clientId: clientId.toString(),
      };
    }
    return null;
  }
}
