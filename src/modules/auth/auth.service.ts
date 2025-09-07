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
    const { email, password, clientName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create client with provided name
    const client = (await this.clientService.create({
      name: clientName,
      isActive: true,
    })) as { _id: Types.ObjectId; name: string };

    // Create user
    const user = await this.userService.create({
      email,
      password: hashedPassword,
      clientId: client._id,
      isActive: true,
    });

    // Generate JWT token
    const userId = user._id;
    const payload = {
      email: user.email,
      sub: userId.toString(),
      clientId: client._id.toString(),
    };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: userId.toString(),
        email: user.email,
        clientId: client._id.toString(),
        clientName: client.name,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email with client info
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Extract client info (populated by UserService)
    const clientInfo = user.clientId as unknown as {
      _id: Types.ObjectId;
      name: string;
    };

    // Generate JWT token
    const userId = user._id as unknown as Types.ObjectId;
    const payload = {
      email: user.email,
      sub: userId.toString(),
      clientId: clientInfo._id.toString(),
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id: userId.toString(),
        email: user.email,
        clientId: clientInfo._id.toString(),
        clientName: clientInfo.name,
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
