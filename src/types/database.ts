export type EmployeeStatus = 'active' | 'inactive' | 'on-leave';
export type EmployeeRole = 'admin' | 'manager' | 'lead' | 'member' | 'viewer';
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed';
export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'remote';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_name: string | null;
  budget: number | null;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  department_id: string | null;
  avatar_url: string | null;
  status: EmployeeStatus;
  role: EmployeeRole;
  hire_date: string | null;
  salary: number | null;
  created_at: string;
  // joined fields
  department?: Department | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  department_id: string | null;
  status: ProjectStatus;
  priority: Priority;
  start_date: string | null;
  due_date: string | null;
  progress: number;
  created_at: string;
  // joined fields
  department?: Department | null;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  assignee_id: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  // joined fields
  assignee?: Employee | null;
  project?: Project | null;
}

export interface Attendance {
  id: string;
  employee_id: string;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  created_at: string;
  // joined fields
  employee?: Employee | null;
}

export interface Meeting {
  id: string;
  title: string;
  agenda: string | null;
  meeting_date: string;
  start_time: string;
  duration_minutes: number;
  location: string | null;
  attendees: string[];
  created_at: string;
}

export type DepartmentInput = Pick<Department, 'name' | 'description' | 'head_name' | 'budget'>;
export type EmployeeInput = Omit<Employee, 'id' | 'created_at' | 'department'> & { role: EmployeeRole };
export type ProjectInput = Omit<Project, 'id' | 'created_at' | 'department' | 'tasks'>;
export type TaskInput = Omit<Task, 'id' | 'created_at' | 'assignee' | 'project'>;
export type MeetingInput = Omit<Meeting, 'id' | 'created_at'>;
export type AttendanceInput = Omit<Attendance, 'id' | 'created_at' | 'employee'>;

export type TransactionType = 'salary' | 'bonus' | 'deduction' | 'reimbursement';
export type TransactionStatus = 'pending' | 'paid' | 'failed';

export interface SalaryTransaction {
  id: string;
  employee_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  payment_date: string;
  status: TransactionStatus;
  created_at: string;
  // joined fields
  employee?: Employee | null;
}

export type SalaryTransactionInput = Omit<SalaryTransaction, 'id' | 'created_at' | 'employee'>;

export interface AuditLogEntry {
  id: string;
  action: string;
  target_entity: string | null;
  target_id: string | null;
  description: string | null;
  created_at: string;
}

/* ── Social platform ── */

export interface Profile {
  id: string;
  employee_id: string;
  cover_url: string | null;
  bio: string | null;
  location: string | null;
  timezone: string | null;
  website: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  skills: string[];
  resume_url: string | null;
  role: string;
  updated_at: string;
  // joined
  employee?: Employee | null;
}

export type ProfileInput = Omit<Profile, 'id' | 'employee_id' | 'updated_at' | 'employee'>;

export interface PostLike {
  id: string;
  post_id: string;
  employee_id: string;
  created_at: string;
  // joined
  employee?: Employee | null;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  // joined
  author?: Employee | null;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  visibility: 'public' | 'internal';
  created_at: string;
  // joined
  author?: Employee | null;
  likes?: PostLike[];
  comments?: PostComment[];
}

export type PostInput = Pick<Post, 'author_id' | 'content' | 'image_url' | 'visibility'>;

export interface ConversationMember {
  id: string;
  conversation_id: string;
  employee_id: string;
  last_read_at: string;
  employee?: Employee | null;
}

export interface Conversation {
  id: string;
  created_at: string;
  members?: ConversationMember[];
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
  sender?: Employee | null;
}
