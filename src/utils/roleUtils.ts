import { Role } from '../models/types';

// Defines who can manage/be subordinate to whom
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  hr: ['recruiter'],
  manager: ['senior_designer', 'designer'],
  senior_designer: ['designer'],
  recruiter: [],
  designer: [],
};

// Roles that can be top-level (no manager)
export const TOP_LEVEL_ROLES: Role[] = ['hr', 'manager'];

// Valid manager roles for a given subordinate role
export const VALID_MANAGERS: Record<Role, Role[]> = {
  recruiter: ['hr'],
  senior_designer: ['manager'],
  designer: ['manager', 'senior_designer'],
  hr: [],
  manager: [],
};

export function canManage(managerRole: Role, subordinateRole: Role): boolean {
  return ROLE_HIERARCHY[managerRole]?.includes(subordinateRole) ?? false;
}

export function isValidManagerForRole(managerRole: Role, subordinateRole: Role): boolean {
  return VALID_MANAGERS[subordinateRole]?.includes(managerRole) ?? false;
}

// Roles that can assign tasks
export const TASK_ASSIGNERS: Role[] = ['hr', 'manager'];

// Roles that can approve KRA
export const KRA_APPROVERS: Role[] = ['hr', 'manager'];

// Roles with analytics access
export const ANALYTICS_ACCESS: Role[] = ['hr', 'manager'];
