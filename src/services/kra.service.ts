import supabase from '../config/supabase';

export async function getAllKra(
  page: number,
  limit: number,
  filters: { status?: string; employeeId?: string; search?: string }
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('kra')
    .select(
      '*, employee:employee_id(id, name, role), assigner:assigned_by(id, name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.employeeId) query = query.eq('employee_id', filters.employeeId);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);

  return query;
}

export async function getKraById(id: string) {
  return supabase
    .from('kra')
    .select('*, employee:employee_id(id, name, role), assigner:assigned_by(id, name)')
    .eq('id', id)
    .single();
}

export async function createKra(data: {
  employee_id: string;
  title: string;
  description?: string;
  assigned_by: string;
  target_date?: string;
}) {
  const { data: kra, error } = await supabase
    .from('kra')
    .insert({ ...data, status: 'pending', created_at: new Date().toISOString() })
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { kra };
}

export async function updateKraStatus(id: string, status: string) {
  const { data: kra, error } = await supabase
    .from('kra')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { kra };
}

export async function deleteKra(id: string) {
  const { error } = await supabase.from('kra').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getKraStats(employeeId?: string) {
  let query = supabase.from('kra').select('status');
  if (employeeId) query = query.eq('employee_id', employeeId);

  const { data } = await query;
  if (!data) return {};

  return {
    total: data.length,
    pending: data.filter((k) => k.status === 'pending').length,
    submitted: data.filter((k) => k.status === 'submitted').length,
    approved: data.filter((k) => k.status === 'approved').length,
    rejected: data.filter((k) => k.status === 'rejected').length,
    achievement_rate: data.length
      ? Math.round((data.filter((k) => k.status === 'approved').length / data.length) * 100)
      : 0,
  };
}
