import { NestFactory } from '@nestjs/core';
import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { ClientService } from '../src/modules/client/client.service';
import { UserService } from '../src/modules/user/user.service';
import { ExpenseService } from '../src/modules/expense/expense.service';
import { ExpenseCategory } from '../src/modules/expense/expense.schema';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const clientService = app.get(ClientService);
  const userService = app.get(UserService);
  const expenseService = app.get(ExpenseService);

  try {
    // Create demo client
    const client = await clientService.create({
      name: 'Demo Client',
      botTelegram: '@demo_expense_bot',
      isActive: true,
    });

    console.log('✅ Demo client created:', client._id);

    // Hash the demo password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    // Create demo user
    const user = await userService.create({
      clientId: new Types.ObjectId(client._id as string),
      telegramChatId: '123456789',
      telegramUsername: 'demo_user',
      telegramFirstName: 'Demo',
      telegramLastName: 'User',
      isActive: true,
      email: 'admin@email.com',
      password: hashedPassword,
    });

    console.log('✅ Demo user created:', user._id);

    // Create sample expenses
    const expenses = [
      {
        clientId: new Types.ObjectId(client._id as string),
        userId: new Types.ObjectId(user._id as string),
        amount: 15000,
        category: ExpenseCategory.FOOD,
        note: 'Nasi goreng ayam',
        date: new Date(),
      },
      {
        clientId: new Types.ObjectId(client._id as string),
        userId: new Types.ObjectId(user._id as string),
        amount: 25000,
        category: ExpenseCategory.TRANSPORT,
        note: 'Grab ke kantor',
        date: new Date(),
      },
      {
        clientId: new Types.ObjectId(client._id as string),
        userId: new Types.ObjectId(user._id as string),
        amount: 50000,
        category: ExpenseCategory.ENTERTAINMENT,
        note: 'Bioskop dengan teman',
        date: new Date(),
      },
      {
        clientId: new Types.ObjectId(client._id as string),
        userId: new Types.ObjectId(user._id as string),
        amount: 75000,
        category: ExpenseCategory.SHOPPING,
        note: 'Beli baju',
        date: new Date(),
      },
      {
        clientId: new Types.ObjectId(client._id as string),
        userId: new Types.ObjectId(user._id as string),
        amount: 30000,
        category: ExpenseCategory.HEALTH,
        note: 'Obat batuk',
        date: new Date(),
      },
      {
        clientId: new Types.ObjectId(client._id as string),
        userId: new Types.ObjectId(user._id as string),
        amount: 100000,
        category: ExpenseCategory.UTILITIES,
        note: 'Bayar listrik',
        date: new Date(),
      },
    ];

    for (const expenseData of expenses) {
      const expense = await expenseService.create(expenseData);
      console.log(`✅ Expense created: ${expense.note} - ${expense.amount}`);
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

void seed();
