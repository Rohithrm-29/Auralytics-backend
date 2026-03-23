import supabase from '../config/supabase';

export async function getAllRevenue(
  page: number,
  limit: number,
  filters: { projectId?: string; year?: number; month?: number }
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('revenue')
    .select('*, project:project_id(id, name, budget)', { count: 'exact' })
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .range(from, to);

  if (filters.projectId) query = query.eq('project_id', filters.projectId);
  if (filters.year) query = query.eq('year', filters.year);
  if (filters.month) query = query.eq('month', filters.month);

  return query;
}

export async function createRevenue(data: {
  project_id: string;
  amount: number;
  month: number;
  year: number;
  notes?: string;
}) {
  const { data: revenue, error } = await supabase
    .from('revenue')
    .insert({ ...data, created_at: new Date().toISOString() })
    .select('*, project:project_id(id, name)')
    .single();

  if (error) return { error: error.message };
  return { revenue };
}

export async function updateRevenue(id: string, data: Partial<{
  amount: number;
  month: number;
  year: number;
  notes: string;
}>) {
  const { data: revenue, error } = await supabase
    .from('revenue')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { revenue };
}

export async function deleteRevenue(id: string) {
  const { error } = await supabase.from('revenue').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getRevenueTrends(year?: number) {
  let query = supabase
    .from('revenue')
    .select('amount, month, year, project:project_id(id, name, budget)');

  if (year) query = query.eq('year', year);
  else query = query.gte('year', new Date().getFullYear() - 1);

  const { data } = await query.order('year').order('month');

  if (!data) return { monthly: [], total: 0 };

  // Aggregate by month-year
  const monthly: Record<string, number> = {};
  let total = 0;

  for (const r of data) {
    const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + r.amount;
    total += r.amount;
  }

  return {
    monthly: Object.entries(monthly).map(([period, amount]) => ({ period, amount })),
    total,
  };
}

export async function getBudgetVsRevenue() {
  const { data: projects } = await supabase.from('projects').select('id, name, budget');
  const { data: revenues } = await supabase.from('revenue').select('project_id, amount');

  if (!projects) return [];

  const revenueByProject: Record<string, number> = {};
  for (const r of revenues || []) {
    revenueByProject[r.project_id] = (revenueByProject[r.project_id] || 0) + r.amount;
  }

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    budget: p.budget,
    revenue: revenueByProject[p.id] || 0,
    variance: (revenueByProject[p.id] || 0) - p.budget,
  }));
}
