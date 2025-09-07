import {
  Controller,
  Post,
  Body,
  Logger,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TelegramService, TelegramUpdate } from './telegram.service';
import { AuthenticatedRequest } from '../auth/interfaces/auth.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('telegram')
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

  @Post('set-webhook')
  @UseGuards(JwtAuthGuard)
  async setWebhook(@Request() req: AuthenticatedRequest): Promise<any> {
    const clientId = req.user.clientId;
    return this.telegramService.setWebhook(clientId);
  }
}
