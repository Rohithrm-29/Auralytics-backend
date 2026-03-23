import { z } from 'zod';

// Auth
export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password too short'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// Employee
export const CreateEmployeeSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['hr', 'manager', 'recruiter', 'senior_designer', 'designer']),
  manager_id: z.string().uuid().optional().nullable(),
  department: z.string().max(100).optional(),
});

export const UpdateEmployeeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['hr', 'manager', 'recruiter', 'senior_designer', 'designer']).optional(),
  manager_id: z.string().uuid().optional().nullable(),
  department: z.string().max(100).optional(),
});

// Project
export const CreateProjectSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  budget: z.number().positive(),
  status: z.enum(['active', 'completed', 'on_hold']).default('active'),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const AssignProjectSchema = z.object({
  employee_ids: z.array(z.string().uuid()).min(1),
});

// Task
export const CreateTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  assigned_to: z.string().uuid(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().datetime().optional(),
  project_id: z.string().uuid().optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().datetime().optional(),
});

export const CreateTaskCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

// KRA
export const CreateKraSchema = z.object({
  employee_id: z.string().uuid(),
  title: z.string().min(2).max(300),
  description: z.string().max(2000).optional(),
  target_date: z.string().datetime().optional(),
});

export const UpdateKraStatusSchema = z.object({
  status: z.enum(['pending', 'submitted', 'approved', 'rejected']),
});

// Revenue
export const CreateRevenueSchema = z.object({
  project_id: z.string().uuid(),
  amount: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  notes: z.string().max(500).optional(),
});

export const UpdateRevenueSchema = CreateRevenueSchema.partial();

// Pagination
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().max(200).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});
