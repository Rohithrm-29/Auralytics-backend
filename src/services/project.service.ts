import supabase from '../config/supabase';

export async function getAllProjects(page: number, limit: number, search?: string) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('projects')
    .select('*, creator:created_by(id, name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) query = query.ilike('name', `%${search}%`);

  return query;
}

export async function getProjectById(id: string) {
  const [projectResult, assignmentsResult, revenueResult] = await Promise.all([
    supabase
      .from('projects')
      .select('*, creator:created_by(id, name, role)')
      .eq('id', id)
      .single(),
    supabase
      .from('project_assignments')
      .select('employee:employee_id(id, name, role, avatar_url)')
      .eq('project_id', id),
    supabase
      .from('revenue')
      .select('amount, month, year')
      .eq('project_id', id)
      .order('year', { ascending: false })
      .order('month', { ascending: false }),
  ]);

  if (projectResult.error) return { error: 'Project not found' };

  return {
    project: projectResult.data,
    assignments: assignmentsResult.data || [],
    revenue: revenueResult.data || [],
  };
}

export async function getEmployeeProjects(employeeId: string) {
  return supabase
    .from('project_assignments')
    .select('project:project_id(id, name, description, budget, status, created_at)')
    .eq('employee_id', employeeId);
}

export async function createProject(data: {
  name: string;
  description?: string;
  budget: number;
  status: string;
  created_by: string;
}) {
  const { data: project, error } = await supabase
    .from('projects')
    .insert({ ...data, created_at: new Date().toISOString() })
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { project };
}

export async function updateProject(id: string, data: Partial<{
  name: string;
  description: string;
  budget: number;
  status: string;
}>) {
  const { data: project, error } = await supabase
    .from('projects')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { project };
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function assignEmployeesToProject(
  projectId: string,
  employeeIds: string[]
) {
  const rows = employeeIds.map((employee_id) => ({
    project_id: projectId,
    employee_id,
    assigned_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('project_assignments')
    .upsert(rows, { onConflict: 'project_id,employee_id' });

  if (error) return { error: error.message };
  return { success: true };
}

export async function removeEmployeeFromProject(projectId: string, employeeId: string) {
  const { error } = await supabase
    .from('project_assignments')
    .delete()
    .eq('project_id', projectId)
    .eq('employee_id', employeeId);

  if (error) return { error: error.message };
  return { success: true };
}
