import bcrypt from 'bcryptjs';
import supabase from '../config/supabase';
import { Role } from '../models/types';
import { isValidManagerForRole, TOP_LEVEL_ROLES } from '../utils/roleUtils';

const SAFE_FIELDS = 'id, name, email, role, manager_id, department, avatar_url, created_at';

export async function getAllEmployees(
  page: number,
  limit: number,
  search?: string,
  role?: Role
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('employees')
    .select(SAFE_FIELDS + ', manager:manager_id(id, name, role)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (role) {
    query = query.eq('role', role);
  }

  return query;
}

export async function getEmployeeById(id: string) {
  return supabase
    .from('employees')
    .select(SAFE_FIELDS + ', manager:manager_id(id, name, role)')
    .eq('id', id)
    .single();
}

export async function getSubordinates(managerId: string) {
  return supabase
    .from('employees')
    .select(SAFE_FIELDS)
    .eq('manager_id', managerId)
    .order('name');
}

export async function createEmployee(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
  manager_id?: string | null;
  department?: string;
}) {
  // Validate manager assignment
  if (data.manager_id && data.role) {
    const { data: manager } = await supabase
      .from('employees')
      .select('role')
      .eq('id', data.manager_id)
      .single();

    if (!manager) return { error: 'Manager not found' };
    if (!isValidManagerForRole(manager.role as Role, data.role)) {
      return { error: `A ${manager.role} cannot manage a ${data.role}` };
    }
  }

  if (TOP_LEVEL_ROLES.includes(data.role) && data.manager_id) {
    return { error: `${data.role} cannot have a manager` };
  }

  if (!TOP_LEVEL_ROLES.includes(data.role) && !data.manager_id) {
    return { error: `${data.role} must have a manager` };
  }

  // Check email uniqueness
  const { data: existing } = await supabase
    .from('employees')
    .select('id')
    .eq('email', data.email.toLowerCase())
    .single();

  if (existing) return { error: 'Email already in use' };

  const password_hash = await bcrypt.hash(data.password, 12);

  const { data: employee, error } = await supabase
    .from('employees')
    .insert({
      name: data.name,
      email: data.email.toLowerCase(),
      password_hash,
      role: data.role,
      manager_id: data.manager_id || null,
      department: data.department || null,
      created_at: new Date().toISOString(),
    })
    .select(SAFE_FIELDS)
    .single();

  if (error) return { error: error.message };
  return { employee };
}

export async function updateEmployee(
  id: string,
  data: {
    name?: string;
    email?: string;
    role?: Role;
    manager_id?: string | null;
    department?: string;
  }
) {
  // Prevent circular hierarchy: manager cannot report to their own subordinate
  if (data.manager_id) {
    const isCircular = await detectCircularHierarchy(id, data.manager_id);
    if (isCircular) return { error: 'Circular reporting hierarchy detected' };
  }

  const updateData: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
  if (data.email) updateData.email = data.email.toLowerCase();

  const { data: employee, error } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', id)
    .select(SAFE_FIELDS)
    .single();

  if (error) return { error: error.message };
  return { employee };
}

export async function deleteEmployee(id: string) {
  // Reassign subordinates to null before delete
  await supabase
    .from('employees')
    .update({ manager_id: null })
    .eq('manager_id', id);

  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getEmployeeProfile(id: string) {
  const [empResult, tasksResult, kraResult] = await Promise.all([
    supabase
      .from('employees')
      .select(SAFE_FIELDS + ', manager:manager_id(id, name, role)')
      .eq('id', id)
      .single(),
    supabase
      .from('tasks')
      .select('id, title, status, priority, due_date')
      .eq('assigned_to', id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('kra')
      .select('id, title, status, target_date')
      .eq('employee_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (empResult.error) return { error: 'Employee not found' };

  return {
    employee: empResult.data,
    recentTasks: tasksResult.data || [],
    recentKra: kraResult.data || [],
  };
}

async function detectCircularHierarchy(
  employeeId: string,
  newManagerId: string
): Promise<boolean> {
  // Walk up the manager chain from newManagerId; if we hit employeeId it's circular
  let currentId: string | null = newManagerId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === employeeId) return true;
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const { data } = await supabase
      .from('employees')
      .select('manager_id')
      .eq('id', currentId)
      .single() as any;

    currentId = data?.manager_id || null;
  }

  return false;
}
