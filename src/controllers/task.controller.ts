import { Request, Response } from 'express';
import * as taskService from '../services/task.service';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import { createAuditLog } from '../services/audit.service';
import { createNotification } from '../services/notification.service';
import supabase from '../config/supabase';

export async function listTasks(req: Request, res: Response): Promise<void> {
  const { page, limit } = getPagination(Number(req.query.page), Number(req.query.limit));
  const result = await taskService.getAllTasks(page, limit, {
    status: req.query.status as string,
    priority: req.query.priority as string,
    projectId: req.query.project_id as string,
    assignedTo: req.query.assigned_to as string,
    search: req.query.search as string,
  }) as any;
  if (result.error) { sendError(res, result.error, 'FETCH_ERROR'); return; }
  sendSuccess(res, result.data, 200, buildPaginationMeta(result.count || 0, page, limit));
}

export async function getTask(req: Request, res: Response): Promise<void> {
  const result = await taskService.getTaskById(req.params.id);
  if (result.error) { sendError(res, result.error, 'NOT_FOUND', 404); return; }
  sendSuccess(res, result);
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const result = await taskService.createTask({ ...req.body, assigned_by: req.user!.sub });
  if (result.error) { sendError(res, result.error, 'CREATE_ERROR'); return; }

  // Notify assignee
  await createNotification({
    user_id: req.body.assigned_to,
    message: `New task assigned: "${req.body.title}"`,
    type: 'task',
    entity_id: result.task!.id,
  });

  await createAuditLog({
    actor_id: req.user!.sub, action: 'CREATE_TASK',
    entity: 'tasks', entity_id: result.task!.id,
    metadata: { title: req.body.title, assigned_to: req.body.assigned_to },
  });

  sendSuccess(res, result.task, 201);
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  // Designers can only update status
  const user = req.user!;
  if (['designer', 'senior_designer'].includes(user.role)) {
    const allowed = { status: req.body.status };
    const result = await taskService.updateTask(req.params.id, allowed);
    if (result.error) { sendError(res, result.error, 'UPDATE_ERROR'); return; }
    sendSuccess(res, result.task);
    return;
  }

  const result = await taskService.updateTask(req.params.id, req.body);
  if (result.error) { sendError(res, result.error, 'UPDATE_ERROR'); return; }

  // Notify task owner if status changed
  if (req.body.status) {
    const { data: task } = await supabase.from('tasks').select('assigned_by, title').eq('id', req.params.id).single();
    if (task && task.assigned_by !== user.sub) {
      await createNotification({
        user_id: task.assigned_by,
        message: `Task "${task.title}" status changed to ${req.body.status}`,
        type: 'task',
        entity_id: req.params.id,
      });
    }
  }

  await createAuditLog({
    actor_id: user.sub, action: 'UPDATE_TASK',
    entity: 'tasks', entity_id: req.params.id, metadata: req.body,
  });

  sendSuccess(res, result.task);
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const result = await taskService.deleteTask(req.params.id);
  if (result.error) { sendError(res, result.error, 'DELETE_ERROR'); return; }
  await createAuditLog({
    actor_id: req.user!.sub, action: 'DELETE_TASK',
    entity: 'tasks', entity_id: req.params.id,
  });
  sendSuccess(res, { deleted: true });
}

export async function addComment(req: Request, res: Response): Promise<void> {
  const result = await taskService.addTaskComment(req.params.id, req.user!.sub, req.body.content);
  if (result.error) { sendError(res, result.error, 'COMMENT_ERROR'); return; }
  sendSuccess(res, result.comment, 201);
}

export async function getStats(req: Request, res: Response): Promise<void> {
  const employeeId = req.query.employee_id as string | undefined;
  const stats = await taskService.getTaskStats(employeeId);
  sendSuccess(res, stats);
}
