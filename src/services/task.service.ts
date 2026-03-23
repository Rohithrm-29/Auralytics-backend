import supabase from '../config/supabase';
import { Role } from '../models/types';

export async function getAllTasks(
  page: number,
  limit: number,
  filters: { status?: string; priority?: string; projectId?: string; assignedTo?: string; search?: string }
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('tasks')
    .select(
      '*, assignee:assigned_to(id, name, role, avatar_url), assigner:assigned_by(id, name), project:project_id(id, name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.projectId) query = query.eq('project_id', filters.projectId);
  if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);

  return query;
}

export async function getTaskById(id: string) {
  const [taskResult, commentsResult] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, assignee:assigned_to(id, name, role, avatar_url), assigner:assigned_by(id, name), project:project_id(id, name)')
      .eq('id', id)
      .single(),
    supabase
      .from('task_comments')
      .select('*, author:author_id(id, name, avatar_url)')
      .eq('task_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (taskResult.error) return { error: 'Task not found' };
  return { task: taskResult.data, comments: commentsResult.data || [] };
}

export async function getTasksForUser(employeeId: string, role: Role) {
  // HR & Manager see all tasks in their scope; others see only assigned tasks
  if (role === 'hr') {
    return supabase
      .from('tasks')
      .select('*, assignee:assigned_to(id, name), project:project_id(id, name)')
      .order('created_at', { ascending: false })
      .limit(50);
  }

  return supabase
    .from('tasks')
    .select('*, assignee:assigned_to(id, name), project:project_id(id, name)')
    .or(`assigned_to.eq.${employeeId},assigned_by.eq.${employeeId}`)
    .order('created_at', { ascending: false })
    .limit(50);
}

export async function createTask(data: {
  title: string;
  description?: string;
  assigned_to: string;
  assigned_by: string;
  status: string;
  priority: string;
  due_date?: string;
  project_id?: string;
}) {
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ ...data, created_at: new Date().toISOString() })
    .select('*, assignee:assigned_to(id, name), assigner:assigned_by(id, name)')
    .single();

  if (error) return { error: error.message };
  return { task };
}

export async function updateTask(id: string, data: Partial<{
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
}>) {
  const { data: task, error } = await supabase
    .from('tasks')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { task };
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function addTaskComment(taskId: string, authorId: string, content: string) {
  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      author_id: authorId,
      content,
      created_at: new Date().toISOString(),
    })
    .select('*, author:author_id(id, name, avatar_url)')
    .single();

  if (error) return { error: error.message };
  return { comment: data };
}

export async function getTaskStats(employeeId?: string) {
  let query = supabase.from('tasks').select('status, priority');
  if (employeeId) query = query.eq('assigned_to', employeeId);

  const { data } = await query;
  if (!data) return {};

  return {
    total: data.length,
    todo: data.filter((t) => t.status === 'todo').length,
    in_progress: data.filter((t) => t.status === 'in_progress').length,
    review: data.filter((t) => t.status === 'review').length,
    done: data.filter((t) => t.status === 'done').length,
    high_priority: data.filter((t) => t.priority === 'high').length,
  };
}
