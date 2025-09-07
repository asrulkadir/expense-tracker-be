import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { Expense, ExpenseDocument, ExpenseCategory } from './expense.schema';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryDto,
} from './dto/expense.dto';

interface ExpenseFilter extends FilterQuery<ExpenseDocument> {
  clientId: Types.ObjectId;
  userId?: string;
  category?: ExpenseCategory;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
}

interface AggregationResult {
  _id: ExpenseCategory;
  total: number;
  count: number;
}

interface TotalResult {
  total: number;
  count: number;
}

export interface ExpenseSummary {
  total: number;
  count: number;
  breakdown: {
    category: ExpenseCategory;
    total: number;
    count: number;
  }[];
}

export interface ExpenseListResponse {
  data: Expense[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class ExpenseService {
  private readonly logger = new Logger(ExpenseService.name);

  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    const createdExpense = new this.expenseModel(createExpenseDto);
    return createdExpense.save();
  }

  async findAll(
    query: ExpenseQueryDto,
    clientId: string,
  ): Promise<ExpenseListResponse> {
    this.logger.log('📋 ExpenseService.findAll called');
    this.logger.log('📋 ClientId:', clientId);
    this.logger.log('📋 Query:', query);

    const {
      page = 1,
      limit = 10,
      category,
      startDate,
      endDate,
      period,
    } = query;
    const skip = (page - 1) * limit;

    const filter: ExpenseFilter = { clientId: new Types.ObjectId(clientId) };

    this.logger.log('📋 Initial filter:', filter);

    if (category) {
      filter.category = category;
    }

    // Handle date filtering
    if (period) {
      const now = new Date();
      let start: Date;

      switch (period) {
        case 'day':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(0);
      }

      filter.date = { $gte: start };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    this.logger.log(
      '📋 Final filter before query:',
      JSON.stringify(filter, null, 2),
    );

    const [data, total] = await Promise.all([
      this.expenseModel
        .find(filter)
        .populate(
          'userId',
          'telegramUsername telegramFirstName telegramLastName',
        )
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.expenseModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSummary(
    query: ExpenseQueryDto,
    clientId: string,
  ): Promise<ExpenseSummary> {
    const { category, startDate, endDate, period } = query;

    const filter: ExpenseFilter = { clientId: new Types.ObjectId(clientId) };

    this.logger.log('💰 ExpenseService.getSummary called');
    this.logger.log(
      '💰 ClientId received:',
      clientId,
      'type:',
      typeof clientId,
    );
    this.logger.log('💰 Initial filter:', filter);

    if (category) {
      filter.category = category;
    }

    // Handle date filtering
    if (period) {
      const now = new Date();
      let start: Date;

      switch (period) {
        case 'day':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(0);
      }

      filter.date = { $gte: start };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    this.logger.log(
      '💰 Final filter before aggregation:',
      JSON.stringify(filter, null, 2),
    );

    const [totalResult, breakdownResult] = await Promise.all([
      this.expenseModel.aggregate<TotalResult>([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.expenseModel.aggregate<AggregationResult>([
        { $match: filter },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    const total = totalResult[0]?.total || 0;

    const count = totalResult[0]?.count || 0;

    const breakdown = breakdownResult.map((item) => ({
      category: item._id,
      total: item.total,
      count: item.count,
    }));

    return { total, count, breakdown };
  }

  async findOne(id: string): Promise<Expense | null> {
    return this.expenseModel
      .findById(id)
      .populate('userId', 'telegramUsername telegramFirstName telegramLastName')
      .exec();
  }

  async update(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
    const updatedExpense = await this.expenseModel
      .findByIdAndUpdate(id, updateExpenseDto, { new: true })
      .populate('userId', 'telegramUsername telegramFirstName telegramLastName')
      .exec();

    if (!updatedExpense) {
      throw new NotFoundException('Expense not found');
    }

    return updatedExpense;
  }

  async remove(id: string): Promise<Expense> {
    const deletedExpense = await this.expenseModel.findByIdAndDelete(id).exec();

    if (!deletedExpense) {
      throw new NotFoundException('Expense not found');
    }

    return deletedExpense;
  }
}
