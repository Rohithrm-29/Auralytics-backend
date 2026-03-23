import { Request, Response } from 'express';
import * as kraService from '../services/kra.service';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import { createAuditLog } from '../services/audit.service';
import { createNotification } from '../services/notification.service';
import supabase from '../config/supabase';

export async function listKra(req: Request, res: Response): Promise<void> {
  const { page, limit } = getPagination(Number(req.query.page), Number(req.query.limit));
  const result = await kraService.getAllKra(page, limit, {
    status: req.query.status as string,
    employeeId: req.query.employee_id as string,
    search: req.query.search as string,
  }) as any;
  if (result.error) { sendError(res, result.error, 'FETCH_ERROR'); return; }
  sendSuccess(res, result.data, 200, buildPaginationMeta(result.count || 0, page, limit));
}

export async function getKra(req: Request, res: Response): Promise<void> {
  const { data, error } = await kraService.getKraById(req.params.id);
  if (error) { sendError(res, 'KRA not found', 'NOT_FOUND', 404); return; }
  sendSuccess(res, data);
}

export async function createKra(req: Request, res: Response): Promise<void> {
  const result = await kraService.createKra({ ...req.body, assigned_by: req.user!.sub });
  if (result.error) { sendError(res, result.error, 'CREATE_ERROR'); return; }

  await createNotification({
    user_id: req.body.employee_id,
    message: `New KRA assigned: "${req.body.title}"`,
    type: 'kra',
    entity_id: result.kra!.id,
  });

  await createAuditLog({
    actor_id: req.user!.sub, action: 'CREATE_KRA',
    entity: 'kra', entity_id: result.kra!.id,
  });

  sendSuccess(res, result.kra, 201);
}

export async function updateKraStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body;
  const result = await kraService.updateKraStatus(req.params.id, status);
  if (result.error) { sendError(res, result.error, 'UPDATE_ERROR'); return; }

  // Notify employee on approve/reject
  if (['approved', 'rejected'].includes(status)) {
    const { data: kra } = await supabase.from('kra').select('employee_id, title').eq('id', req.params.id).single();
    if (kra) {
      await createNotification({
        user_id: kra.employee_id,
        message: `Your KRA "${kra.title}" has been ${status}`,
        type: 'kra',
        entity_id: req.params.id,
      });
    }
  }

  await createAuditLog({
    actor_id: req.user!.sub, action: `KRA_${status.toUpperCase()}`,
    entity: 'kra', entity_id: req.params.id,
  });

  sendSuccess(res, result.kra);
}

export async function deleteKra(req: Request, res: Response): Promise<void> {
  const result = await kraService.deleteKra(req.params.id);
  if (result.error) { sendError(res, result.error, 'DELETE_ERROR'); return; }
  sendSuccess(res, { deleted: true });
}

export async function getStats(req: Request, res: Response): Promise<void> {
  const stats = await kraService.getKraStats(req.query.employee_id as string);
  sendSuccess(res, stats);
}
