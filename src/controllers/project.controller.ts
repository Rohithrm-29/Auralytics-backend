import { Request, Response } from 'express';
import * as projectService from '../services/project.service';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import { createAuditLog } from '../services/audit.service';
import { createNotification } from '../services/notification.service';
import supabase from '../config/supabase';

export async function listProjects(req: Request, res: Response): Promise<void> {
  const { page, limit } = getPagination(Number(req.query.page), Number(req.query.limit));
  const result = await projectService.getAllProjects(page, limit, req.query.search as string) as any;
  if (result.error) { sendError(res, result.error, 'FETCH_ERROR'); return; }
  sendSuccess(res, result.data, 200, buildPaginationMeta(result.count || 0, page, limit));
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const result = await projectService.getProjectById(req.params.id);
  if (result.error) { sendError(res, result.error, 'NOT_FOUND', 404); return; }
  sendSuccess(res, result);
}

export async function myProjects(req: Request, res: Response): Promise<void> {
  const { data, error } = await projectService.getEmployeeProjects(req.user!.sub) as any;
  if (error) { sendError(res, error, 'FETCH_ERROR'); return; }
  sendSuccess(res, data);
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const result = await projectService.createProject({ ...req.body, created_by: req.user!.sub });
  if (result.error) { sendError(res, result.error, 'CREATE_ERROR'); return; }

  await createAuditLog({
    actor_id: req.user!.sub,
    action: 'CREATE_PROJECT',
    entity: 'projects',
    entity_id: result.project!.id,
    metadata: { name: result.project!.name },
  });

  sendSuccess(res, result.project, 201);
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const result = await projectService.updateProject(req.params.id, req.body);
  if (result.error) { sendError(res, result.error, 'UPDATE_ERROR'); return; }

  await createAuditLog({
    actor_id: req.user!.sub, action: 'UPDATE_PROJECT',
    entity: 'projects', entity_id: req.params.id, metadata: req.body,
  });

  sendSuccess(res, result.project);
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  const result = await projectService.deleteProject(req.params.id);
  if (result.error) { sendError(res, result.error, 'DELETE_ERROR'); return; }

  await createAuditLog({
    actor_id: req.user!.sub, action: 'DELETE_PROJECT',
    entity: 'projects', entity_id: req.params.id,
  });

  sendSuccess(res, { deleted: true });
}

export async function assignEmployees(req: Request, res: Response): Promise<void> {
  const { employee_ids } = req.body;
  const result = await projectService.assignEmployeesToProject(req.params.id, employee_ids);
  if (result.error) { sendError(res, result.error, 'ASSIGN_ERROR'); return; }

  // Notify assigned employees
  const { data: project } = await supabase.from('projects').select('name').eq('id', req.params.id).single();
  for (const empId of employee_ids) {
    await createNotification({
      user_id: empId,
      message: `You have been assigned to project: ${project?.name}`,
      type: 'project',
      entity_id: req.params.id,
    });
  }

  await createAuditLog({
    actor_id: req.user!.sub, action: 'ASSIGN_PROJECT',
    entity: 'projects', entity_id: req.params.id, metadata: { employee_ids },
  });

  sendSuccess(res, { assigned: true });
}

export async function removeEmployee(req: Request, res: Response): Promise<void> {
  const result = await projectService.removeEmployeeFromProject(req.params.id, req.params.employeeId);
  if (result.error) { sendError(res, result.error, 'REMOVE_ERROR'); return; }
  sendSuccess(res, { removed: true });
}
