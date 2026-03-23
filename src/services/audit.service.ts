import supabase from '../config/supabase';
import { logger } from '../utils/logger';

interface AuditParams {
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      actor_id: params.actor_id,
      action: params.action,
      entity: params.entity,
      entity_id: params.entity_id,
      metadata: params.metadata || {},
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Failed to create audit log:', err);
  }
}

export async function getAuditLogs(
  page = 1,
  limit = 20,
  entity?: string,
  actorId?: string
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('audit_logs')
    .select('*, actor:employees(id, name, role)', { count: 'exact' })
    .order('timestamp', { ascending: false })
    .range(from, to);

  if (entity) query = query.eq('entity', entity);
  if (actorId) query = query.eq('actor_id', actorId);

  return query;
}
