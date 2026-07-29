import { useMemo, useState } from 'react';
import { CheckSquare, Plus, Pencil, Trash2, CalendarClock, User, FolderKanban } from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { Task, TaskInput, TaskStatus, Priority } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/StatusBadges';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { cn, dueLabel, formatDateShort } from '@/lib/utils';

interface TasksProps {
  data: AppData;
}

const emptyForm: TaskInput = {
  title: '',
  description: '',
  project_id: '',
  assignee_id: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
};

const columns: { key: TaskStatus; label: string; tone: string }[] = [
  { key: 'todo', label: 'To Do', tone: 'bg-ink-400' },
  { key: 'in-progress', label: 'In Progress', tone: 'bg-accent-500' },
  { key: 'review', label: 'Review', tone: 'bg-warning-500' },
  { key: 'done', label: 'Done', tone: 'bg-success-500' },
];

export function Tasks({ data }: TasksProps) {
  const { tasks, projects, employees, loading, refresh } = data;
  const toast = useToast();

  const [view, setView] = useState<'board' | 'list'>('board');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { todo: [], 'in-progress': [], review: [], done: [] };
    tasks.forEach((t) => g[t.status].push(t));
    return g;
  }, [tasks]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description ?? '',
      project_id: task.project_id ?? '',
      assignee_id: task.assignee_id ?? '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ?? '',
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setFormError('Task title is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      ...form,
      project_id: form.project_id || null,
      assignee_id: form.assignee_id || null,
      due_date: form.due_date || null,
    };
    const { error } = editing
      ? await supabase.from('tasks').update(payload).eq('id', editing.id)
      : await supabase.from('tasks').insert(payload);
    setSaving(false);
    if (error) {
      setFormError(error.message);
      toast.error('Could not save task', error.message);
      return;
    }
    toast.success(editing ? 'Task updated' : 'Task created', form.title);
    setModalOpen(false);
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('tasks').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error('Could not delete task', error.message);
      return;
    }
    toast.success('Task deleted', deleteTarget.title);
    setDeleteTarget(null);
    refresh();
  }

  async function handleDragDrop(taskId: string, status: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
    if (error) {
      toast.error('Could not update task', error.message);
      return;
    }
    toast.success(`Moved to ${status.replace('-', ' ')}`, task.title);
    setDraggingId(null);
    setDragOverCol(null);
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={`${tasks.length} tasks across ${projects.length} projects`}
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden items-center rounded-xl border border-ink-200 bg-white p-0.5 sm:flex dark:border-white/[0.06] dark:bg-ink-850/60">
              <button
                onClick={() => setView('board')}
                className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', view === 'board' ? 'bg-ink-100 text-ink-900 dark:bg-ink-700/40 dark:text-white' : 'text-ink-500 dark:text-ink-400')}
              >
                Board
              </button>
              <button
                onClick={() => setView('list')}
                className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', view === 'list' ? 'bg-ink-100 text-ink-900 dark:bg-ink-700/40 dark:text-white' : 'text-ink-500 dark:text-ink-400')}
              >
                List
              </button>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Task
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 dark:bg-ink-850/60 dark:border-white/[0.06]">
              <Skeleton className="h-5 w-24" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : view === 'board' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => { e.preventDefault(); if (draggingId) handleDragDrop(draggingId, col.key); }}
              className={cn(
                'rounded-2xl border bg-ink-50/40 p-3 transition-colors dark:bg-ink-900/40',
                dragOverCol === col.key ? 'border-brand-400 bg-brand-50/40' : 'border-ink-200/70 dark:border-white/[0.06]',
              )}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', col.tone)} />
                  <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">{col.label}</span>
                </div>
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600 dark:bg-ink-700/40 dark:text-ink-300">
                  {grouped[col.key].length}
                </span>
              </div>
              <div className="space-y-2.5">
                {grouped[col.key].map((task) => {
                  const due = dueLabel(task.due_date);
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggingId(task.id)}
                      onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                      className={cn(
                        'group cursor-grab rounded-xl border border-ink-200/70 bg-white p-3.5 shadow-soft transition-all active:cursor-grabbing hover:shadow-card hover:-translate-y-0.5 dark:border-white/[0.06] dark:bg-ink-850/60',
                        draggingId === task.id && 'opacity-40',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-ink-900 dark:text-white">{task.title}</p>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-ink-500 dark:text-ink-400">{task.description}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        {task.project ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-ink-500 dark:text-ink-400">
                            <FolderKanban className="h-3 w-3" /> {task.project.name}
                          </span>
                        ) : <span />}
                        {task.assignee && (
                          <Avatar name={task.assignee.name} src={task.assignee.avatar_url} size="xs" />
                        )}
                      </div>
                      <div className="mt-2.5 flex items-center justify-between border-t border-ink-100 pt-2.5 dark:border-white/[0.06]">
                        <span
                          className={cn(
                            'flex items-center gap-1 text-[11px] font-medium',
                            due.tone === 'overdue' ? 'text-danger-600' : due.tone === 'soon' ? 'text-warning-600' : 'text-ink-500 dark:text-ink-400',
                          )}
                        >
                          <CalendarClock className="h-3 w-3" /> {due.label}
                        </span>
                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => openEdit(task)} className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:text-ink-500 dark:hover:bg-ink-700/40 dark:hover:text-ink-200">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(task)} className="rounded-md p-1 text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:text-ink-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {grouped[col.key].length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-ink-200 text-xs text-ink-400 dark:border-white/[0.06] dark:text-ink-500">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500 dark:border-white/[0.06] dark:bg-ink-900/40 dark:text-ink-400">
                  <th className="px-5 py-3">Task</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="hidden px-5 py-3 md:table-cell">Assignee</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Priority</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Due</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-white/[0.06]">
                {tasks.map((task) => {
                  const due = dueLabel(task.due_date);
                  return (
                    <tr key={task.id} className="group transition-colors hover:bg-ink-50/50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink-900 dark:text-white">{task.title}</p>
                        {task.description && <p className="truncate text-xs text-ink-500 dark:text-ink-400">{task.description}</p>}
                      </td>
                      <td className="px-5 py-3 text-ink-600 dark:text-ink-300">{task.project?.name ?? '—'}</td>
                      <td className="hidden px-5 py-3 md:table-cell">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={task.assignee.name} src={task.assignee.avatar_url} size="xs" />
                            <span className="text-ink-700 dark:text-ink-200">{task.assignee.name}</span>
                          </div>
                        ) : <span className="text-ink-400 dark:text-ink-500">Unassigned</span>}
                      </td>
                      <td className="px-5 py-3"><TaskStatusBadge status={task.status} /></td>
                      <td className="hidden px-5 py-3 sm:table-cell"><PriorityBadge priority={task.priority} /></td>
                      <td className="hidden px-5 py-3 lg:table-cell">
                        <span className={cn('text-xs font-medium', due.tone === 'overdue' ? 'text-danger-600' : due.tone === 'soon' ? 'text-warning-600' : 'text-ink-500 dark:text-ink-400')}>
                          {due.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(task)} className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(task)} className="h-8 w-8 text-danger-500 hover:bg-danger-50 hover:text-danger-600">
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
        </Card>
      )}

      {tasks.length === 0 && !loading && (
        <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
          <EmptyState
            icon={CheckSquare}
            title="No tasks yet"
            description="Create your first task to start tracking work."
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Task</Button>}
          />
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Task' : 'Add Task'}
        description={editing ? 'Update task details.' : 'Create a new work item.'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Save changes' : 'Create task'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Task title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Design new header" />
          </Field>
          <Field label="Description">
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add more detail…" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Project">
              <Select value={form.project_id ?? ''} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="Select project">
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Assignee">
              <Select value={form.assignee_id ?? ''} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })} placeholder="Select person">
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Due date">
                <Input type="date" value={form.due_date ?? ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </Field>
            </div>
          </div>
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
        title="Delete task?"
        message={`This will permanently delete "${deleteTarget?.title}".`}
        confirmLabel="Delete"
        loading={deleting}
        destructive
      />
    </div>
  );
}
