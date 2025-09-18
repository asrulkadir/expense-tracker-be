import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { ExpenseService } from '../expense/expense.service';
import { UserService } from '../user/user.service';
import { ClientService } from '../client/client.service';
import { ExpenseCategory } from '../expense/expense.schema';
import { ClientDocument } from '../client/client.schema';
import { UserDocument } from '../user/user.schema';
import axios, { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text: string;
  date: number;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private configService: ConfigService,
    private readonly expenseService: ExpenseService,
    private readonly userService: UserService,
    private readonly clientService: ClientService,
  ) {}

  async setWebhook(clientId: string): Promise<any> {
    const client = await this.clientService.findOne(clientId);
    if (!client || !client.botToken) {
      throw new Error('Client or Telegram bot token not found');
    }

    const botToken = client.botToken;
    this.logger.log(
      `Setting Telegram webhook to: ${this.configService.get<string>('TELEGRAM_WEBHOOK_URL')}`,
    );
    try {
      const response: AxiosResponse = await axios.post(
        `https://api.telegram.org/bot${botToken}/setWebhook`,
        {
          url: this.configService.get<string>('TELEGRAM_WEBHOOK_URL'),
        },
      );
      this.logger.log(`Telegram response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error setting webhook: ${error.message}`);
        throw error;
      } else {
        this.logger.error('Unknown error setting webhook');
        throw new Error('Unknown error setting webhook');
      }
    }
  }

  async processUpdate(update: TelegramUpdate): Promise<string> {
    this.logger.log('Received Telegram update:', JSON.stringify(update));
    if (!update.message) {
      return 'No message found in update';
    }

    const message = update.message;
    const username = message.from.username;
    if (!username) {
      const errorMsg =
        'Username not found. Please set a Telegram username in your profile settings.';
      return errorMsg;
    }
    const text = message.text;

    this.logger.log(`Processing message from user ${username}: ${text}`);

    // Find user by telegram username
    const user = await this.userService.findByTelegramUsername(username);
    if (!user) {
      const errorMsg = 'User not found. Please register first.';
      return errorMsg;
    }

    this.logger.log(`Found user: ${user.email} (ID: ${user._id})`);

    // Get client info
    const client = await this.clientService.findOne(
      user.clientId?._id.toString(),
    );
    if (!client) {
      const errorMsg = 'Client not found.';
      return errorMsg;
    }

    if (!client.botToken) {
      const errorMsg = 'Telegram bot token not found for this client.';
      return errorMsg;
    }

    let responseMessage: string;

    if (text.startsWith('/add')) {
      responseMessage = await this.handleAddExpense(
        text,
        user,
        client as ClientDocument,
      );
    } else if (text.startsWith('/help')) {
      responseMessage = this.getHelpMessage();
    } else if (text.startsWith('/summary')) {
      responseMessage = await this.handleSummary(
        user,
        client as ClientDocument,
      );
    } else {
      responseMessage = 'Unknown command. Type /help for available commands.';
    }

    // Send the response message back to Telegram
    try {
      await this.sendMessage(message.chat.id, responseMessage, client.botToken);
      return `Message sent successfully: ${responseMessage}`;
    } catch (error) {
      this.logger.error('Error sending message to Telegram:', error);
      return `Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async sendMessage(
    chatId: number,
    text: string,
    botToken: string,
  ): Promise<any> {
    try {
      const response: AxiosResponse = await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        },
      );
      this.logger.log(`Sent message to chat ${chatId}: ${text}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error sending message to chat ${chatId}: ${error.message}`,
        );
        throw error;
      } else {
        this.logger.error(`Unknown error sending message to chat ${chatId}`);
        throw new Error('Unknown error sending message');
      }
    }
  }

  private async handleAddExpense(
    text: string,
    user: UserDocument,
    client: ClientDocument,
  ): Promise<string> {
    try {
      // Parse command: /add amount category note
      // Example: /add 15000 food nasi goreng
      const parts = text.split(' ');
      if (parts.length < 3) {
        return 'Invalid format. Use: /add <amount> <category> <note>';
      }

      const amount = parseFloat(parts[1]);
      if (isNaN(amount)) {
        return 'Invalid amount. Please provide a valid number.';
      }

      const category = this.mapCategory(parts[2]);
      const note = parts.slice(3).join(' ') || '';

      await this.expenseService.create({
        clientId: new Types.ObjectId(client._id as string),
        userId: new Types.ObjectId(user._id),
        amount,
        category,
        note,
        date: new Date(),
      });

      return `✅ Expense added successfully!
💰 Amount: ${amount.toLocaleString('id-ID')}
📂 Category: ${category}
📝 Note: ${note}
📅 Date: ${new Date().toLocaleDateString('id-ID')}`;
    } catch (error) {
      this.logger.error('Error adding expense:', error);
      return 'Error adding expense. Please try again.';
    }
  }

  private mapCategory(categoryInput: string): ExpenseCategory {
    const categoryMap: Record<string, ExpenseCategory> = {
      food: ExpenseCategory.FOOD,
      makan: ExpenseCategory.FOOD,
      transport: ExpenseCategory.TRANSPORT,
      transportasi: ExpenseCategory.TRANSPORT,
      entertainment: ExpenseCategory.ENTERTAINMENT,
      hiburan: ExpenseCategory.ENTERTAINMENT,
      shopping: ExpenseCategory.SHOPPING,
      belanja: ExpenseCategory.SHOPPING,
      health: ExpenseCategory.HEALTH,
      kesehatan: ExpenseCategory.HEALTH,
      education: ExpenseCategory.EDUCATION,
      pendidikan: ExpenseCategory.EDUCATION,
      utilities: ExpenseCategory.UTILITIES,
      tagihan: ExpenseCategory.UTILITIES,
      other: ExpenseCategory.OTHER,
      lainnya: ExpenseCategory.OTHER,
    };

    return categoryMap[categoryInput.toLowerCase()] || ExpenseCategory.OTHER;
  }

  private async handleSummary(
    user: UserDocument,
    client: ClientDocument,
  ): Promise<string> {
    try {
      const summary = await this.expenseService.getSummary(
        { period: 'month' },
        client._id as string,
      );

      let response = `📊 **Monthly Summary**\n`;
      response += `💰 Total: Rp ${summary.total.toLocaleString('id-ID')}\n`;
      response += `🧾 Transactions: ${summary.count}\n\n`;
      response += `📂 **Breakdown by Category:**\n`;

      summary.breakdown.forEach((item) => {
        response += `• ${item.category}: Rp ${item.total.toLocaleString('id-ID')} (${item.count} transactions)\n`;
      });

      return response;
    } catch (error) {
      this.logger.error('Error getting summary:', error);
      return 'Error getting summary. Please try again.';
    }
  }

  private getHelpMessage(): string {
    return `🤖 **Expense Tracker Bot Commands:**

📝 **Add Expense:**
/add <amount> <category> <note>
Example: /add 15000 food nasi goreng

📊 **Get Summary:**
/summary - Monthly summary

📂 **Categories:**
• food, makan
• transport, transportasi  
• entertainment, hiburan
• shopping, belanja
• health, kesehatan
• education, pendidikan
• utilities, tagihan
• other, lainnya

❓ **Help:**
/help - Show this message`;
  }
}
