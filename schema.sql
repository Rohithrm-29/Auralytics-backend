-- ============================================================
-- AURALYTICS — Supabase PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE TABLE employees (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('hr','manager','recruiter','senior_designer','designer')),
  manager_id    UUID REFERENCES employees(id) ON DELETE SET NULL,
  department    VARCHAR(100),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

CREATE INDEX idx_employees_role       ON employees(role);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_email      ON employees(email);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  budget      NUMERIC(14,2) NOT NULL DEFAULT 0,
  status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','on_hold')),
  created_by  UUID NOT NULL REFERENCES employees(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

CREATE INDEX idx_projects_status     ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- ============================================================
-- PROJECT ASSIGNMENTS
-- ============================================================
CREATE TABLE project_assignments (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, employee_id)
);

CREATE INDEX idx_pa_employee ON project_assignments(employee_id);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES employees(id) ON DELETE SET NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done')),
  priority    VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date    TIMESTAMPTZ,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_tasks_status      ON tasks(status);
CREATE INDEX idx_tasks_priority    ON tasks(priority);
CREATE INDEX idx_tasks_project_id  ON tasks(project_id);

-- ============================================================
-- TASK COMMENTS
-- ============================================================
CREATE TABLE task_comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);

-- ============================================================
-- KRA
-- ============================================================
CREATE TABLE kra (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title       VARCHAR(300) NOT NULL,
  description TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','approved','rejected')),
  assigned_by UUID NOT NULL REFERENCES employees(id) ON DELETE SET NULL,
  target_date TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

CREATE INDEX idx_kra_employee_id ON kra(employee_id);
CREATE INDEX idx_kra_status      ON kra(status);

-- ============================================================
-- REVENUE
-- ============================================================
CREATE TABLE revenue (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount     NUMERIC(14,2) NOT NULL,
  month      SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year       SMALLINT NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revenue_project_id ON revenue(project_id);
CREATE INDEX idx_revenue_year_month ON revenue(year, month);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  type       VARCHAR(20) NOT NULL DEFAULT 'system' CHECK (type IN ('task','kra','project','system')),
  entity_id  UUID,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read    ON notifications(user_id, read);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id  UUID REFERENCES employees(id) ON DELETE SET NULL,
  action    VARCHAR(100) NOT NULL,
  entity    VARCHAR(50) NOT NULL,
  entity_id UUID,
  metadata  JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor_id  ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity    ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);

-- ============================================================
-- ROW LEVEL SECURITY (Optional — enable in Supabase dashboard)
-- ============================================================
-- NOTE: Since the backend uses SERVICE_ROLE_KEY, RLS is bypassed.
-- Enable these only if you add anon/authenticated role access.

-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEED DATA — Demo Organisation
-- ============================================================

-- Passwords are all: Password123!
-- Hash generated with bcrypt(12 rounds)
-- $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxnM1i9i

INSERT INTO employees (id, name, email, password_hash, role, manager_id, department) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sarah Chen',    'sarah.chen@auralytics.io',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxnM1i9i', 'hr',              NULL,                                 'Human Resources'),
  ('00000000-0000-0000-0000-000000000002', 'Marcus Tan',    'marcus.tan@auralytics.io',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxnM1i9i', 'manager',         NULL,                                 'Design'),
  ('00000000-0000-0000-0000-000000000003', 'Priya Nair',    'priya.nair@auralytics.io',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxnM1i9i', 'recruiter',       '00000000-0000-0000-0000-000000000001','Human Resources'),
  ('00000000-0000-0000-0000-000000000004', 'Jordan Lee',    'jordan.lee@auralytics.io',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxnM1i9i', 'senior_designer', '00000000-0000-0000-0000-000000000002','Design'),
  ('00000000-0000-0000-0000-000000000005', 'Aisha Malik',   'aisha.malik@auralytics.io',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxnM1i9i', 'designer',        '00000000-0000-0000-0000-000000000002','Design'),
  ('00000000-0000-0000-0000-000000000006', 'Wei Zong',      'wei.zong@auralytics.io',      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxnM1i9i', 'designer',        '00000000-0000-0000-0000-000000000004','Design');

INSERT INTO projects (id, name, description, budget, status, created_by) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Brand Refresh 2025',       'Complete brand identity overhaul',         150000, 'active',    '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Mobile App Redesign',      'Redesign of the mobile UX/UI',             220000, 'active',    '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003', 'Design System v3',         'Component library and design tokens',       80000, 'completed', '00000000-0000-0000-0000-000000000001');

INSERT INTO project_assignments (project_id, employee_id) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006');

INSERT INTO tasks (id, title, description, assigned_to, assigned_by, status, priority, due_date, project_id) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Design hero section',       'Create hero section mockups',              '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'in_progress', 'high',   NOW() + INTERVAL '7 days',  '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Create icon set',           'Design 40 custom icons',                   '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004', 'todo',        'medium', NOW() + INTERVAL '14 days', '10000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000003', 'Color palette finalization','Approve final brand colors',               '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'review',      'high',   NOW() + INTERVAL '3 days',  '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', 'Typography documentation', 'Document font usage guidelines',           '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'done',        'low',    NOW() - INTERVAL '2 days',  '10000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000005', 'Onboarding flow screens',  'Design 12-screen onboarding flow',         '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'in_progress', 'high',   NOW() + INTERVAL '5 days',  '10000000-0000-0000-0000-000000000002');

INSERT INTO kra (id, employee_id, title, description, status, assigned_by, target_date) VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Deliver design system v3', 'Complete all components for design system', 'approved',  '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '10 days'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'Brand refresh completion', 'Complete all brand refresh deliverables',   'submitted', '00000000-0000-0000-0000-000000000002', NOW() + INTERVAL '20 days'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006', 'Mobile app UX delivery',  '12 screen designs approved by manager',     'pending',   '00000000-0000-0000-0000-000000000004', NOW() + INTERVAL '30 days'),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'Q1 hiring targets',       'Source and onboard 5 new designers',        'approved',  '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days');

INSERT INTO revenue (project_id, amount, month, year, notes) VALUES
  ('10000000-0000-0000-0000-000000000001', 35000, 1, 2025, 'Phase 1 milestone'),
  ('10000000-0000-0000-0000-000000000001', 42000, 2, 2025, 'Phase 2 delivery'),
  ('10000000-0000-0000-0000-000000000001', 28000, 3, 2025, 'Revisions round'),
  ('10000000-0000-0000-0000-000000000002', 55000, 1, 2025, 'Design sprint 1'),
  ('10000000-0000-0000-0000-000000000002', 60000, 2, 2025, 'Design sprint 2'),
  ('10000000-0000-0000-0000-000000000002', 48000, 3, 2025, 'Testing phase'),
  ('10000000-0000-0000-0000-000000000003', 80000, 12, 2024, 'Project completion');
