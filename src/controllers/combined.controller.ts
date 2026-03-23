// ---- Revenue Controller ----
import { Request, Response } from 'express';
import * as revenueService from '../services/revenue.service';
import * as notificationService from '../services/notification.service';
import * as auditService from '../services/audit.service';
import * as dashboardService from '../services/dashboard.service';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';

// Revenue
export async function listRevenue(req: Request, res: Response): Promise<void> {
  const { page, limit } = getPagination(Number(req.query.page), Number(req.query.limit));
  const result = await revenueService.getAllRevenue(page, limit, {
    projectId: req.query.project_id as string,
    year: req.query.year ? Number(req.query.year) : undefined,
    month: req.query.month ? Number(req.query.month) : undefined,
  }) as any;
  if (result.error) { sendError(res, result.error, 'FETCH_ERROR'); return; }
  sendSuccess(res, result.data, 200, buildPaginationMeta(result.count || 0, page, limit));
}

export async function createRevenue(req: Request, res: Response): Promise<void> {
  const result = await revenueService.createRevenue(req.body);
  if (result.error) { sendError(res, result.error, 'CREATE_ERROR'); return; }
  await auditService.createAuditLog({
    actor_id: req.user!.sub, action: 'CREATE_REVENUE',
    entity: 'revenue', entity_id: result.revenue!.id,
  });
  sendSuccess(res, result.revenue, 201);
}

export async function updateRevenue(req: Request, res: Response): Promise<void> {
  const result = await revenueService.updateRevenue(req.params.id, req.body);
  if (result.error) { sendError(res, result.error, 'UPDATE_ERROR'); return; }
  sendSuccess(res, result.revenue);
}

export async function deleteRevenue(req: Request, res: Response): Promise<void> {
  const result = await revenueService.deleteRevenue(req.params.id);
  if (result.error) { sendError(res, result.error, 'DELETE_ERROR'); return; }
  sendSuccess(res, { deleted: true });
}

export async function getRevenueTrends(req: Request, res: Response): Promise<void> {
  const trends = await revenueService.getRevenueTrends(req.query.year ? Number(req.query.year) : undefined);
  sendSuccess(res, trends);
}

export async function getBudgetVsRevenue(req: Request, res: Response): Promise<void> {
  const data = await revenueService.getBudgetVsRevenue();
  sendSuccess(res, data);
}

// Notifications
export async function getNotifications(req: Request, res: Response): Promise<void> {
  const { page, limit } = getPagination(Number(req.query.page), Number(req.query.limit));
  const result = await notificationService.getNotifications(req.user!.sub, page, limit) as any;
  if (result.error) { sendError(res, result.error, 'FETCH_ERROR'); return; }
  sendSuccess(res, result.data, 200, buildPaginationMeta(result.count || 0, page, limit));
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  const result = await notificationService.markAsRead(req.params.id, req.user!.sub) as any;
  if (result.error) { sendError(res, result.error, 'UPDATE_ERROR'); return; }
  sendSuccess(res, { updated: true });
}

export async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
  await notificationService.markAllAsRead(req.user!.sub);
  sendSuccess(res, { updated: true });
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  const count = await notificationService.getUnreadCount(req.user!.sub);
  sendSuccess(res, { count });
}

// Audit Logs
export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const { page, limit } = getPagination(Number(req.query.page), Number(req.query.limit));
  const result = await auditService.getAuditLogs(
    page, limit,
    req.query.entity as string,
    req.query.actor_id as string
  ) as any;
  if (result.error) { sendError(res, result.error, 'FETCH_ERROR'); return; }
  sendSuccess(res, result.data, 200, buildPaginationMeta(result.count || 0, page, limit));
}

// Dashboard
export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const stats = await dashboardService.getDashboardStats();
  sendSuccess(res, stats);
}

export async function getRecentActivity(req: Request, res: Response): Promise<void> {
  const data = await dashboardService.getRecentActivity(Number(req.query.limit) || 10);
  sendSuccess(res, data);
}

export async function getPerformanceMatrix(req: Request, res: Response): Promise<void> {
  const data = await dashboardService.getPerformanceMatrix();
  sendSuccess(res, data);
}
