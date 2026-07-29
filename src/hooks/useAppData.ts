import { useEffect, useState, useCallback } from 'react';
import type {
  Department,
  Employee,
  Project,
  Task,
  Meeting,
  Attendance,
  SalaryTransaction,
  AuditLogEntry,
} from '@/types/database';
import { supabase } from '@/lib/supabase';

export interface AppData {
  departments: Department[];
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  meetings: Meeting[];
  attendance: Attendance[];
  transactions: SalaryTransaction[];
  auditLog: AuditLogEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: number;
}

export function useAppData(): AppData {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [transactions, setTransactions] = useState<SalaryTransaction[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [deptRes, empRes, projRes, taskRes, meetRes, attRes, txnRes, auditRes] = await Promise.all([
        supabase.from('departments').select('*').order('name'),
        supabase.from('employees').select('*, department:departments(*)').order('name'),
        supabase.from('projects').select('*, department:departments(*)').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*, assignee:employees(*), project:projects(*)').order('created_at', { ascending: false }),
        supabase.from('meetings').select('*').order('meeting_date', { ascending: true }),
        supabase.from('attendance').select('*, employee:employees(*)').order('work_date', { ascending: false }),
        supabase.from('salary_transactions').select('*, employee:employees(*)').order('payment_date', { ascending: false }),
        supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      const err = deptRes.error || empRes.error || projRes.error || taskRes.error || meetRes.error || attRes.error || txnRes.error || auditRes.error;
      if (err) throw err;

      setDepartments(deptRes.data ?? []);
      setEmployees(empRes.data ?? []);
      setProjects(projRes.data ?? []);
      setTasks(taskRes.data ?? []);
      setMeetings(meetRes.data ?? []);
      setAttendance(attRes.data ?? []);
      setTransactions(txnRes.data ?? []);
      setAuditLog(auditRes.data ?? []);
      setLastUpdated(Date.now());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { departments, employees, projects, tasks, meetings, attendance, transactions, auditLog, loading, error, refresh, lastUpdated };
}
