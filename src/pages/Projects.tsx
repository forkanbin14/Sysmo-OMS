import { useMemo, useState } from 'react';
import { FolderKanban, Plus, Pencil, Trash2, CalendarRange, Building2, CheckSquare } from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { Project, ProjectInput, ProjectStatus, Priority } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProjectStatusBadge, PriorityBadge } from '@/components/ui/StatusBadges';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { IconBadge } from '@/components/ui/IconBadge';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { cn, formatDate, daysFromNow } from '@/lib/utils';

interface ProjectsProps {
  data: AppData;
}

const emptyForm: ProjectInput = {
  name: '',
  description: '',
  department_id: '',
  status: 'planning',
  priority: 'medium',
  start_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  progress: 0,
};

const statusFilters: { key: ProjectStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'planning', label: 'Planning' },
  { key: 'active', label: 'Active' },
  { key: 'on-hold', label: 'On Hold' },
  { key: 'completed', label: 'Completed' },
];

export function Projects({ data }: ProjectsProps) {
  const { projects, departments, tasks, loading, refresh } = data;
  const toast = useToast();

  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(
    () => (filter === 'all' ? projects : projects.filter((p) => p.status === filter)),
    [projects, filter],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(proj: Project) {
    setEditing(proj);
    setForm({
      name: proj.name,
      description: proj.description ?? '',
      department_id: proj.department_id ?? '',
      status: proj.status,
      priority: proj.priority,
      start_date: proj.start_date ?? '',
      due_date: proj.due_date ?? '',
      progress: proj.progress,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setFormError('Project name is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      ...form,
      department_id: form.department_id || null,
      progress: Math.max(0, Math.min(100, Number(form.progress) || 0)),
      due_date: form.due_date || null,
    };
    const { error } = editing
      ? await supabase.from('projects').update(payload).eq('id', editing.id)
      : await supabase.from('projects').insert(payload);
    setSaving(false);
    if (error) {
      setFormError(error.message);
      toast.error('Could not save project', error.message);
      return;
    }
    toast.success(editing ? 'Project updated' : 'Project created', form.name);
    setModalOpen(false);
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('projects').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error('Could not delete project', error.message);
      return;
    }
    toast.success('Project deleted', deleteTarget.name);
    setDeleteTarget(null);
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description={`${projects.length} initiatives across your organization`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Project
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-xl px-3.5 py-2 text-sm font-medium transition-all',
              filter === f.key ? 'bg-ink-900 text-white shadow-soft' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50',
            )}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className={cn('ml-2', filter === f.key ? 'text-ink-300' : 'text-ink-400')}>
                {projects.filter((p) => p.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-2/3" />
              <Skeleton className="mt-5 h-2 w-full rounded-full" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderKanban}
            title="No projects found"
            description={filter !== 'all' ? 'No projects match this filter.' : 'Create your first project to get started.'}
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Project</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 stagger">
          {filtered.map((proj) => {
            const projTasks = tasks.filter((t) => t.project_id === proj.id);
            const doneTasks = projTasks.filter((t) => t.status === 'done').length;
            const daysLeft = daysFromNow(proj.due_date);
            const overdue = daysLeft < 0 && proj.status !== 'completed';
            return (
              <Card key={proj.id} hover className="group p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <IconBadge icon={FolderKanban} tone="brand" size="lg" />
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-semibold text-ink-900">{proj.name}</h3>
                      <p className="mt-0.5 line-clamp-2 text-sm text-ink-500">{proj.description ?? 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(proj)} className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(proj)} className="h-8 w-8 text-danger-500 hover:bg-danger-50 hover:text-danger-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <ProjectStatusBadge status={proj.status} />
                  <PriorityBadge priority={proj.priority} />
                  {proj.department && (
                    <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                      <Building2 className="h-3.5 w-3.5" /> {proj.department.name}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-700">Progress</span>
                    <span className="font-semibold text-ink-900">{proj.progress}%</span>
                  </div>
                  <ProgressBar
                    value={proj.progress}
                    barClassName={proj.progress >= 75 ? 'bg-success-500' : proj.progress >= 40 ? 'bg-brand-500' : 'bg-warning-500'}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4 text-sm">
                  <div className="flex items-center gap-4 text-ink-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarRange className="h-4 w-4" />
                      {formatDate(proj.start_date, { month: 'short', day: 'numeric' })} → {formatDate(proj.due_date, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="h-4 w-4" />
                      {doneTasks}/{projTasks.length} tasks
                    </span>
                  </div>
                  {overdue ? (
                    <span className="text-xs font-semibold text-danger-600">{Math.abs(daysLeft)}d overdue</span>
                  ) : proj.status !== 'completed' && proj.due_date ? (
                    <span className={cn('text-xs font-medium', daysLeft <= 7 ? 'text-warning-600' : 'text-ink-500')}>
                      {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                    </span>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Project' : 'Add Project'}
        description={editing ? 'Update project details.' : 'Start a new initiative.'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Save changes' : 'Create project'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Project name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer Portal Redesign" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this project about?" />
            </Field>
          </div>
          <Field label="Department">
            <Select value={form.department_id ?? ''} onChange={(e) => setForm({ ...form, department_id: e.target.value })} placeholder="Select department">
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
          <Field label="Progress (%)" hint="0 to 100">
            <Input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
          </Field>
          <Field label="Start date">
            <Input type="date" value={form.start_date ?? ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </Field>
          <Field label="Due date">
            <Input type="date" value={form.due_date ?? ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </Field>
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
        title="Delete project?"
        message={`This will permanently delete ${deleteTarget?.name} and all its tasks.`}
        confirmLabel="Delete"
        loading={deleting}
        destructive
      />
    </div>
  );
}
