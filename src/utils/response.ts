import { Response } from 'express';
import { ApiResponse } from '../models/types';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, pagination?: ApiResponse<T>['pagination']): void {
  const response: ApiResponse<T> = { success: true, data };
  if (pagination) response.pagination = pagination;
  res.status(statusCode).json(response);
}

export function sendError(res: Response, message: string, code: string, statusCode = 400): void {
  const response: ApiResponse = { success: false, error: { message, code } };
  res.status(statusCode).json(response);
}

export function getPagination(page = 1, limit = 10) {
  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;
  return { page: safePage, limit: safeLimit, from, to };
}

export function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
