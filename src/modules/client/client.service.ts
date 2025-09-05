import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ClientDocument } from './client.schema';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const createdClient = new this.clientModel(createClientDto);
    return createdClient.save();
  }

  async findAll(): Promise<Client[]> {
    return this.clientModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<Client | null> {
    return this.clientModel.findById(id).exec();
  }

  async findByClientId(clientId: string): Promise<Client | null> {
    return this.clientModel.findOne({ clientId, isActive: true }).exec();
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const updatedClient = await this.clientModel
      .findByIdAndUpdate(id, updateClientDto, { new: true })
      .exec();

    if (!updatedClient) {
      throw new NotFoundException('Client not found');
    }

    return updatedClient;
  }

  async remove(id: string): Promise<Client> {
    const deletedClient = await this.clientModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!deletedClient) {
      throw new NotFoundException('Client not found');
    }

    return deletedClient;
  }
}
