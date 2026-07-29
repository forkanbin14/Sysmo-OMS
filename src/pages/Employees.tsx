import { useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Building2,
  CalendarDays,
} from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { Employee, EmployeeInput, EmployeeStatus } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmployeeStatusBadge } from '@/components/ui/StatusBadges';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { IconBadge } from '@/components/ui/IconBadge';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

type ViewMode = 'grid' | 'table';

interface EmployeesProps {
  data: AppData;
}

const emptyForm: EmployeeInput = {
  name: '',
  email: '',
  phone: '',
  position: '',
  department_id: '',
  avatar_url: '',
  status: 'active',
  hire_date: new Date().toISOString().slice(0, 10),
  salary: 0,
};

export function Employees({ data }: EmployeesProps) {
  const { employees, departments, loading, refresh } = data;
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<ViewMode>('grid');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesQuery =
        !query ||
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.email.toLowerCase().includes(query.toLowerCase()) ||
        (e.position ?? '').toLowerCase().includes(query.toLowerCase());
      const matchesDept = deptFilter === 'all' || e.department_id === deptFilter;
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchesQuery && matchesDept && matchesStatus;
    });
  }, [employees, query, deptFilter, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone ?? '',
      position: emp.position ?? '',
      department_id: emp.department_id ?? '',
      avatar_url: emp.avatar_url ?? '',
      status: emp.status,
      hire_date: emp.hire_date ?? new Date().toISOString().slice(0, 10),
      salary: emp.salary ?? 0,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      ...form,
      department_id: form.department_id || null,
      avatar_url: form.avatar_url || null,
      salary: Number(form.salary) || 0,
    };
    const { error } = editing
      ? await supabase.from('employees').update(payload).eq('id', editing.id)
      : await supabase.from('employees').insert(payload);
    setSaving(false);
    if (error) {
      setFormError(error.message);
      toast.error('Could not save employee', error.message);
      return;
    }
    toast.success(editing ? 'Employee updated' : 'Employee added', form.name);
    setModalOpen(false);
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('employees').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error('Could not delete employee', error.message);
      return;
    }
    toast.success('Employee removed', deleteTarget.name);
    setDeleteTarget(null);
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description={`${employees.length} people across ${departments.length} departments`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Search by name, email or role…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-3">
            <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="min-w-[160px]">
              <option value="all">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus | 'all')} className="min-w-[130px]">
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="on-leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </Select>
            <div className="hidden items-center rounded-xl border border-ink-200 bg-white p-0.5 sm:flex">
              <button
                onClick={() => setView('grid')}
                className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', view === 'grid' ? 'bg-ink-100 text-ink-900' : 'text-ink-500')}
              >
                Grid
              </button>
              <button
                onClick={() => setView('table')}
                className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', view === 'table' ? 'bg-ink-100 text-ink-900' : 'text-ink-500')}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No employees found"
            description={query || deptFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first team member to get started.'}
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Employee</Button>}
          />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
          {filtered.map((emp) => (
            <Card key={emp.id} hover className="group p-5">
              <div className="flex items-start gap-3">
                <Avatar name={emp.name} src={emp.avatar_url} size="lg" ring />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-semibold text-ink-900">{emp.name}</p>
                      <p className="truncate text-sm text-ink-500">{emp.position ?? 'No position set'}</p>
                    </div>
                    <EmployeeStatusBadge status={emp.status} />
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-ink-600">
                  <Mail className="h-4 w-4 text-ink-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2 text-ink-600">
                    <Phone className="h-4 w-4 text-ink-400" />
                    <span>{emp.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-ink-600">
                  <Building2 className="h-4 w-4 text-ink-400" />
                  <span>{emp.department?.name ?? 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-ink-600">
                  <CalendarDays className="h-4 w-4 text-ink-400" />
                  <span>Joined {formatDate(emp.hire_date, { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
                <span className="text-sm font-semibold text-ink-900">{formatCurrency(emp.salary)}</span>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(emp)} className="h-8 w-8 text-danger-500 hover:bg-danger-50 hover:text-danger-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Hire Date</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Salary</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="group transition-colors hover:bg-ink-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.name} src={emp.avatar_url} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-900">{emp.name}</p>
                          <p className="truncate text-xs text-ink-500">{emp.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-600">{emp.department?.name ?? '—'}</td>
                    <td className="px-5 py-3"><EmployeeStatusBadge status={emp.status} /></td>
                    <td className="hidden px-5 py-3 text-ink-600 lg:table-cell">{formatDate(emp.hire_date)}</td>
                    <td className="hidden px-5 py-3 font-medium text-ink-900 sm:table-cell">{formatCurrency(emp.salary)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(emp)} className="h-8 w-8 text-danger-500 hover:bg-danger-50 hover:text-danger-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Employee' : 'Add Employee'}
        description={editing ? 'Update team member details.' : 'Add a new person to your team.'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Save changes' : 'Add employee'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@office.co" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 415 555 0100" />
          </Field>
          <Field label="Position">
            <Input value={form.position ?? ''} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Software Engineer" />
          </Field>
          <Field label="Department">
            <Select value={form.department_id ?? ''} onChange={(e) => setForm({ ...form, department_id: e.target.value })} placeholder="Select department">
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeStatus })}>
              <option value="active">Active</option>
              <option value="on-leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
          <Field label="Hire date">
            <Input type="date" value={form.hire_date ?? ''} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
          </Field>
          <Field label="Annual salary (USD)">
            <Input type="number" value={form.salary ?? 0} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} placeholder="0" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Avatar URL" hint="Optional — leave blank to use a generated avatar.">
              <Input value={form.avatar_url ?? ''} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://…" />
            </Field>
          </div>
        </div>
        {formError && (
          <div className="mt-4 rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700 ring-1 ring-danger-200">
            {formError}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove employee?"
        message={`This will permanently remove ${deleteTarget?.name} and their attendance records.`}
        confirmLabel="Remove"
        loading={deleting}
        destructive
      />
    </div>
  );
}
