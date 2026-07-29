/*
# Office Management System — schema + seed data

## Overview
Creates a complete single-tenant Office Management System schema covering
departments, employees, projects, tasks, attendance and meetings, plus
realistic seed data so the application looks populated on first load.

## 1. New Tables
- `departments` — org units (Engineering, HR, Marketing, Sales, Finance).
  Columns: id, name (unique), description, head_name, budget, created_at.
- `employees` — staff records. Columns: id, name, email (unique), phone,
  position, department_id (FK departments), avatar_url, status, hire_date,
  salary, created_at.
- `projects` — company initiatives. Columns: id, name (unique), description,
  department_id (FK departments), status, priority, start_date, due_date,
  progress (0-100), created_at.
- `tasks` — work items tied to a project and an assignee. Columns: id, title,
  description, project_id (FK projects), assignee_id (FK employees), status,
  priority, due_date, created_at.
- `attendance` — daily check-in records. Columns: id, employee_id (FK),
  work_date, check_in (time), check_out (time), status. Unique on
  (employee_id, work_date) so seed re-runs are idempotent.
- `meetings` — scheduled meetings. Columns: id, title, agenda, meeting_date,
  start_time, duration_minutes, location, attendees (text[]), created_at.

## 2. Relationships
- employees.department_id -> departments.id (ON DELETE SET NULL)
- projects.department_id  -> departments.id (ON DELETE SET NULL)
- tasks.project_id        -> projects.id  (ON DELETE CASCADE)
- tasks.assignee_id       -> employees.id (ON DELETE SET NULL)
- attendance.employee_id  -> employees.id (ON DELETE CASCADE)

## 3. Security (single-tenant, no sign-in screen)
- RLS enabled on every table.
- Policies use TO anon, authenticated with USING (true) / WITH CHECK (true)
  because the data is intentionally shared/public for this no-auth demo app.

## 4. Seed Data
- 5 departments, 10 employees, 4 projects, 8 tasks, ~50 attendance rows
  (last ~6 working days for every employee), 4 meetings.
- All seed inserts are idempotent (ON CONFLICT DO NOTHING) so re-applying the
  migration never duplicates rows.
*/

-- =========================================================
-- DEPARTMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  head_name text,
  budget numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS departments_name_key ON departments (name);

DROP POLICY IF EXISTS "anon_select_departments" ON departments;
CREATE POLICY "anon_select_departments" ON departments FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_departments" ON departments;
CREATE POLICY "anon_insert_departments" ON departments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_departments" ON departments;
CREATE POLICY "anon_update_departments" ON departments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_departments" ON departments;
CREATE POLICY "anon_delete_departments" ON departments FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- EMPLOYEES
-- =========================================================
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  position text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  avatar_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','on-leave')),
  hire_date date,
  salary numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS employees_email_key ON employees (email);

DROP POLICY IF EXISTS "anon_select_employees" ON employees;
CREATE POLICY "anon_select_employees" ON employees FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_employees" ON employees;
CREATE POLICY "anon_insert_employees" ON employees FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_employees" ON employees;
CREATE POLICY "anon_update_employees" ON employees FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_employees" ON employees;
CREATE POLICY "anon_delete_employees" ON employees FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- PROJECTS
-- =========================================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','on-hold','completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  start_date date,
  due_date date,
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS projects_name_key ON projects (name);

DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- TASKS
-- =========================================================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in-progress','review','done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- ATTENDANCE
-- =========================================================
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  check_in time,
  check_out time,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','remote')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_emp_date_key
  ON attendance (employee_id, work_date);

DROP POLICY IF EXISTS "anon_select_attendance" ON attendance;
CREATE POLICY "anon_select_attendance" ON attendance FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_attendance" ON attendance;
CREATE POLICY "anon_insert_attendance" ON attendance FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_attendance" ON attendance;
CREATE POLICY "anon_update_attendance" ON attendance FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_attendance" ON attendance;
CREATE POLICY "anon_delete_attendance" ON attendance FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- MEETINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  agenda text,
  meeting_date date NOT NULL,
  start_time time NOT NULL DEFAULT '09:00:00',
  duration_minutes integer NOT NULL DEFAULT 30,
  location text,
  attendees text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_meetings" ON meetings;
CREATE POLICY "anon_select_meetings" ON meetings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_meetings" ON meetings;
CREATE POLICY "anon_insert_meetings" ON meetings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_meetings" ON meetings;
CREATE POLICY "anon_update_meetings" ON meetings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_meetings" ON meetings;
CREATE POLICY "anon_delete_meetings" ON meetings FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- SEED DATA (idempotent)
-- =========================================================

-- Departments
INSERT INTO departments (id, name, description, head_name, budget) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Engineering',  'Builds and maintains all software products and internal tooling.', 'Marcus Johnson',  1850000),
  ('11111111-1111-1111-1111-111111111102', 'Human Resources', 'Manages hiring, onboarding, culture and employee wellbeing.', 'Emily Rodriguez', 420000),
  ('11111111-1111-1111-1111-111111111103', 'Marketing',    'Drives brand, demand generation and product marketing.', 'Ava Thompson',    680000),
  ('11111111-1111-1111-1111-111111111104', 'Sales',        'Owns pipeline, deals and revenue growth across regions.', 'Olivia Williams', 950000),
  ('11111111-1111-1111-1111-111111111105', 'Finance',      'Handles budgeting, forecasting and financial reporting.', 'James Patel',     510000)
ON CONFLICT (name) DO NOTHING;

-- Employees
INSERT INTO employees (id, name, email, phone, position, department_id, avatar_url, status, hire_date, salary) VALUES
  ('22222222-2222-2222-2222-222222222201','Sarah Chen','sarah.chen@office.co','+1 415 555 0101','Senior Software Engineer','11111111-1111-1111-1111-111111111101','https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=256','active','2021-03-15',128000),
  ('22222222-2222-2222-2222-222222222202','Marcus Johnson','marcus.johnson@office.co','+1 415 555 0102','Engineering Lead','11111111-1111-1111-1111-111111111101','https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=256','active','2019-08-01',165000),
  ('22222222-2222-2222-2222-222222222203','Emily Rodriguez','emily.rodriguez@office.co','+1 415 555 0103','HR Manager','11111111-1111-1111-1111-111111111102','https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=256','active','2020-01-20',92000),
  ('22222222-2222-2222-2222-222222222204','David Kim','david.kim@office.co','+1 415 555 0104','Marketing Specialist','11111111-1111-1111-1111-111111111103','https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=256','active','2022-06-10',78000),
  ('22222222-2222-2222-2222-222222222205','Olivia Williams','olivia.williams@office.co','+1 415 555 0105','Sales Executive','11111111-1111-1111-1111-111111111104','https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=256','active','2020-11-05',105000),
  ('22222222-2222-2222-2222-222222222206','James Patel','james.patel@office.co','+1 415 555 0106','Financial Analyst','11111111-1111-1111-1111-111111111105','https://images.pexels.com/photos/2379009/pexels-photo-2379009.jpeg?auto=compress&cs=tinysrgb&w=256','active','2021-09-12',88000),
  ('22222222-2222-2222-2222-222222222207','Sophia Martinez','sophia.martinez@office.co','+1 415 555 0107','UX Designer','11111111-1111-1111-1111-111111111101','https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=256','active','2022-02-28',96000),
  ('22222222-2222-2222-2222-222222222208','Michael Brown','michael.brown@office.co','+1 415 555 0108','Account Manager','11111111-1111-1111-1111-111111111104','https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=256','on-leave','2018-04-03',99000),
  ('22222222-2222-2222-2222-222222222209','Ava Thompson','ava.thompson@office.co','+1 415 555 0109','Content Strategist','11111111-1111-1111-1111-111111111103','https://images.pexels.com/photos/3823488/pexels-photo-3823488.jpeg?auto=compress&cs=tinysrgb&w=256','active','2023-01-09',72000),
  ('22222222-2222-2222-2222-222222222210','Ryan Garcia','ryan.garcia@office.co','+1 415 555 0110','DevOps Engineer','11111111-1111-1111-1111-111111111101','https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=256','inactive','2021-05-22',118000)
ON CONFLICT (email) DO NOTHING;

-- Projects
INSERT INTO projects (id, name, description, department_id, status, priority, start_date, due_date, progress) VALUES
  ('33333333-3333-3333-3333-333333333301','Customer Portal Redesign','Complete overhaul of the customer self-service portal with new design system and faster workflows.','11111111-1111-1111-1111-111111111101','active','high',(CURRENT_DATE - INTERVAL '45 days')::date,(CURRENT_DATE + INTERVAL '30 days')::date,62),
  ('33333333-3333-3333-3333-333333333302','Q4 Marketing Campaign','Multi-channel holiday campaign spanning email, social and paid search.','11111111-1111-1111-1111-111111111103','planning','medium',(CURRENT_DATE + INTERVAL '7 days')::date,(CURRENT_DATE + INTERVAL '75 days')::date,15),
  ('33333333-3333-3333-3333-333333333303','Sales CRM Integration','Connect the legacy CRM with the new billing platform and reporting warehouse.','11111111-1111-1111-1111-111111111104','active','high',(CURRENT_DATE - INTERVAL '20 days')::date,(CURRENT_DATE + INTERVAL '40 days')::date,38),
  ('33333333-3333-3333-3333-333333333304','Internal HR Platform','Self-service HR tooling for time-off, reviews and onboarding checklists.','11111111-1111-1111-1111-111111111102','on-hold','low',(CURRENT_DATE - INTERVAL '90 days')::date,(CURRENT_DATE + INTERVAL '120 days')::date,20)
ON CONFLICT (name) DO NOTHING;

-- Tasks
INSERT INTO tasks (id, title, description, project_id, assignee_id, status, priority, due_date) VALUES
  ('44444444-4444-4444-4444-444444444401','Design new portal header','Create high-fidelity mockups for the global navigation and header.',           '33333333-3333-3333-3333-333333333301','22222222-2222-2222-2222-222222222207','done','medium',(CURRENT_DATE - INTERVAL '10 days')::date),
  ('44444444-4444-4444-4444-444444444402','Build auth API endpoints','Implement JWT login, refresh and session validation for the portal.',          '33333333-3333-3333-3333-333333333301','22222222-2222-2222-2222-222222222201','in-progress','high',(CURRENT_DATE + INTERVAL '5 days')::date),
  ('44444444-4444-4444-4444-444444444403','Set up CI/CD pipeline','Containerize services and configure automated deployments.',                     '33333333-3333-3333-3333-333333333301','22222222-2222-2222-2222-222222222210','todo','medium',(CURRENT_DATE + INTERVAL '14 days')::date),
  ('44444444-4444-4444-4444-444444444404','Campaign landing page copy','Write headline, sub-headline and CTA copy for the Q4 landing page.',         '33333333-3333-3333-3333-333333333302','22222222-2222-2222-2222-222222222209','in-progress','medium',(CURRENT_DATE + INTERVAL '4 days')::date),
  ('44444444-4444-4444-4444-444444444405','Email sequence design','Design the 5-email nurture sequence templates.',                                '33333333-3333-3333-3333-333333333302','22222222-2222-2222-2222-222222222204','todo','low',(CURRENT_DATE + INTERVAL '12 days')::date),
  ('44444444-4444-4444-4444-444444444406','Map legacy CRM fields','Audit and map every field from the legacy CRM to the new schema.',             '33333333-3333-3333-3333-333333333303','22222222-2222-2222-2222-222222222205','review','high',(CURRENT_DATE + INTERVAL '2 days')::date),
  ('44444444-4444-4444-4444-444444444407','Billing webhook handler','Build webhook listeners for subscription and invoice events.',               '33333333-3333-3333-3333-333333333303','22222222-2222-2222-2222-222222222201','todo','high',(CURRENT_DATE + INTERVAL '9 days')::date),
  ('44444444-4444-4444-4444-444444444408','Onboarding checklist flow','Implement the new-hire onboarding checklist UI and persistence.',          '33333333-3333-3333-3333-333333333304','22222222-2222-2222-2222-222222222203','todo','low',(CURRENT_DATE + INTERVAL '30 days')::date)
ON CONFLICT (id) DO NOTHING;

-- Attendance (last ~6 working days for every employee, idempotent via unique (employee_id, work_date))
INSERT INTO attendance (employee_id, work_date, check_in, check_out, status)
SELECT
  e.id,
  gs.d,
  CASE WHEN lr.r < 0.10 THEN '09:42:00'::time WHEN lr.r < 0.18 THEN '09:05:00'::time ELSE '09:00:00'::time END,
  CASE WHEN lr.r < 0.05 THEN '16:45:00'::time ELSE '17:30:00'::time END,
  CASE WHEN lr.r < 0.10 THEN 'late' WHEN lr.r < 0.18 THEN 'remote' ELSE 'present' END
FROM employees e
CROSS JOIN generate_series(
  (CURRENT_DATE - INTERVAL '6 days')::date,
  CURRENT_DATE::date,
  INTERVAL '1 day'
) AS gs(d)
CROSS JOIN LATERAL (SELECT random() AS r) lr
WHERE EXTRACT(dow FROM gs.d) NOT IN (0, 6)
ON CONFLICT (employee_id, work_date) DO NOTHING;

-- Meetings
INSERT INTO meetings (id, title, agenda, meeting_date, start_time, duration_minutes, location, attendees) VALUES
  ('55555555-5555-5555-5555-555555555501','Weekly Engineering Standup','Sprint progress, blockers and upcoming releases.', (CURRENT_DATE)::date, '09:30:00', 30, 'Room A — 2nd Floor', ARRAY['Marcus Johnson','Sarah Chen','Sophia Martinez','Ryan Garcia']),
  ('55555555-5555-5555-5555-555555555502','Q4 Campaign Kickoff','Align marketing, sales and finance on the holiday campaign plan.', (CURRENT_DATE + INTERVAL '2 days')::date, '14:00:00', 60, 'Main Conference Room', ARRAY['Ava Thompson','David Kim','Olivia Williams','James Patel']),
  ('55555555-5555-5555-5555-555555555503','Sprint Review','Demo completed work from the last sprint and gather feedback.', (CURRENT_DATE + INTERVAL '1 day')::date, '11:00:00', 45, 'Room A — 2nd Floor', ARRAY['Marcus Johnson','Sarah Chen','Sophia Martinez']),
  ('55555555-5555-5555-5555-555555555504','Budget Planning Session','Review department budgets and forecast for next quarter.', (CURRENT_DATE + INTERVAL '4 days')::date, '10:00:00', 90, 'Executive Boardroom', ARRAY['James Patel','Emily Rodriguez','Marcus Johnson'])
ON CONFLICT (id) DO NOTHING;
