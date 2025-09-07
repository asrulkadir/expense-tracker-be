import {
  PaginatedResponse,
  ApiResponse,
} from '../interfaces/api-response.interface';

// Universal response function for all CRUD operations
export function apiResponse<T>(
  data: T | T[] | null,
  message: string,
  options?: {
    // For pagination
    total?: number;
    page?: number;
    limit?: number;
  },
): ApiResponse<T> | PaginatedResponse<T> {
  const baseResponse = {
    success: true,
    message,
    data,
    meta: {
      total: undefined as number | undefined,
    },
  };

  // If it's an array, add total count
  if (Array.isArray(data)) {
    baseResponse.meta.total = data.length;
  }

  // If pagination options provided, return paginated response
  if (options?.page && options?.limit && options?.total !== undefined) {
    return {
      ...baseResponse,
      meta: {
        ...baseResponse.meta,
        total: options.total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(options.total / options.limit),
      },
    } as PaginatedResponse<T>;
  }

  return baseResponse as ApiResponse<T>;
}
