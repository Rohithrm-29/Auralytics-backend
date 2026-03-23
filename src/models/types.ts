// ============================================================
// Auralytics — TypeScript Interfaces
// ============================================================

export type Role = 'hr' | 'manager' | 'recruiter' | 'senior_designer' | 'designer';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type KraStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

// ------ Employee ------
export interface Employee {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  manager_id: string | null;
  department?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface EmployeePublic {
  id: string;
  name: string;
  email: string;
  role: Role;
  manager_id: string | null;
  department?: string;
  avatar_url?: string;
  created_at: string;
}

// ------ Project ------
export interface Project {
  id: string;
  name: string;
  description?: string;
  budget: number;
  status: 'active' | 'completed' | 'on_hold';
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface ProjectAssignment {
  project_id: string;
  employee_id: string;
  assigned_at: string;
}

// ------ Task ------
export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_by: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  project_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

// ------ KRA ------
export interface Kra {
  id: string;
  employee_id: string;
  title: string;
  description?: string;
  status: KraStatus;
  assigned_by: string;
  target_date?: string;
  created_at: string;
  updated_at?: string;
}

// ------ Revenue ------
export interface Revenue {
  id: string;
  project_id: string;
  amount: number;
  month: number; // 1–12
  year: number;
  notes?: string;
  created_at: string;
}

// ------ Notification ------
export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: 'task' | 'kra' | 'project' | 'system';
  entity_id?: string;
  read: boolean;
  created_at: string;
}

// ------ Audit Log ------
export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ------ JWT Payload ------
export interface JwtPayload {
  sub: string; // employee id
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ------ API Response ------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ------ Pagination ------
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}
