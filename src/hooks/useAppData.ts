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
  Profile,
  Post,
  Conversation,
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
  profiles: Profile[];
  posts: Post[];
  conversations: Conversation[];
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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [
        deptRes, empRes, projRes, taskRes, meetRes, attRes, txnRes, auditRes,
        profileRes, postRes, convRes,
      ] = await Promise.all([
        supabase.from('departments').select('*').order('name'),
        supabase.from('employees').select('*, department:departments(*)').order('name'),
        supabase.from('projects').select('*, department:departments(*)').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*, assignee:employees(*), project:projects(*)').order('created_at', { ascending: false }),
        supabase.from('meetings').select('*').order('meeting_date', { ascending: true }),
        supabase.from('attendance').select('*, employee:employees(*)').order('work_date', { ascending: false }),
        supabase.from('salary_transactions').select('*, employee:employees(*)').order('payment_date', { ascending: false }),
        supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('*, employee:employees(*)'),
        supabase.from('posts').select('*, author:employees(*), likes:post_likes(*, employee:employees(*)), comments:post_comments(*, author:employees(*))').order('created_at', { ascending: false }),
        supabase.from('conversations').select('*, members:conversation_members(*, employee:employees(*)), messages:messages(*, sender:employees(*))').order('created_at', { ascending: false }),
      ]);

      const err = deptRes.error || empRes.error || projRes.error || taskRes.error || meetRes.error || attRes.error || txnRes.error || auditRes.error || profileRes.error || postRes.error || convRes.error;
      if (err) throw err;

      setDepartments(deptRes.data ?? []);
      setEmployees(empRes.data ?? []);
      setProjects(projRes.data ?? []);
      setTasks(taskRes.data ?? []);
      setMeetings(meetRes.data ?? []);
      setAttendance(attRes.data ?? []);
      setTransactions(txnRes.data ?? []);
      setAuditLog(auditRes.data ?? []);
      setProfiles(profileRes.data ?? []);
      setPosts(postRes.data ?? []);
      setConversations(convRes.data ?? []);
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

  return {
    departments, employees, projects, tasks, meetings, attendance, transactions,
    auditLog, profiles, posts, conversations, loading, error, refresh, lastUpdated,
  };
}
