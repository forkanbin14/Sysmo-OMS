import { useMemo, useState } from 'react';
import { CalendarClock, Plus, Clock, MapPin, Users, Pencil, Trash2, Video } from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { Meeting, MeetingInput } from '@/types/database';
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
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { IconBadge } from '@/components/ui/IconBadge';
import { cn, formatDate } from '@/lib/utils';

interface MeetingsProps {
  data: AppData;
}

const emptyForm: MeetingInput = {
  title: '',
  agenda: '',
  meeting_date: new Date().toISOString().slice(0, 10),
  start_time: '09:00',
  duration_minutes: 30,
  location: '',
  attendees: [],
};

const PEOPLE = [
  'Marcus Johnson', 'Sarah Chen', 'Emily Rodriguez', 'David Kim',
  'Olivia Williams', 'James Patel', 'Sophia Martinez', 'Michael Brown',
  'Ava Thompson', 'Ryan Garcia',
];

export function Meetings({ data }: MeetingsProps) {
  const { meetings, loading, refresh } = data;
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [form, setForm] = useState<MeetingInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { upcoming, past } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const up = meetings.filter((m) => m.meeting_date >= today).sort((a, b) => a.meeting_date.localeCompare(b.meeting_date));
    const pt = meetings.filter((m) => m.meeting_date < today).sort((a, b) => b.meeting_date.localeCompare(a.meeting_date));
    return { upcoming: up, past: pt };
  }, [meetings]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(m: Meeting) {
    setEditing(m);
    setForm({
      title: m.title,
      agenda: m.agenda ?? '',
      meeting_date: m.meeting_date,
      start_time: m.start_time.slice(0, 5),
      duration_minutes: m.duration_minutes,
      location: m.location ?? '',
      attendees: m.attendees ?? [],
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setFormError('Meeting title is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = { ...form, duration_minutes: Number(form.duration_minutes) || 30, location: form.location || null };
    const { error } = editing
      ? await supabase.from('meetings').update(payload).eq('id', editing.id)
      : await supabase.from('meetings').insert(payload);
    setSaving(false);
    if (error) {
      setFormError(error.message);
      toast.error('Could not save meeting', error.message);
      return;
    }
    toast.success(editing ? 'Meeting updated' : 'Meeting scheduled', form.title);
    setModalOpen(false);
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('meetings').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error('Could not delete meeting', error.message);
      return;
    }
    toast.success('Meeting deleted', deleteTarget.title);
    setDeleteTarget(null);
    refresh();
  }

  function toggleAttendee(name: string) {
    setForm((f) => ({
      ...f,
      attendees: f.attendees.includes(name) ? f.attendees.filter((a) => a !== name) : [...f.attendees, name],
    }));
  }

  function MeetingCard({ m, isPast }: { m: Meeting; isPast: boolean }) {
    const meetingDate = new Date(m.meeting_date);
    const day = meetingDate.toLocaleDateString('en-US', { weekday: 'short' });
    const dateNum = meetingDate.getDate();
    const month = meetingDate.toLocaleDateString('en-US', { month: 'short' });
    const isToday = m.meeting_date === new Date().toISOString().slice(0, 10);
    return (
      <Card hover className={cn('group p-5', isPast && 'opacity-75', 'dark:bg-ink-850/60 dark:border-white/[0.06]')}>
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-14 w-14 flex-col items-center justify-center rounded-2xl shrink-0',
              isToday ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white' : isPast ? 'bg-ink-100 text-ink-500 dark:bg-ink-700/40 dark:text-ink-400' : 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
            )}
          >
            <span className="text-[10px] font-semibold uppercase">{day}</span>
            <span className="font-display text-xl font-bold leading-none">{dateNum}</span>
            <span className="text-[9px] uppercase">{month}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-display text-base font-semibold text-ink-900 dark:text-white">{m.title}</h3>
                <p className="mt-0.5 line-clamp-1 text-sm text-ink-500 dark:text-ink-400">{m.agenda ?? 'No agenda set'}</p>
              </div>
              <div className="flex shrink-0 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" onClick={() => openEdit(m)} className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(m)} className="h-8 w-8 text-danger-500 hover:bg-danger-50 hover:text-danger-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-500 dark:text-ink-400">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {m.start_time.slice(0, 5)} · {m.duration_minutes}m</span>
              {m.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {m.location}</span>}
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {m.attendees.length} attending</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {m.attendees.slice(0, 5).map((a) => (
                <Badge key={a} tone="neutral" soft>{a}</Badge>
              ))}
              {m.attendees.length > 5 && <Badge tone="neutral" soft>+{m.attendees.length - 5} more</Badge>}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        description={`${upcoming.length} upcoming · ${past.length} past`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Schedule Meeting
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 dark:bg-ink-850/60 dark:border-white/[0.06]">
              <div className="flex gap-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
          <EmptyState
            icon={CalendarClock}
            title="No meetings scheduled"
            description="Schedule your first meeting to keep the team aligned."
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Schedule Meeting</Button>}
          />
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <IconBadge icon={CalendarClock} tone="brand" size="sm" />
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">Upcoming</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 stagger">
                {upcoming.map((m) => <MeetingCard key={m.id} m={m} isPast={false} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <IconBadge icon={Clock} tone="neutral" size="sm" />
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">Past Meetings</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {past.map((m) => <MeetingCard key={m.id} m={m} isPast />)}
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Meeting' : 'Schedule Meeting'}
        description={editing ? 'Update meeting details.' : 'Plan a new meeting with your team.'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Save changes' : 'Schedule'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Meeting title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Weekly Standup" />
          </Field>
          <Field label="Agenda">
            <Textarea value={form.agenda ?? ''} onChange={(e) => setForm({ ...form, agenda: e.target.value })} placeholder="What will be discussed?" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Date">
              <Input type="date" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} />
            </Field>
            <Field label="Start time">
              <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </Field>
            <Field label="Duration (min)">
              <Select value={String(form.duration_minutes)} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </Select>
            </Field>
          </div>
          <Field label="Location">
            <Input value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Room A — 2nd Floor" />
          </Field>
          <Field label="Attendees" hint="Tap to add or remove people">
            <div className="flex flex-wrap gap-2 rounded-xl border border-ink-200 bg-white p-3 dark:border-white/[0.06] dark:bg-ink-850/60">
              {PEOPLE.map((name) => {
                const selected = form.attendees.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleAttendee(name)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-all',
                      selected ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-700/40 dark:text-ink-300 dark:hover:bg-white/5',
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
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
        title="Delete meeting?"
        message={`This will remove "${deleteTarget?.title}" from the calendar.`}
        confirmLabel="Delete"
        loading={deleting}
        destructive
      />
    </div>
  );
}
