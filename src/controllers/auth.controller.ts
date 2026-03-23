import { Request, Response } from 'express';
import { loginEmployee, refreshAccessToken, getMe } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { createAuditLog } from '../services/audit.service';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const result = await loginEmployee(email, password);

  if (result.error || !result.employee || !result.tokens) {
    sendError(res, result.error || 'Login failed', 'AUTH_FAILED', 401);
    return;
  }

  await createAuditLog({
    actor_id: result.employee.id,
    action: 'LOGIN',
    entity: 'auth',
    entity_id: result.employee.id,
  });

  sendSuccess(res, { employee: result.employee, tokens: result.tokens });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  const result = await refreshAccessToken(refreshToken);

  if (result.error || !result.tokens) {
    sendError(res, result.error || 'Refresh failed', 'REFRESH_FAILED', 401);
    return;
  }

  sendSuccess(res, { tokens: result.tokens });
}

export async function me(req: Request, res: Response): Promise<void> {
  const result = await getMe(req.user!.sub);

  if (result.error) {
    sendError(res, result.error, 'NOT_FOUND', 404);
    return;
  }

  sendSuccess(res, result.employee);
}
