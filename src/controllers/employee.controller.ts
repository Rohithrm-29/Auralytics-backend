import { Request, Response } from 'express';
import * as employeeService from '../services/employee.service';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import { createAuditLog } from '../services/audit.service';
import { Role } from '../models/types';

export async function listEmployees(req: Request, res: Response): Promise<void> {
  const { page, limit, from, to } = getPagination(
    Number(req.query.page),
    Number(req.query.limit)
  );
  void from; void to;

  const result = await employeeService.getAllEmployees(
    page, limit,
    req.query.search as string,
    req.query.role as Role
  ) as any;

  if (result.error) { sendError(res, result.error, 'FETCH_ERROR'); return; }

  sendSuccess(res, result.data, 200, buildPaginationMeta(result.count || 0, page, limit));
}

export async function getEmployee(req: Request, res: Response): Promise<void> {
  const { data, error } = await employeeService.getEmployeeById(req.params.id);
  if (error) { sendError(res, 'Employee not found', 'NOT_FOUND', 404); return; }
  sendSuccess(res, data);
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const id = req.params.id || req.user!.sub;
  const result = await employeeService.getEmployeeProfile(id);
  if (result.error) { sendError(res, result.error, 'NOT_FOUND', 404); return; }
  sendSuccess(res, result);
}

export async function getSubordinates(req: Request, res: Response): Promise<void> {
  const { data, error } = await employeeService.getSubordinates(req.params.id) as any;
  if (error) { sendError(res, error, 'FETCH_ERROR'); return; }
  sendSuccess(res, data);
}

export async function createEmployee(req: Request, res: Response): Promise<void> {
  const result = await employeeService.createEmployee(req.body);
  if (result.error) { sendError(res, result.error, 'CREATE_ERROR'); return; }

  await createAuditLog({
    actor_id: req.user!.sub,
    action: 'CREATE_EMPLOYEE',
    entity: 'employees',
    entity_id: result.employee!.id,
    metadata: { name: result.employee!.name, role: result.employee!.role },
  });

  sendSuccess(res, result.employee, 201);
}

export async function updateEmployee(req: Request, res: Response): Promise<void> {
  const result = await employeeService.updateEmployee(req.params.id, req.body);
  if (result.error) { sendError(res, result.error, 'UPDATE_ERROR'); return; }

  await createAuditLog({
    actor_id: req.user!.sub,
    action: 'UPDATE_EMPLOYEE',
    entity: 'employees',
    entity_id: req.params.id,
    metadata: req.body,
  });

  sendSuccess(res, result.employee);
}

export async function deleteEmployee(req: Request, res: Response): Promise<void> {
  const result = await employeeService.deleteEmployee(req.params.id);
  if (result.error) { sendError(res, result.error, 'DELETE_ERROR'); return; }

  await createAuditLog({
    actor_id: req.user!.sub,
    action: 'DELETE_EMPLOYEE',
    entity: 'employees',
    entity_id: req.params.id,
  });

  sendSuccess(res, { deleted: true });
}
