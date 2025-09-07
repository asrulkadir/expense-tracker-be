import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(clientId: string): Promise<any[]> {
    this.logger.log(`Finding all users for client: ${clientId}`);
    const users = await this.userModel
      .find({ clientId: new Types.ObjectId(clientId), isActive: true })
      .populate('clientId')
      .exec();

    this.logger.log(`Found ${users.length} users for client: ${clientId}`);

    return users.map((user) => this.toUserResponse(user));
  }

  async findOne(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).populate('clientId').exec();
  }

  async findByTelegramUsername(
    telegramUsername: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ telegramUsername, isActive: true })
      .populate('clientId')
      .exec();
  }

  async findByClientId(clientId: string): Promise<UserDocument[]> {
    return this.userModel
      .find({ clientId, isActive: true })
      .populate('clientId')
      .exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email, isActive: true })
      .populate('clientId')
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).populate('clientId').exec();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .populate('clientId')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async remove(id: string): Promise<UserDocument> {
    const deletedUser = await this.userModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .populate('clientId')
      .exec();

    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }

    return deletedUser;
  }

  private toUserResponse(user: UserDocument): UserResponseDto {
    return {
      id: user._id?.toString(),
      email: user.email,
      clientId: user.clientId?._id?.toString(),
      telegramChatId: user.telegramChatId?.toString(),
      telegramUsername: user.telegramUsername,
      telegramFirstName: user.telegramFirstName,
      telegramLastName: user.telegramLastName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
