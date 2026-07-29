export type EmployeeStatus = 'active' | 'inactive' | 'on-leave';
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
export type EmployeeInput = Omit<Employee, 'id' | 'created_at' | 'department'>;
export type ProjectInput = Omit<Project, 'id' | 'created_at' | 'department' | 'tasks'>;
export type TaskInput = Omit<Task, 'id' | 'created_at' | 'assignee' | 'project'>;
export type MeetingInput = Omit<Meeting, 'id' | 'created_at'>;
export type AttendanceInput = Omit<Attendance, 'id' | 'created_at' | 'employee'>;
