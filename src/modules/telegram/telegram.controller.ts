import { Controller, Post, Body, Logger } from '@nestjs/common';
import { TelegramService, TelegramUpdate } from './telegram.service';

@Controller('api/telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  async handleWebhook(@Body() update: TelegramUpdate) {
    this.logger.log('Received Telegram update:', JSON.stringify(update));

    try {
      const response = await this.telegramService.processUpdate(update);
      this.logger.log('Telegram response:', response);
      return { success: true, response };
    } catch (error) {
      this.logger.error('Error processing Telegram update:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}
