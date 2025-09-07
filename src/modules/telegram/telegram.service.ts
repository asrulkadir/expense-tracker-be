import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { ExpenseService } from '../expense/expense.service';
import { UserService } from '../user/user.service';
import { ClientService } from '../client/client.service';
import { ExpenseCategory } from '../expense/expense.schema';
import { ClientDocument } from '../client/client.schema';
import { UserDocument } from '../user/user.schema';

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
    private readonly expenseService: ExpenseService,
    private readonly userService: UserService,
    private readonly clientService: ClientService,
  ) {}

  async processUpdate(update: TelegramUpdate): Promise<string> {
    if (!update.message) {
      return 'No message found in update';
    }

    const message = update.message;
    const chatId = message.chat.id.toString();
    const text = message.text;

    this.logger.log(`Processing message from chat ${chatId}: ${text}`);

    // Find user by telegram chat ID
    const user = await this.userService.findByTelegramChatId(chatId);
    if (!user) {
      return 'User not found. Please register first.';
    }

    // Get client info
    const client = await this.clientService.findOne(user.clientId.toString());
    if (!client) {
      return 'Client not found.';
    }

    if (text.startsWith('/add')) {
      return this.handleAddExpense(text, user, client as ClientDocument);
    }

    if (text.startsWith('/help')) {
      return this.getHelpMessage();
    }

    if (text.startsWith('/summary')) {
      return this.handleSummary(user, client as ClientDocument);
    }

    return 'Unknown command. Type /help for available commands.';
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
        userId: new Types.ObjectId(user._id as string),
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
