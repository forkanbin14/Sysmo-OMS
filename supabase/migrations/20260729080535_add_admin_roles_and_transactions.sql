/*
# Add employee roles, salary transactions, and audit log

## Overview
Extends the Office Management schema to support an Admin Panel:
- Adds a `role` column to `employees` (admin, manager, employee, viewer).
- Creates a `salary_transactions` table to record payments, bonuses, deductions.
- Creates an `admin_audit_log` table to track admin actions.
- Seeds default roles for existing employees and a few sample transactions.

## 1. Modified Tables
- `employees` — adds `role` text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','manager','employee','viewer')).

## 2. New Tables
- `salary_transactions`
  - id (uuid PK)
  - employee_id (uuid FK -> employees ON DELETE CASCADE)
  - type (text: 'salary','bonus','deduction','reimbursement')
  - amount (numeric 12,2, NOT NULL)
  - description (text)
  - payment_date (date, NOT NULL)
  - status (text: 'pending','paid','failed', default 'pending')
  - created_at (timestamptz)
  - joined field: employee via FK

- `admin_audit_log`
  - id (uuid PK)
  - action (text: e.g. 'role_changed','employee_deleted','salary_paid')
  - target_entity (text: e.g. 'employee')
  - target_id (uuid, nullable)
  - description (text)
  - created_at (timestamptz)

## 3. Security (single-tenant, no sign-in)
- RLS enabled on both new tables.
- Policies use TO anon, authenticated with USING (true) / WITH CHECK (true)
  because the data is intentionally shared/public for this no-auth demo app.

## 4. Seed Data
- Assigns 'admin' to Sarah Chen, 'manager' to Marcus Johnson and Emily Rodriguez.
- Inserts 4 sample salary transactions for demonstration.
*/

-- =========================================================
-- ADD ROLE COLUMN TO EMPLOYEES
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'role'
  ) THEN
    ALTER TABLE employees
      ADD COLUMN role text NOT NULL DEFAULT 'employee'
      CHECK (role IN ('admin','manager','employee','viewer'));
  END IF;
END $$;

-- Assign seed roles (idempotent — only sets for the admin user who doesn't have one yet)
UPDATE employees SET role = 'admin'   WHERE email = 'sarah.chen@office.co'   AND role = 'employee';
UPDATE employees SET role = 'manager' WHERE email = 'marcus.johnson@office.co' AND role = 'employee';
UPDATE employees SET role = 'manager' WHERE email = 'emily.rodriguez@office.co' AND role = 'employee';

-- =========================================================
-- SALARY TRANSACTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS salary_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('salary','bonus','deduction','reimbursement')),
  amount numeric(12,2) NOT NULL,
  description text,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE salary_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS salary_txn_employee_idx ON salary_transactions (employee_id);
CREATE INDEX IF NOT EXISTS salary_txn_date_idx ON salary_transactions (payment_date);

DROP POLICY IF EXISTS "anon_select_salary_transactions" ON salary_transactions;
CREATE POLICY "anon_select_salary_transactions" ON salary_transactions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_salary_transactions" ON salary_transactions;
CREATE POLICY "anon_insert_salary_transactions" ON salary_transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_salary_transactions" ON salary_transactions;
CREATE POLICY "anon_update_salary_transactions" ON salary_transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_salary_transactions" ON salary_transactions;
CREATE POLICY "anon_delete_salary_transactions" ON salary_transactions FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- ADMIN AUDIT LOG
-- =========================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_entity text,
  target_id uuid,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS audit_log_created_idx ON admin_audit_log (created_at);

DROP POLICY IF EXISTS "anon_select_audit_log" ON admin_audit_log;
CREATE POLICY "anon_select_audit_log" ON admin_audit_log FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_audit_log" ON admin_audit_log;
CREATE POLICY "anon_insert_audit_log" ON admin_audit_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_audit_log" ON admin_audit_log;
CREATE POLICY "anon_update_audit_log" ON admin_audit_log FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_audit_log" ON admin_audit_log;
CREATE POLICY "anon_delete_audit_log" ON admin_audit_log FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- SEED TRANSACTIONS (idempotent — only for existing employees)
-- =========================================================
INSERT INTO salary_transactions (employee_id, type, amount, description, payment_date, status)
SELECT e.id, 'salary', e.salary, 'Monthly salary payment', (CURRENT_DATE - INTERVAL '25 days')::date, 'paid'
FROM employees e
WHERE e.salary > 0 AND e.status = 'active'
ON CONFLICT DO NOTHING;

INSERT INTO salary_transactions (employee_id, type, amount, description, payment_date, status)
SELECT e.id, 'bonus', 5000, 'Q3 performance bonus', (CURRENT_DATE - INTERVAL '10 days')::date, 'paid'
FROM employees e
WHERE e.email IN ('sarah.chen@office.co','marcus.johnson@office.co')
ON CONFLICT DO NOTHING;

INSERT INTO salary_transactions (employee_id, type, amount, description, payment_date, status)
SELECT e.id, 'reimbursement', 350, 'Travel reimbursement — client visit', (CURRENT_DATE - INTERVAL '5 days')::date, 'pending'
FROM employees e
WHERE e.email = 'olivia.williams@office.co'
ON CONFLICT DO NOTHING;

INSERT INTO salary_transactions (employee_id, type, amount, description, payment_date, status)
SELECT e.id, 'deduction', 200, 'Late penalty — 3 days', (CURRENT_DATE - INTERVAL '3 days')::date, 'paid'
FROM employees e
WHERE e.email = 'michael.brown@office.co'
ON CONFLICT DO NOTHING;
