import supabase from '../config/supabase';

export async function getDashboardStats() {
  const [
    empResult,
    projectResult,
    taskResult,
    kraResult,
    revenueResult,
  ] = await Promise.all([
    supabase.from('employees').select('role', { count: 'exact' }),
    supabase.from('projects').select('status', { count: 'exact' }),
    supabase.from('tasks').select('status', { count: 'exact' }),
    supabase.from('kra').select('status', { count: 'exact' }),
    supabase.from('revenue').select('amount'),
  ]);

  const employees = empResult.data || [];
  const projects = projectResult.data || [];
  const tasks = taskResult.data || [];
  const kras = kraResult.data || [];
  const revenues = revenueResult.data || [];

  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);

  return {
    employees: {
      total: empResult.count || 0,
      by_role: employees.reduce((acc: Record<string, number>, e) => {
        acc[e.role] = (acc[e.role] || 0) + 1;
        return acc;
      }, {}),
    },
    projects: {
      total: projectResult.count || 0,
      active: projects.filter((p) => p.status === 'active').length,
      completed: projects.filter((p) => p.status === 'completed').length,
      on_hold: projects.filter((p) => p.status === 'on_hold').length,
    },
    tasks: {
      total: taskResult.count || 0,
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      review: tasks.filter((t) => t.status === 'review').length,
      done: tasks.filter((t) => t.status === 'done').length,
      completion_rate: tasks.length
        ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100)
        : 0,
    },
    kra: {
      total: kras.length,
      approved: kras.filter((k) => k.status === 'approved').length,
      achievement_rate: kras.length
        ? Math.round((kras.filter((k) => k.status === 'approved').length / kras.length) * 100)
        : 0,
    },
    revenue: {
      total: totalRevenue,
    },
  };
}

export async function getRecentActivity(limit = 10) {
  const { data } = await supabase
    .from('audit_logs')
    .select('*, actor:actor_id(id, name, role)')
    .order('timestamp', { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getPerformanceMatrix() {
  const { data: employees } = await supabase
    .from('employees')
    .select('id, name, role, department');

  if (!employees) return [];

  const ids = employees.map((e) => e.id);

  const [tasksData, kraData] = await Promise.all([
    supabase.from('tasks').select('assigned_to, status').in('assigned_to', ids),
    supabase.from('kra').select('employee_id, status').in('employee_id', ids),
  ]);

  return employees.map((emp) => {
    const empTasks = (tasksData.data || []).filter((t) => t.assigned_to === emp.id);
    const empKra = (kraData.data || []).filter((k) => k.employee_id === emp.id);

    const taskCompletion = empTasks.length
      ? Math.round((empTasks.filter((t) => t.status === 'done').length / empTasks.length) * 100)
      : 0;

    const kraAchievement = empKra.length
      ? Math.round((empKra.filter((k) => k.status === 'approved').length / empKra.length) * 100)
      : 0;

    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      department: emp.department,
      task_completion: taskCompletion,
      kra_achievement: kraAchievement,
      total_tasks: empTasks.length,
      total_kra: empKra.length,
      performance_score: Math.round((taskCompletion + kraAchievement) / 2),
    };
  });
}
