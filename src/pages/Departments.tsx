import { useMemo, useState } from 'react';
import { Building2, Plus, Users, CircleDollarSign, Pencil, Trash2, Crown } from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { Department, DepartmentInput } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { IconBadge } from '@/components/ui/IconBadge';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { formatCurrency } from '@/lib/utils';

interface DepartmentsProps {
  data: AppData;
}

const accentBar: Record<string, string> = {
  brand: 'bg-gradient-to-r from-brand-400 to-brand-600',
  accent: 'bg-gradient-to-r from-accent-400 to-accent-600',
  success: 'bg-gradient-to-r from-success-400 to-success-600',
  warning: 'bg-gradient-to-r from-warning-400 to-warning-600',
  danger: 'bg-gradient-to-r from-danger-400 to-danger-600',
};

const emptyForm: DepartmentInput = {
  name: '',
  description: '',
  head_name: '',
  budget: 0,
};

export function Departments({ data }: DepartmentsProps) {
  const { departments, employees, projects, loading, refresh } = data;
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  const enriched = useMemo(() => {
    return departments.map((d) => {
      const headCount = employees.filter((e) => e.department_id === d.id);
      const projCount = projects.filter((p) => p.department_id === d.id);
      return { ...d, headCount, projCount };
    });
  }, [departments, employees, projects]);

  const maxBudget = Math.max(1, ...departments.map((d) => d.budget ?? 0));

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setForm({
      name: dept.name,
      description: dept.description ?? '',
      head_name: dept.head_name ?? '',
      budget: dept.budget ?? 0,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setFormError('Department name is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = { ...form, budget: Number(form.budget) || 0 };
    const { error } = editing
      ? await supabase.from('departments').update(payload).eq('id', editing.id)
      : await supabase.from('departments').insert(payload);
    setSaving(false);
    if (error) {
      setFormError(error.message);
      toast.error('Could not save department', error.message);
      return;
    }
    toast.success(editing ? 'Department updated' : 'Department added', form.name);
    setModalOpen(false);
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('departments').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error('Could not delete department', error.message);
      return;
    }
    toast.success('Department removed', deleteTarget.name);
    setDeleteTarget(null);
    refresh();
  }

  const accentTones = ['brand', 'accent', 'success', 'warning', 'danger'] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description={`${departments.length} departments in your organization`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Department
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : enriched.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No departments yet"
            description="Create your first department to organize your team."
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Department</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 stagger">
          {enriched.map((dept, idx) => {
            const tone = accentTones[idx % accentTones.length];
            const budgetPct = ((dept.budget ?? 0) / maxBudget) * 100;
            return (
              <Card key={dept.id} hover className="group overflow-hidden">
                <div className={`h-1.5 w-full ${accentBar[tone]}`} />
                <CardContent>
                  <div className="flex items-start justify-between">
                    <IconBadge icon={Building2} tone={tone} size="lg" />
                    <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(dept)} className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(dept)} className="h-8 w-8 text-danger-500 hover:bg-danger-50 hover:text-danger-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{dept.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-500">{dept.description ?? 'No description'}</p>

                  {dept.head_name && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-ink-600">
                      <Crown className="h-4 w-4 text-warning-500" />
                      <span>{dept.head_name}</span>
                      <Badge tone="neutral" className="ml-auto">Head</Badge>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-ink-100 pt-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-ink-400">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <p className="mt-1 font-display text-xl font-bold text-ink-900">{dept.headCount.length}</p>
                      <p className="text-[11px] text-ink-500">People</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-ink-400">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <p className="mt-1 font-display text-xl font-bold text-ink-900">{dept.projCount.length}</p>
                      <p className="text-[11px] text-ink-500">Projects</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-ink-400">
                        <CircleDollarSign className="h-3.5 w-3.5" />
                      </div>
                      <p className="mt-1 font-display text-xl font-bold text-ink-900">{((dept.budget ?? 0) / 1000).toFixed(0)}k</p>
                      <p className="text-[11px] text-ink-500">Budget</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-ink-500">Budget allocation</span>
                      <span className="font-semibold text-ink-700">{formatCurrency(dept.budget)}</span>
                    </div>
                    <ProgressBar value={budgetPct} barClassName={accentBar[tone]} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Department' : 'Add Department'}
        description={editing ? 'Update department information.' : 'Create a new organizational unit.'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Save changes' : 'Add department'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Department name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Engineering" />
          </Field>
          <Field label="Head of department">
            <Input value={form.head_name ?? ''} onChange={(e) => setForm({ ...form, head_name: e.target.value })} placeholder="Jane Doe" />
          </Field>
          <Field label="Annual budget (USD)">
            <Input type="number" value={form.budget ?? 0} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} placeholder="500000" />
          </Field>
          <Field label="Description">
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this department do?" />
          </Field>
          {formError && (
            <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700 ring-1 ring-danger-200">
              {formError}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete department?"
        message={`This will remove ${deleteTarget?.name}. Employees and projects will be unassigned but kept.`}
        confirmLabel="Delete"
        loading={deleting}
        destructive
      />
    </div>
  );
}
