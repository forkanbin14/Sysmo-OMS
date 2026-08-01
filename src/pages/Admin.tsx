import { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  Users,
  UserPlus,
  Building2,
  FolderKanban,
  CheckSquare,
  CalendarCheck,
  CalendarClock,
  Clock,
  UserCog,
  Crown,
  ArrowRight,
  ArrowUpDown,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  Database,
  Settings,
  Activity,
  Layers,
  Lock,
  Eye,
  UserCheck,
  Star,
  X,
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Palette,
  Type,
  Sparkles,
  Check,
  Monitor,
} from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { Employee, EmployeeRole, EmployeeStatus, EmployeeInput } from '@/types/database';
import type { PageKey } from '@/components/layout/Sidebar';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Field, Input, Select } from '@/components/ui/Input';
import { IconBadge } from '@/components/ui/IconBadge';
import { cn, formatCurrency, sortBy } from '@/lib/utils';
import { THEME_PRESETS, FONT_OPTIONS, ICON_SETS } from '@/lib/themes';

/* ============================================================
   Role definitions
   ============================================================ */
const ROLE_META: Record<EmployeeRole, { label: string; icon: typeof Crown; tone: 'danger' | 'brand' | 'accent' | 'neutral' | 'success'; desc: string; color: string }> = {
  admin:   { label: 'Admin',    icon: Crown,       tone: 'danger',  desc: 'Full system access — manage everything including roles and settings.', color: 'bg-danger-500/15 text-danger-400 ring-danger-500/25' },
  manager: { label: 'Manager',  icon: UserCog,     tone: 'brand',   desc: 'Department-level control — manages employees, projects and reports.',  color: 'bg-brand-500/15 text-brand-400 ring-brand-500/25' },
  lead:    { label: 'Lead',     icon: Star,        tone: 'accent',  desc: 'Team lead — assigns tasks, reviews work and guides the team.',         color: 'bg-accent-500/15 text-accent-400 ring-accent-500/25' },
  member:  { label: 'Member',   icon: UserCheck,   tone: 'success', desc: 'Standard employee — works on assigned tasks and projects.',           color: 'bg-success-500/15 text-success-400 ring-success-500/25' },
  viewer:  { label: 'Viewer',   icon: Eye,         tone: 'neutral', desc: 'Read-only access — can view data but cannot make changes.',           color: 'bg-ink-700/40 text-ink-300 ring-ink-600/50' },
};

const ROLE_ORDER: EmployeeRole[] = ['admin', 'manager', 'lead', 'member', 'viewer'];

const PERMISSIONS: { label: string; roles: EmployeeRole[] }[] = [
  { label: 'View dashboard & reports',  roles: ['admin', 'manager', 'lead', 'member', 'viewer'] },
  { label: 'Add / edit employees',      roles: ['admin', 'manager'] },
  { label: 'Change employee roles',     roles: ['admin'] },
  { label: 'Change employee status',    roles: ['admin', 'manager'] },
  { label: 'Create / edit departments', roles: ['admin'] },
  { label: 'Create / edit projects',    roles: ['admin', 'manager', 'lead'] },
  { label: 'Create / edit tasks',       roles: ['admin', 'manager', 'lead', 'member'] },
  { label: 'Delete records',            roles: ['admin'] },
  { label: 'Manage meetings',           roles: ['admin', 'manager', 'lead'] },
  { label: 'View attendance',           roles: ['admin', 'manager', 'lead', 'member', 'viewer'] },
  { label: 'Mark attendance',           roles: ['admin', 'manager', 'lead', 'member'] },
  { label: 'Access admin panel',        roles: ['admin'] },
];

type Tab = 'overview' | 'employees' | 'accounts' | 'roles' | 'transactions' | 'appearance' | 'system';

const tabs: { key: Tab; label: string; icon: typeof Activity }[] = [
  { key: 'overview',     label: 'Overview',     icon: Activity },
  { key: 'employees',    label: 'Employees',    icon: Users },
  { key: 'accounts',     label: 'Accounts',     icon: UserPlus },
  { key: 'roles',        label: 'Roles',        icon: Shield },
  { key: 'transactions', label: 'Transactions', icon: Wallet },
  { key: 'appearance',   label: 'Appearance',   icon: Palette },
  { key: 'system',       label: 'System',       icon: Settings },
];

/* ============================================================
   Admin Panel
   ============================================================ */
interface AdminProps {
  data: AppData;
  onNavigate: (page: PageKey) => void;
}

export function Admin({ data, onNavigate }: AdminProps) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        description="Control everything — employees, roles, transactions and system data"
        actions={
          <Badge tone="danger" dot>
            <Crown className="h-3 w-3" /> Admin access
          </Badge>
        }
      />

      <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-ink-850/60 p-1.5 backdrop-blur-xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                active ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-glow' : 'text-ink-400 hover:bg-white/[0.04] hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview'     && <OverviewTab data={data} onNavigate={onNavigate} />}
      {tab === 'employees'    && <EmployeesTab data={data} />}
      {tab === 'accounts'     && <AccountsTab data={data} />}
      {tab === 'roles'        && <RolesTab data={data} />}
      {tab === 'transactions' && <TransactionsTab data={data} />}
      {tab === 'appearance'   && <AppearanceTab data={data} />}
      {tab === 'system'       && <SystemTab data={data} />}
    </div>
  );
}

/* ============================================================
   Overview tab
   ============================================================ */
function OverviewTab({ data, onNavigate }: { data: AppData; onNavigate: (page: PageKey) => void }) {
  const { employees, departments, projects, tasks, meetings, attendance } = data;

  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const onLeave = employees.filter((e) => e.status === 'on-leave').length;
  const inactive = employees.filter((e) => e.status === 'inactive').length;
  const admins = employees.filter((e) => e.role === 'admin').length;
  const managers = employees.filter((e) => e.role === 'manager').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const openTasks = tasks.filter((t) => t.status !== 'done').length;
  const today = new Date().toISOString().slice(0, 10);
  const presentToday = attendance.filter((a) => a.work_date === today && a.status !== 'absent').length;

  const roleCounts = ROLE_ORDER.map((role) => ({ role, count: employees.filter((e) => e.role === role).length }));
  const maxRoleCount = Math.max(...roleCounts.map((r) => r.count), 1);

  const sysItems: { label: string; value: number; icon: typeof Users; page: PageKey; tone: 'brand' | 'accent' | 'warning' | 'success' }[] = [
    { label: 'Departments',     value: departments.length,  icon: Building2,    page: 'departments', tone: 'brand' },
    { label: 'Active projects', value: activeProjects,      icon: FolderKanban, page: 'projects',    tone: 'accent' },
    { label: 'Open tasks',      value: openTasks,           icon: CheckSquare,   page: 'tasks',       tone: 'warning' },
    { label: 'Present today',   value: presentToday,        icon: CalendarCheck, page: 'attendance',  tone: 'success' },
    { label: 'Meetings',        value: meetings.length,     icon: CalendarClock, page: 'meetings',    tone: 'brand' },
    { label: 'Attendance logs', value: attendance.length,   icon: CalendarCheck, page: 'attendance',  tone: 'success' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger">
        <StatBox icon={Users} label="Total employees" value={employees.length} sub={`${activeEmployees} active`} tone="brand" />
        <StatBox icon={Crown} label="Admins & managers" value={admins + managers} sub={`${admins} admin · ${managers} mgr`} tone="danger" />
        <StatBox icon={FolderKanban} label="Projects" value={projects.length} sub={`${activeProjects} active`} tone="accent" />
        <StatBox icon={CheckSquare} label="Total tasks" value={tasks.length} sub={`${openTasks} open`} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Role distribution</h3>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('employees')}>View all <ArrowRight className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="space-y-3">
            {roleCounts.map(({ role, count }) => {
              const meta = ROLE_META[role];
              const Icon = meta.icon;
              return (
                <div key={role} className="flex items-center gap-3">
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg ring-1', meta.color)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="w-20 text-sm font-medium text-ink-700 dark:text-ink-300">{meta.label}</span>
                  <div className="flex-1">
                    <div className="h-2.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-700/50">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', meta.color.split(' ')[0].replace('text-', 'bg-').replace('/15', '/500'))}
                        style={{ width: `${(count / maxRoleCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-6 text-right font-display text-sm font-bold text-ink-900 dark:text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Status breakdown</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Active', value: activeEmployees, icon: CheckCircle2, color: 'bg-success-500/15 text-success-400' },
              { label: 'On Leave', value: onLeave, icon: AlertCircle, color: 'bg-warning-500/15 text-warning-400' },
              { label: 'Inactive', value: inactive, icon: X, color: 'bg-ink-700/40 text-ink-300' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-ink-200 p-4 text-center dark:border-white/[0.06]">
                <span className={cn('mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg', color)}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="font-display text-2xl font-bold text-ink-900 dark:text-white">{value}</p>
                <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-ink-600 dark:text-ink-400" />
          <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">System overview</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sysItems.map(({ label, value, icon: Icon, page, tone }) => (
            <button
              key={label}
              onClick={() => onNavigate(page)}
              className="flex items-center gap-3 rounded-xl border border-ink-200 p-3.5 text-left transition-all hover:border-brand-300 hover:shadow-card dark:border-white/[0.06] dark:hover:border-brand-500/30 dark:hover:bg-white/[0.02]"
            >
              <IconBadge icon={Icon} tone={tone} size="sm" />
              <div>
                <p className="font-display text-lg font-bold leading-none text-ink-900 dark:text-white">{value}</p>
                <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">{label}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   Employees tab — inline role + status transitions
   ============================================================ */
function EmployeesTab({ data }: { data: AppData }) {
  const { employees, departments, refresh } = data;
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<EmployeeInput | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return sortBy(
      employees.filter((e) => {
        const q = query.toLowerCase();
        const matchesQuery = !query || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || (e.position ?? '').toLowerCase().includes(q);
        const matchesRole = roleFilter === 'all' || e.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchesQuery && matchesRole && matchesStatus;
      }),
      (e) => e.name,
    );
  }, [employees, query, roleFilter, statusFilter]);

  async function updateField(id: string, field: 'role' | 'status', value: EmployeeRole | EmployeeStatus, name: string) {
    setUpdating(id);
    const { error } = await supabase.from('employees').update({ [field]: value }).eq('id', id);
    setUpdating(null);
    if (error) { toast.error(`Could not update ${field}`, error.message); return; }
    toast.success(`${name}'s ${field} changed to ${value}`);
    refresh();
  }

  function openEdit(emp: Employee) {
    setEditTarget(emp);
    setEditForm({
      name: emp.name, email: emp.email, phone: emp.phone ?? '', position: emp.position ?? '',
      department_id: emp.department_id ?? '', avatar_url: emp.avatar_url ?? '',
      status: emp.status, role: emp.role,
      hire_date: emp.hire_date ?? new Date().toISOString().slice(0, 10),
      salary: emp.salary ?? 0,
    });
  }

  async function handleSaveEdit() {
    if (!editTarget || !editForm) return;
    if (!editForm.name.trim() || !editForm.email.trim()) { toast.error('Name and email are required'); return; }
    setSavingEdit(true);
    const payload = { ...editForm, department_id: editForm.department_id || null, avatar_url: editForm.avatar_url || null, salary: Number(editForm.salary) || 0 };
    const { error } = await supabase.from('employees').update(payload).eq('id', editTarget.id);
    setSavingEdit(false);
    if (error) { toast.error('Could not save changes', error.message); return; }
    toast.success('Employee updated', editTarget.name);
    setEditTarget(null); setEditForm(null); refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('employees').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) { toast.error('Could not delete employee', error.message); return; }
    toast.success('Employee removed', deleteTarget.name);
    setDeleteTarget(null); refresh();
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="p-4 dark:bg-ink-850/60 dark:border-white/[0.06]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input placeholder="Search by name, email or position…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="min-w-[140px]">
            <option value="all">All roles</option>
            {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-w-[140px]">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden dark:bg-ink-850/60 dark:border-white/[0.06]">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-ink-500 dark:text-ink-400">No employees match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-ink-400">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Salary</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-white/[0.04]">
                {filtered.map((emp) => {
                  const roleMeta = ROLE_META[emp.role];
                  const RoleIcon = roleMeta.icon;
                  const isUpdating = updating === emp.id;
                  return (
                    <tr key={emp.id} className="transition-colors hover:bg-ink-50/40 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.name} src={emp.avatar_url} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink-900 dark:text-white">{emp.name}</p>
                            <p className="truncate text-xs text-ink-500 dark:text-ink-400">{emp.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{emp.department?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn('hidden items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 sm:inline-flex', roleMeta.color)}>
                            <RoleIcon className="h-3 w-3" /> {roleMeta.label}
                          </span>
                          <select
                            value={emp.role}
                            disabled={isUpdating}
                            onChange={(e) => updateField(emp.id, 'role', e.target.value as EmployeeRole, emp.name)}
                            className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 dark:border-white/[0.08] dark:bg-ink-900/60 dark:text-ink-200 dark:hover:border-white/[0.12]"
                          >
                            {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={emp.status}
                          disabled={isUpdating}
                          onChange={(e) => updateField(emp.id, 'status', e.target.value as EmployeeStatus, emp.name)}
                          className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 dark:border-white/[0.08] dark:bg-ink-900/60 dark:text-ink-200 dark:hover:border-white/[0.12]"
                        >
                          <option value="active">Active</option>
                          <option value="on-leave">On Leave</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="hidden px-4 py-3 font-medium text-ink-900 dark:text-white sm:table-cell">{formatCurrency(emp.salary)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} className="h-8 w-8" aria-label="Edit">
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(emp)} className="h-8 w-8 text-danger-500 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/15 dark:hover:text-danger-400" aria-label="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!editTarget}
        onClose={() => { setEditTarget(null); setEditForm(null); }}
        title="Edit Employee"
        description="Update employee details, role and status."
        size="lg"
        footer={<><Button variant="outline" onClick={() => { setEditTarget(null); setEditForm(null); }}>Cancel</Button><Button onClick={handleSaveEdit} loading={savingEdit}>Save changes</Button></>}
      >
        {editForm && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" required><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></Field>
            <Field label="Email" required><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></Field>
            <Field label="Phone"><Input value={editForm.phone ?? ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></Field>
            <Field label="Position"><Input value={editForm.position ?? ''} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} /></Field>
            <Field label="Department">
              <Select value={editForm.department_id ?? ''} onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Role">
              <Select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as EmployeeRole })}>
                {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as EmployeeStatus })}>
                <option value="active">Active</option><option value="on-leave">On Leave</option><option value="inactive">Inactive</option>
              </Select>
            </Field>
            <Field label="Salary (USD)"><Input type="number" value={editForm.salary ?? 0} onChange={(e) => setEditForm({ ...editForm, salary: Number(e.target.value) })} /></Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove employee?"
        message={`This will permanently remove ${deleteTarget?.name} and their attendance records.`}
        confirmLabel="Remove" loading={deleting} destructive
      />
    </div>
  );
}

/* ============================================================
   Accounts tab — admin creates & approves user accounts
   ============================================================ */
function AccountsTab({ data }: { data: AppData }) {
  const { employees, refresh } = data;
  const toast = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', displayName: '' });
  const [saving, setSaving] = useState(false);
  const [resetTarget, setResetTarget] = useState<Employee | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pending = employees.filter((e) => e.account_status === 'pending');
  const approved = employees.filter((e) => e.account_status === 'approved');
  const rejected = employees.filter((e) => e.account_status === 'rejected');

  async function handleCreate() {
    if (!form.username.trim() || !form.password.trim()) { toast.error('Username and password are required'); return; }
    setSaving(true);
    const { data: result, error } = await supabase.rpc('admin_create_user', {
      p_username: form.username.trim(),
      p_password: form.password,
      p_display_name: form.displayName.trim() || form.username.trim(),
    });
    setSaving(false);
    if (error) { toast.error('Could not create account', error.message); return; }
    if (result && result.error) { toast.error('Could not create account', result.error); return; }
    setCreateOpen(false);
    setForm({ username: '', password: '', displayName: '' });
    toast.success('Account created', `${form.username.trim()} can now sign in`);
    refresh();
  }

  async function handleApprove(empId: string, name: string) {
    setActionLoading(empId);
    const { data: result, error } = await supabase.rpc('admin_approve_user', { p_employee_id: empId });
    setActionLoading(null);
    if (error || (result && result.error)) { toast.error('Could not approve', error?.message ?? result?.error); return; }
    toast.success(`${name} approved`, 'They now have full access');
    refresh();
  }

  async function handleReject(empId: string, name: string) {
    setActionLoading(empId);
    const { data: result, error } = await supabase.rpc('admin_reject_user', { p_employee_id: empId });
    setActionLoading(null);
    if (error || (result && result.error)) { toast.error('Could not reject', error?.message ?? result?.error); return; }
    toast.success(`${name} rejected`);
    refresh();
  }

  async function handleResetPassword() {
    if (!resetTarget || !resetPassword.trim()) return;
    setResetting(true);
    const { data: result, error } = await supabase.rpc('admin_update_user_password', {
      p_username: resetTarget.username ?? '',
      p_password: resetPassword,
    });
    setResetting(false);
    if (error || (result && result.error)) { toast.error('Could not reset password', error?.message ?? result?.error); return; }
    setResetTarget(null);
    setResetPassword('');
    toast.success('Password updated');
  }

  const ACCOUNT_STATUS_META: Record<string, { label: string; tone: 'warning' | 'success' | 'danger' }> = {
    pending: { label: 'Pending', tone: 'warning' },
    approved: { label: 'Approved', tone: 'success' },
    rejected: { label: 'Rejected', tone: 'danger' },
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger">
        <StatBox icon={UserPlus} label="Pending" value={pending.length} sub="Awaiting approval" tone="warning" />
        <StatBox icon={CheckCircle2} label="Approved" value={approved.length} sub="Full access" tone="success" />
        <StatBox icon={X} label="Rejected" value={rejected.length} sub="No access" tone="danger" />
      </div>

      <Card className="p-4 dark:bg-ink-850/60 dark:border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">User Accounts</h3>
            <p className="text-sm text-ink-500 dark:text-ink-400">Create accounts and approve users</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" /> Create Account
          </Button>
        </div>
      </Card>

      {/* Pending accounts */}
      {pending.length > 0 && (
        <Card className="overflow-hidden dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="border-b border-ink-100 px-4 py-3 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning-500 dark:text-warning-400" />
              <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-white">Pending approval</h3>
              <Badge tone="warning">{pending.length}</Badge>
            </div>
          </div>
          <div className="divide-y divide-ink-100 dark:divide-white/[0.04]">
            {pending.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={emp.name} src={emp.avatar_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900 dark:text-white">{emp.name}</p>
                  <p className="truncate text-xs text-ink-500 dark:text-ink-400">ID: {emp.username}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => handleApprove(emp.id, emp.name)} loading={actionLoading === emp.id} className="h-7 px-2.5 text-xs">
                    <CheckCircle2 className="h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleReject(emp.id, emp.name)} className="h-7 px-2.5 text-xs text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/15">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All accounts */}
      <Card className="overflow-hidden dark:bg-ink-850/60 dark:border-white/[0.06]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-ink-400">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">ID</th>
                <th className="hidden px-4 py-3 sm:table-cell">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-white/[0.04]">
              {employees.map((emp) => {
                const statusMeta = ACCOUNT_STATUS_META[emp.account_status] ?? ACCOUNT_STATUS_META.pending;
                const roleMeta = ROLE_META[emp.role] ?? ROLE_META.member;
                return (
                  <tr key={emp.id} className="transition-colors hover:bg-ink-50/40 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.name} src={emp.avatar_url} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-900 dark:text-white">{emp.name}</p>
                          <p className="truncate text-xs text-ink-500 dark:text-ink-400">{emp.position || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-600 dark:text-ink-400">{emp.username ?? '—'}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1', roleMeta.color)}>
                        {roleMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3"><Badge tone={statusMeta.tone} dot>{statusMeta.label}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {emp.account_status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => handleApprove(emp.id, emp.name)} loading={actionLoading === emp.id} className="h-7 px-2.5 text-xs">
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => { setResetTarget(emp); setResetPassword(''); }} className="h-7 px-2.5 text-xs">
                          <Lock className="h-3 w-3" /> Reset
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create account modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create User Account"
        description="Create a new account with an ID and password. The user will sign in with these credentials."
        footer={<><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} loading={saving}>Create account</Button></>}
      >
        <div className="space-y-4">
          <Field label="Display ID (username)" required>
            <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="e.g. john.doe123" />
          </Field>
          <Field label="Display name" >
            <Input value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} placeholder="e.g. John Doe" />
          </Field>
          <Field label="Password" required>
            <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
          </Field>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            The user will sign in with their ID and this password. They'll set up their own profile after first login. You'll need to approve them before they get full access.
          </p>
        </div>
      </Modal>

      {/* Reset password modal */}
      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Reset Password"
        description={`Reset password for ${resetTarget?.name} (${resetTarget?.username})`}
        footer={<><Button variant="outline" onClick={() => setResetTarget(null)}>Cancel</Button><Button onClick={handleResetPassword} loading={resetting}>Update password</Button></>}
      >
        <div className="space-y-4">
          <Field label="New password" required>
            <Input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="Min 6 characters" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ============================================================
   Roles tab
   ============================================================ */
function RolesTab({ data }: { data: AppData }) {
  const { employees } = data;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
        {ROLE_ORDER.map((role) => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          const count = employees.filter((e) => e.role === role).length;
          const people = employees.filter((e) => e.role === role).slice(0, 4);
          return (
            <Card key={role} className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
              <div className="flex items-start justify-between">
                <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl ring-1', meta.color)}>
                  <Icon className="h-5 w-5" />
                </span>
                <Badge tone={meta.tone}>{count} {count === 1 ? 'person' : 'people'}</Badge>
              </div>
              <h3 className="mt-3 font-display text-base font-semibold text-ink-900 dark:text-white">{meta.label}</h3>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{meta.desc}</p>
              {people.length > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {people.map((p) => <Avatar key={p.id} name={p.name} src={p.avatar_url} size="xs" className="ring-2 ring-white dark:ring-ink-850" />)}
                  </div>
                  {count > people.length && <span className="text-xs text-ink-400 dark:text-ink-500">+{count - people.length} more</span>}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden dark:bg-ink-850/60 dark:border-white/[0.06]">
        <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Lock className="h-4.5 w-4.5 text-ink-600 dark:text-ink-400" />
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Permissions matrix</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-ink-400">
                <th className="px-5 py-3">Permission</th>
                {ROLE_ORDER.map((r) => <th key={r} className="px-3 py-3 text-center">{ROLE_META[r].label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-white/[0.04]">
              {PERMISSIONS.map((perm) => (
                <tr key={perm.label} className="transition-colors hover:bg-ink-50/40 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-medium text-ink-700 dark:text-ink-200">{perm.label}</td>
                  {ROLE_ORDER.map((r) => {
                    const allowed = perm.roles.includes(r);
                    return (
                      <td key={r} className="px-3 py-3 text-center">
                        {allowed ? <CheckCircle2 className="mx-auto h-4.5 w-4.5 text-success-500 dark:text-success-400" />
                                 : <X className="mx-auto h-4 w-4 text-ink-300 dark:text-ink-600" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   Transactions tab — salary payments, bonuses, deductions
   ============================================================ */
interface Transaction {
  id: string;
  employee_id: string;
  employee_name: string;
  avatar_url: string | null;
  type: 'salary' | 'bonus' | 'deduction' | 'reimbursement';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  note: string;
}

const TXN_TYPE_META: Record<Transaction['type'], { label: string; icon: typeof Wallet; color: string }> = {
  salary:        { label: 'Salary',        icon: Wallet,         color: 'bg-brand-500/15 text-brand-400' },
  bonus:         { label: 'Bonus',         icon: TrendingUp,     color: 'bg-success-500/15 text-success-400' },
  deduction:     { label: 'Deduction',     icon: ArrowDownLeft,  color: 'bg-danger-500/15 text-danger-400' },
  reimbursement: { label: 'Reimbursement', icon: ArrowUpRight,   color: 'bg-accent-500/15 text-accent-400' },
};

const TXN_STATUS_META: Record<Transaction['status'], { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  pending:   { label: 'Pending',   tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  failed:    { label: 'Failed',    tone: 'danger' },
};

function TransactionsTab({ data }: { data: AppData }) {
  const { employees, transactions: dbTxns, refresh } = data;
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: '',
    type: 'salary' as Transaction['type'],
    amount: 0,
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  // Map DB transactions to display format
  const transactions: Transaction[] = dbTxns.map((t) => ({
    id: t.id,
    employee_id: t.employee_id,
    employee_name: t.employee?.name ?? 'Unknown',
    avatar_url: t.employee?.avatar_url ?? null,
    type: t.type,
    amount: t.type === 'deduction' ? -Math.abs(t.amount) : Math.abs(t.amount),
    status: t.status === 'paid' ? 'completed' : t.status === 'failed' ? 'failed' : 'pending',
    date: t.payment_date,
    note: t.description ?? TXN_TYPE_META[t.type].label,
  }));

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);

  const totalOut = transactions.filter((t) => t.amount > 0 && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const totalIn = transactions.filter((t) => t.amount < 0 && t.status === 'completed').reduce((s, t) => s + Math.abs(t.amount), 0);
  const pending = transactions.filter((t) => t.status === 'pending').reduce((s, t) => s + Math.abs(t.amount), 0);

  function openCreate() {
    setForm({ employee_id: employees[0]?.id ?? '', type: 'salary', amount: employees[0]?.salary ?? 0, note: '' });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.employee_id || !form.amount) { toast.error('Employee and amount are required'); return; }
    setSaving(true);
    const emp = employees.find((e) => e.id === form.employee_id);
    if (!emp) { setSaving(false); return; }
    const dbStatus = form.type === 'salary' ? 'pending' : 'pending';
    const { error } = await supabase.from('salary_transactions').insert({
      employee_id: form.employee_id,
      type: form.type,
      amount: Math.abs(form.amount),
      description: form.note || TXN_TYPE_META[form.type].label,
      payment_date: new Date().toISOString().slice(0, 10),
      status: dbStatus,
    });
    setSaving(false);
    if (error) { toast.error('Could not create transaction', error.message); return; }
    setModalOpen(false);
    toast.success('Transaction created', `${TXN_TYPE_META[form.type].label} for ${emp.name}`);
    refresh();
  }

  async function updateTxnStatus(id: string, status: Transaction['status']) {
    const dbStatus = status === 'completed' ? 'paid' : status === 'failed' ? 'failed' : 'pending';
    const { error } = await supabase.from('salary_transactions').update({ status: dbStatus }).eq('id', id);
    if (error) { toast.error('Could not update status', error.message); return; }
    toast.success(`Transaction ${status}`);
    refresh();
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger">
        <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/25">
              <ArrowUpRight className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-2xl font-bold text-ink-900 dark:text-white">{formatCurrency(totalOut)}</p>
              <p className="text-sm text-ink-500 dark:text-ink-400">Total paid out</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-500/15 text-success-400 ring-1 ring-success-500/25">
              <ArrowDownLeft className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-2xl font-bold text-ink-900 dark:text-white">{formatCurrency(totalIn)}</p>
              <p className="text-sm text-ink-500 dark:text-ink-400">Total deductions</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-500/15 text-warning-400 ring-1 ring-warning-500/25">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-2xl font-bold text-ink-900 dark:text-white">{formatCurrency(pending)}</p>
              <p className="text-sm text-ink-500 dark:text-ink-400">Pending</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions bar */}
      <Card className="p-4 dark:bg-ink-850/60 dark:border-white/[0.06]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-[180px]">
            <option value="all">All types</option>
            <option value="salary">Salary</option>
            <option value="bonus">Bonus</option>
            <option value="deduction">Deduction</option>
            <option value="reimbursement">Reimbursement</option>
          </Select>
          <Button onClick={openCreate}>
            <Wallet className="h-4 w-4" /> New Transaction
          </Button>
        </div>
      </Card>

      {/* Transactions table */}
      <Card className="overflow-hidden dark:bg-ink-850/60 dark:border-white/[0.06]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-ink-400">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="hidden px-4 py-3 sm:table-cell">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-white/[0.04]">
              {filtered.map((txn) => {
                const typeMeta = TXN_TYPE_META[txn.type];
                const TypeIcon = typeMeta.icon;
                const statusMeta = TXN_STATUS_META[txn.status];
                return (
                  <tr key={txn.id} className="transition-colors hover:bg-ink-50/40 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={txn.employee_name} src={txn.avatar_url} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-900 dark:text-white">{txn.employee_name}</p>
                          <p className="truncate text-xs text-ink-500 dark:text-ink-400">{txn.note}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1', typeMeta.color)}>
                        <TypeIcon className="h-3 w-3" /> {typeMeta.label}
                      </span>
                    </td>
                    <td className={cn('px-4 py-3 font-display font-bold', txn.amount < 0 ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400')}>
                      {txn.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(txn.amount))}
                    </td>
                    <td className="hidden px-4 py-3 text-ink-500 dark:text-ink-400 sm:table-cell">{txn.date}</td>
                    <td className="px-4 py-3"><Badge tone={statusMeta.tone} dot>{statusMeta.label}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {txn.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => updateTxnStatus(txn.id, 'completed')} className="h-7 px-2 text-xs">
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => updateTxnStatus(txn.id, 'failed')} className="h-7 px-2 text-xs text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/15">
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New transaction modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Transaction"
        description="Create a salary payment, bonus, deduction or reimbursement."
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Create transaction</Button></>}
      >
        <div className="space-y-4">
          <Field label="Employee" required>
            <Select value={form.employee_id} onChange={(e) => {
              const emp = employees.find((em) => em.id === e.target.value);
              setForm({ ...form, employee_id: e.target.value, amount: emp?.salary ?? 0 });
            }}>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.position}</option>)}
            </Select>
          </Field>
          <Field label="Transaction type" required>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Transaction['type'] })}>
              <option value="salary">Salary</option>
              <option value="bonus">Bonus</option>
              <option value="deduction">Deduction</option>
              <option value="reimbursement">Reimbursement</option>
            </Select>
          </Field>
          <Field label="Amount (USD)" required>
            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </Field>
          <Field label="Note">
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional description" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ============================================================
   Appearance tab — 20+ theme presets, fonts, icon sets, layout
   ============================================================ */
function AppearanceTab({ data }: { data: AppData }) {
  const { refresh } = data;
  const toast = useToast();
  const [settings, setSettings] = useState({
    theme_key: 'atlas-midnight',
    accent_color: '#4f46e5',
    icon_set: 'lucide',
    layout_density: 'comfortable' as 'compact' | 'comfortable' | 'spacious',
    sidebar_style: 'expanded' as 'expanded' | 'icons-only' | 'hidden',
    font_family: 'inter',
    custom_logo_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('app_settings').select('*').limit(1).then(({ data: rows }) => {
      if (rows && rows.length > 0) {
        const s = rows[0];
        setSettings({
          theme_key: s.theme_key,
          accent_color: s.accent_color,
          icon_set: s.icon_set,
          layout_density: s.layout_density,
          sidebar_style: s.sidebar_style,
          font_family: s.font_family,
          custom_logo_url: s.custom_logo_url ?? '',
        });
      }
      setLoading(false);
    });
  }, []);

  async function saveSettings() {
    setSaving(true);
    const { data: existing } = await supabase.from('app_settings').select('id').limit(1);
    let error;
    if (existing && existing.length > 0) {
      ({ error } = await supabase.from('app_settings').update({
        ...settings,
        updated_at: new Date().toISOString(),
      }).eq('id', existing[0].id));
    } else {
      ({ error } = await supabase.from('app_settings').insert(settings));
    }
    setSaving(false);
    if (error) { toast.error('Could not save settings', error.message); return; }
    toast.success('Appearance saved', 'Theme and layout updated');
    refresh();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Theme presets */}
      <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-brand-400" />
          <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Theme presets</h3>
          <span className="ml-auto text-xs text-ink-500">{THEME_PRESETS.length} themes available</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {THEME_PRESETS.map((theme) => {
            const active = settings.theme_key === theme.key;
            return (
              <button
                key={theme.key}
                onClick={() => setSettings({ ...settings, theme_key: theme.key, accent_color: theme.accent })}
                className={cn(
                  'group relative overflow-hidden rounded-xl border p-3 text-left transition-all',
                  active ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-ink-200 hover:border-ink-300 dark:border-white/[0.08] dark:hover:border-white/[0.15]',
                )}
              >
                {/* Color preview */}
                <div className="mb-2 flex gap-1.5">
                  {theme.preview.map((color, i) => (
                    <div key={i} className="h-8 flex-1 rounded-lg" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <p className="text-[13px] font-semibold text-ink-900 dark:text-white">{theme.name}</p>
                <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">{theme.description}</p>
                {active && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Custom accent color */}
      <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-400" />
          <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Custom accent color</h3>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={settings.accent_color}
            onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
            className="h-12 w-12 cursor-pointer rounded-lg border border-ink-200 dark:border-white/[0.08]"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-700 dark:text-ink-200">{settings.accent_color}</p>
            <p className="text-xs text-ink-500 dark:text-ink-400">Override the theme's default accent</p>
          </div>
          <div className="h-10 w-10 rounded-xl" style={{ backgroundColor: settings.accent_color }} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Font family */}
        <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="mb-4 flex items-center gap-2">
            <Type className="h-5 w-5 text-brand-400" />
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Font family</h3>
          </div>
          <div className="space-y-2">
            {FONT_OPTIONS.map((font) => {
              const active = settings.font_family === font.key;
              return (
                <button
                  key={font.key}
                  onClick={() => setSettings({ ...settings, font_family: font.key })}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all',
                    active ? 'border-brand-500 bg-brand-500/5' : 'border-ink-200 hover:border-ink-300 dark:border-white/[0.08]',
                  )}
                >
                  <span className="text-sm font-medium text-ink-700 dark:text-ink-200" style={{ fontFamily: font.family }}>{font.name}</span>
                  {active && <Check className="h-4 w-4 text-brand-500" />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Icon set + layout */}
        <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="mb-4 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-accent-400" />
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Icons & layout</h3>
          </div>
          <div className="space-y-4">
            <Field label="Icon set">
              <Select value={settings.icon_set} onChange={(e) => setSettings({ ...settings, icon_set: e.target.value })}>
                {ICON_SETS.map((set) => <option key={set.key} value={set.key}>{set.name}</option>)}
              </Select>
            </Field>
            <Field label="Layout density">
              <Select value={settings.layout_density} onChange={(e) => setSettings({ ...settings, layout_density: e.target.value as 'compact' | 'comfortable' | 'spacious' })}>
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </Select>
            </Field>
            <Field label="Sidebar style">
              <Select value={settings.sidebar_style} onChange={(e) => setSettings({ ...settings, sidebar_style: e.target.value as 'expanded' | 'icons-only' | 'hidden' })}>
                <option value="expanded">Expanded</option>
                <option value="icons-only">Icons only</option>
                <option value="hidden">Hidden</option>
              </Select>
            </Field>
            <Field label="Custom logo URL" hint="Replace the sidebar logo with your own image">
              <Input value={settings.custom_logo_url} onChange={(e) => setSettings({ ...settings, custom_logo_url: e.target.value })} placeholder="https://…" />
            </Field>
          </div>
        </Card>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} loading={saving} disabled={loading} size="lg">
          <Check className="h-4 w-4" /> Save appearance settings
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   System tab
   ============================================================ */
function SystemTab({ data }: { data: AppData }) {
  const { employees, departments, projects, tasks, meetings, attendance, refresh } = data;
  const toast = useToast();

  const [bulkRole, setBulkRole] = useState<EmployeeRole>('member');
  const [bulkStatus, setBulkStatus] = useState<EmployeeStatus>('active');
  const [applyingRole, setApplyingRole] = useState(false);
  const [applyingStatus, setApplyingStatus] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function bulkUpdateRole() {
    setApplyingRole(true);
    const { error } = await supabase.from('employees').update({ role: bulkRole }).neq('id', '00000000-0000-0000-0000-000000000000');
    setApplyingRole(false);
    if (error) { toast.error('Bulk role update failed', error.message); return; }
    toast.success(`All employees set to ${ROLE_META[bulkRole].label}`, `${employees.length} people updated`);
    refresh();
  }

  async function bulkUpdateStatus() {
    setApplyingStatus(true);
    const { error } = await supabase.from('employees').update({ status: bulkStatus }).neq('id', '00000000-0000-0000-0000-000000000000');
    setApplyingStatus(false);
    if (error) { toast.error('Bulk status update failed', error.message); return; }
    toast.success(`All employees set to ${bulkStatus}`, `${employees.length} people updated`);
    refresh();
  }

  async function handleClearAttendance() {
    setClearing(true);
    const { error } = await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setClearing(false);
    if (error) { toast.error('Could not clear attendance', error.message); return; }
    toast.success('Attendance logs cleared', `${attendance.length} records removed`);
    setConfirmClear(false); refresh();
  }

  const tables = [
    { name: 'Employees',   count: employees.length,   icon: Users,         tone: 'brand' as const },
    { name: 'Departments', count: departments.length, icon: Building2,     tone: 'accent' as const },
    { name: 'Projects',    count: projects.length,    icon: FolderKanban,  tone: 'warning' as const },
    { name: 'Tasks',       count: tasks.length,       icon: CheckSquare,   tone: 'success' as const },
    { name: 'Meetings',    count: meetings.length,    icon: CalendarClock, tone: 'brand' as const },
    { name: 'Attendance',  count: attendance.length,  icon: CalendarCheck, tone: 'neutral' as const },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-400" />
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Bulk role assignment</h3>
          </div>
          <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">Set the same role for all {employees.length} employees at once.</p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Field label="Role">
                <Select value={bulkRole} onChange={(e) => setBulkRole(e.target.value as EmployeeRole)}>
                  {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                </Select>
              </Field>
            </div>
            <Button onClick={bulkUpdateRole} loading={applyingRole} className="mb-0.5">Apply to all</Button>
          </div>
        </Card>

        <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="mb-4 flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-accent-400" />
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Bulk status transition</h3>
          </div>
          <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">Set the same status for all {employees.length} employees at once.</p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Field label="Status">
                <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as EmployeeStatus)}>
                  <option value="active">Active</option><option value="on-leave">On Leave</option><option value="inactive">Inactive</option>
                </Select>
              </Field>
            </div>
            <Button onClick={bulkUpdateStatus} loading={applyingStatus} className="mb-0.5">Apply to all</Button>
          </div>
        </Card>
      </div>

      <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-ink-600 dark:text-ink-400" />
          <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Data overview</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tables.map(({ name, count, icon: Icon, tone }) => (
            <div key={name} className="rounded-xl border border-ink-200 p-3.5 text-center dark:border-white/[0.06]">
              <IconBadge icon={Icon} tone={tone} size="sm" className="mx-auto" />
              <p className="mt-2 font-display text-xl font-bold text-ink-900 dark:text-white">{count}</p>
              <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">{name}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-danger-200 p-5 dark:border-danger-500/20 dark:bg-ink-850/60">
        <div className="mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-danger-600 dark:text-danger-400" />
          <h3 className="font-display text-base font-semibold text-danger-700 dark:text-danger-400">Danger zone</h3>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-ink-800 dark:text-white">Clear all attendance logs</p>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">Permanently removes all {attendance.length} attendance records. This cannot be undone.</p>
          </div>
          <Button variant="danger" onClick={() => setConfirmClear(true)} className="shrink-0">
            <Trash2 className="h-4 w-4" /> Clear attendance
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearAttendance}
        title="Clear all attendance?"
        message={`This will permanently delete all ${attendance.length} attendance records. This action cannot be undone.`}
        confirmLabel="Clear all" loading={clearing} destructive
      />
    </div>
  );
}

/* ============================================================
   Stat box helper
   ============================================================ */
function StatBox({ icon: Icon, label, value, sub, tone }: { icon: typeof Users; label: string; value: number; sub: string; tone: 'brand' | 'danger' | 'accent' | 'warning' | 'success' }) {
  const toneClasses = {
    brand: 'bg-brand-500/15 text-brand-400 ring-brand-500/25',
    danger: 'bg-danger-500/15 text-danger-400 ring-danger-500/25',
    accent: 'bg-accent-500/15 text-accent-400 ring-accent-500/25',
    warning: 'bg-warning-500/15 text-warning-400 ring-warning-500/25',
    success: 'bg-success-500/15 text-success-400 ring-success-500/25',
  };
  return (
    <Card className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
      <div className="flex items-center gap-3">
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl ring-1', toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-2xl font-bold leading-none text-ink-900 dark:text-white">{value}</p>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{label}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-400 dark:text-ink-500">{sub}</p>
    </Card>
  );
}
