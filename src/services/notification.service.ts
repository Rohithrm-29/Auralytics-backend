import supabase from '../config/supabase';
import { logger } from '../utils/logger';

type NotificationType = 'task' | 'kra' | 'project' | 'system';

interface NotifyParams {
  user_id: string;
  message: string;
  type: NotificationType;
  entity_id?: string;
}

export async function createNotification(params: NotifyParams): Promise<void> {
  try {
    await supabase.from('notifications').insert({
      user_id: params.user_id,
      message: params.message,
      type: params.type,
      entity_id: params.entity_id || null,
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Failed to create notification:', err);
  }
}

export async function getNotifications(userId: string, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
}

export async function markAsRead(notificationId: string, userId: string) {
  return supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);
}

export async function markAllAsRead(userId: string) {
  return supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  return count || 0;
}
