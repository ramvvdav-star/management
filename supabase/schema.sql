-- ==============================================================================
-- eSecurityIn – Project & Task Progress Management Database Schema
-- Paste and Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Employees Table (Initial 4 Core Staff: Hardik, Abhishek, Kaushik, Himanshu)
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department_id VARCHAR(50) REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(120) NOT NULL,
    profile_image TEXT,
    joining_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    role VARCHAR(20) NOT NULL DEFAULT 'Employee' CHECK (role IN ('Manager', 'Employee')),
    access_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    department_id VARCHAR(50) REFERENCES departments(id) ON DELETE SET NULL,
    assigned_employee_ids TEXT[] DEFAULT '{}',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'In Progress' CHECK (status IN ('Planning', 'Not Started', 'In Progress', 'On Hold', 'Completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    deadline DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Blocked', 'Completed')),
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    time_spent NUMERIC(6, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Task Progress Updates
CREATE TABLE IF NOT EXISTS task_progress_updates (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    employee_name VARCHAR(120) NOT NULL,
    previous_progress INT NOT NULL,
    new_progress INT NOT NULL,
    work_completed TEXT NOT NULL,
    work_remaining TEXT,
    challenges TEXT,
    next_steps TEXT,
    time_spent NUMERIC(5, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Task Comments
CREATE TABLE IF NOT EXISTS task_comments (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    employee_name VARCHAR(120) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Project Activity
CREATE TABLE IF NOT EXISTS project_activity (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    actor_name VARCHAR(120) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_projects_dept ON projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_progress_updates_task ON task_progress_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_project ON project_activity(project_id);

-- ==============================================================================
-- INITIAL SEED DATA (Departments + Initial 4 Core Staff)
-- ==============================================================================

-- Seed Initial Departments
INSERT INTO departments (id, name, code, description) VALUES
('dept-cyber', 'Cybersecurity', 'CYBER', 'Threat Intelligence, Vulnerability Assessment, PenTesting, SOC Operations'),
('dept-dev', 'Development', 'DEV', 'Core Product Engineering, Microservices Architecture, Secure APIs'),
('dept-ops', 'Operations & DevSecOps', 'OPS', 'Cloud Infrastructure Hardening, CI/CD Pipelines, Kubernetes, SRE'),
('dept-rd', 'Research & Labs', 'RD', 'Cryptographic Algorithms, Zero-Day Research, AI Security Models')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial 4 Core Staff Members
INSERT INTO employees (id, name, employee_id, department_id, designation, joining_date, status, role, access_key) VALUES
('emp-hardik', 'Hardik', 'ESI-1001', 'dept-cyber', 'Lead Cybersecurity Architect & Delivery Head', '2025-01-15', 'Active', 'Manager', '1001'),
('emp-abhishek', 'Abhishek', 'ESI-1002', 'dept-cyber', 'Senior Security Systems & Infrastructure Manager', '2025-02-01', 'Active', 'Manager', '1002'),
('emp-kaushik', 'Kaushik', 'ESI-1003', 'dept-dev', 'Full-Stack Security Software Engineer', '2025-03-10', 'Active', 'Employee', '1003'),
('emp-himanshu', 'Himanshu', 'ESI-1004', 'dept-ops', 'DevSecOps & Platform Automation Engineer', '2025-03-15', 'Active', 'Employee', '1004')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) with Public Open Policies for eSecurityIn Platform
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity ENABLE ROW LEVEL SECURITY;

-- Drop prior policies if running repeatedly
DROP POLICY IF EXISTS "Public access departments" ON departments;
DROP POLICY IF EXISTS "Public access employees" ON employees;
DROP POLICY IF EXISTS "Public access projects" ON projects;
DROP POLICY IF EXISTS "Public access tasks" ON tasks;
DROP POLICY IF EXISTS "Public access updates" ON task_progress_updates;
DROP POLICY IF EXISTS "Public access comments" ON task_comments;
DROP POLICY IF EXISTS "Public access activity" ON project_activity;

-- Full CRUD Access Policies for eSecurityIn Platform (No user auth gate)
CREATE POLICY "Public access departments" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access employees" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access updates" ON task_progress_updates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access comments" ON task_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access activity" ON project_activity FOR ALL USING (true) WITH CHECK (true);
