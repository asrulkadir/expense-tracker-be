import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import {
  ExpenseService,
  ExpenseSummary,
  ExpenseListResponse,
} from './expense.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryDto,
} from './dto/expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/auth.interface';
import { Types } from 'mongoose';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  create(
    @Body() createExpenseDto: CreateExpenseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const clientId = new Types.ObjectId(req.user.clientId);
    return this.expenseService.create({ ...createExpenseDto, clientId });
  }

  @Get('summary')
  getSummary(
    @Query() query: ExpenseQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ExpenseSummary> {
    const clientId = req.user.clientId;
    return this.expenseService.getSummary(query, clientId);
  }

  @Get('list')
  findAll(
    @Query() query: ExpenseQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ExpenseListResponse> {
    const clientId = req.user.clientId;
    return this.expenseService.findAll(query, clientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expenseService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expenseService.remove(id);
  }
}
