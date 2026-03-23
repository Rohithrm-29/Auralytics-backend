import bcrypt from 'bcryptjs';
import supabase from '../config/supabase';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { Employee } from '../models/types';

export async function loginEmployee(email: string, password: string) {
  // Fetch employee by email
  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();
  console.log(employee)
  if (error || !employee) {
    return { error: 'Invalid credentials' };
  }

  // Compare password
  const valid = await bcrypt.compare(password, employee.password_hash);
  console.log(valid, '//////////////////')
  if (!valid) {
    return { error: 'Invalid credentials' };
  }

  const tokens = generateTokenPair({
    sub: employee.id,
    email: employee.email,
    role: employee.role,
  });

  // Strip password hash before returning
  const { password_hash, ...safeEmployee } = employee as Employee;
  void password_hash; // acknowledge unused var
  console.log(safeEmployee, ';;;;;;;;;;;;;;;;;;')

  return { employee: safeEmployee, tokens };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);

    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, email, role')
      .eq('id', payload.sub)
      .single();

    if (error || !employee) {
      return { error: 'Employee not found' };
    }

    const tokens = generateTokenPair({
      sub: employee.id,
      email: employee.email,
      role: employee.role,
    });

    return { tokens };
  } catch {
    return { error: 'Invalid refresh token' };
  }
}

export async function getMe(employeeId: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, email, role, manager_id, department, avatar_url, created_at')
    .eq('id', employeeId)
    .single();

  if (error) return { error: 'Employee not found' };
  return { employee: data };
}
