import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find({ isActive: true }).populate('clientId').exec();
  }

  async findOne(id: string): Promise<User | null> {
    return this.userModel.findById(id).populate('clientId').exec();
  }

  async findByTelegramChatId(telegramChatId: string): Promise<User | null> {
    return this.userModel
      .findOne({ telegramChatId, isActive: true })
      .populate('clientId')
      .exec();
  }

  async findByClientId(clientId: string): Promise<User[]> {
    return this.userModel
      .find({ clientId, isActive: true })
      .populate('clientId')
      .exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .populate('clientId')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    const deletedUser = await this.userModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .populate('clientId')
      .exec();

    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }

    return deletedUser;
  }
}
