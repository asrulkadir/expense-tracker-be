import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { ExpenseModule } from '../expense/expense.module';
import { UserModule } from '../user/user.module';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [ExpenseModule, UserModule, ClientModule],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
