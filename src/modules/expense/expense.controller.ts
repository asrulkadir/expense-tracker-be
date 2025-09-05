import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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

@Controller('api/expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expenseService.create(createExpenseDto);
  }

  @Get('summary')
  getSummary(
    @Query() query: ExpenseQueryDto,
    @Query('clientId') clientId: string,
  ): Promise<ExpenseSummary> {
    return this.expenseService.getSummary(query, clientId);
  }

  @Get('list')
  findAll(
    @Query() query: ExpenseQueryDto,
    @Query('clientId') clientId: string,
  ): Promise<ExpenseListResponse> {
    return this.expenseService.findAll(query, clientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expenseService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expenseService.remove(id);
  }
}
