import { useMemo, useState } from 'react';
import { CalendarCheck, Plus, Clock, LogIn, LogOut, Search } from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { Attendance, AttendanceInput, AttendanceStatus } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AttendanceBadge } from '@/components/ui/StatusBadges';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Field, Input, Select } from '@/components/ui/Input';
import { IconBadge } from '@/components/ui/IconBadge';
import { cn, formatDate, formatTime } from '@/lib/utils';

interface AttendanceProps {
  data: AppData;
}

const statusFilters: { key: AttendanceStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'present', label: 'Present' },
  { key: 'late', label: 'Late' },
  { key: 'remote', label: 'Remote' },
  { key: 'absent', label: 'Absent' },
];

export function Attendance({ data }: AttendanceProps) {
  const { attendance, employees, loading, refresh } = data;
  const toast = useToast();

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AttendanceInput>({
    employee_id: '',
    work_date: new Date().toISOString().slice(0, 10),
    check_in: '09:00',
    check_out: '17:30',
    status: 'present',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const isToday = dateFilter === today;

  const filtered = useMemo(() => {
    return attendance
      .filter((a) => a.work_date === dateFilter)
      .filter((a) => statusFilter === 'all' || a.status === statusFilter)
      .filter((a) => !query || (a.employee?.name ?? '').toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (a.employee?.name ?? '').localeCompare(b.employee?.name ?? ''));
  }, [attendance, dateFilter, statusFilter, query]);

  const summary = useMemo(() => {
    const dayRecords = attendance.filter((a) => a.work_date === dateFilter);
    return {
      present: dayRecords.filter((a) => a.status === 'present').length,
      late: dayRecords.filter((a) => a.status === 'late').length,
      remote: dayRecords.filter((a) => a.status === 'remote').length,
      absent: dayRecords.filter((a) => a.status === 'absent').length,
      total: dayRecords.length,
    };
  }, [attendance, dateFilter]);

  function openCreate() {
    setForm({
      employee_id: employees[0]?.id ?? '',
      work_date: dateFilter,
      check_in: '09:00',
      check_out: '17:30',
      status: 'present',
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.employee_id) {
      setFormError('Please select an employee.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const { error } = await supabase.from('attendance').insert({
      employee_id: form.employee_id,
      work_date: form.work_date,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      status: form.status,
    });
    setSaving(false);
    if (error) {
      const msg = error.code === '23505' ? 'Attendance already recorded for this employee on this date.' : error.message;
      setFormError(msg);
      toast.error('Could not record attendance', msg);
      return;
    }
    toast.success('Attendance recorded', employees.find((e) => e.id === form.employee_id)?.name);
    setModalOpen(false);
    refresh();
  }

  async function quickCheckIn(employeeId: string, status: AttendanceStatus) {
    const { error } = await supabase.from('attendance').upsert(
      {
        employee_id: employeeId,
        work_date: today,
        check_in: new Date().toTimeString().slice(0, 8),
        check_out: null,
        status,
      },
      { onConflict: 'employee_id,work_date' },
    );
    if (error) {
      toast.error('Check-in failed', error.message);
      return;
    }
    toast.success('Checked in', employees.find((e) => e.id === employeeId)?.name);
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track daily check-ins and team presence"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Record Attendance
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Present', value: summary.present, tone: 'success' as const, icon: CalendarCheck },
          { label: 'Late', value: summary.late, tone: 'warning' as const, icon: Clock },
          { label: 'Remote', value: summary.remote, tone: 'accent' as const, icon: LogIn },
          { label: 'Absent', value: summary.absent, tone: 'danger' as const, icon: LogOut },
        ].map((s, i) => (
          <Card key={s.label} hover className="flex items-center gap-3 p-4 animate-slide-in-up" >
            <IconBadge icon={s.icon} tone={s.tone} size="md" />
            <div>
              <p className="font-display text-2xl font-bold text-ink-900">{s.value}</p>
              <p className="text-xs text-ink-500">{s.label} {isToday ? 'today' : 'that day'}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
            {isToday && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Today
              </span>
            )}
          </div>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input placeholder="Search employee…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  statusFilter === f.key ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <Card className="divide-y divide-ink-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarCheck}
            title="No attendance records"
            description={isToday ? 'No check-ins recorded for today yet.' : `No records for ${formatDate(dateFilter)}.`}
            action={isToday ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> Record Attendance</Button> : undefined}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Check In</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Check Out</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Department</th>
                  {isToday && <th className="px-5 py-3 text-right">Quick Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((rec) => (
                  <tr key={rec.id} className="transition-colors hover:bg-ink-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={rec.employee?.name ?? '?'} src={rec.employee?.avatar_url} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-900">{rec.employee?.name ?? 'Unknown'}</p>
                          <p className="truncate text-xs text-ink-500">{rec.employee?.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><AttendanceBadge status={rec.status} /></td>
                    <td className="hidden px-5 py-3 text-ink-600 sm:table-cell">
                      <span className="flex items-center gap-1.5"><LogIn className="h-3.5 w-3.5 text-ink-400" />{formatTime(rec.check_in)}</span>
                    </td>
                    <td className="hidden px-5 py-3 text-ink-600 sm:table-cell">
                      <span className="flex items-center gap-1.5"><LogOut className="h-3.5 w-3.5 text-ink-400" />{formatTime(rec.check_out)}</span>
                    </td>
                    <td className="hidden px-5 py-3 text-ink-600 lg:table-cell">{rec.employee?.department?.name ?? '—'}</td>
                    {isToday && (
                      <td className="px-5 py-3 text-right">
                        {rec.check_in ? (
                          <span className="text-xs text-success-600">Checked in</span>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => quickCheckIn(rec.employee_id, 'present')}>
                            Check in
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Attendance"
        description="Log a check-in for a team member."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Record</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Employee" required>
            <Select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} placeholder="Select employee">
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Work date">
              <Input type="date" value={form.work_date} onChange={(e) => setForm({ ...form, work_date: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AttendanceStatus })}>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="remote">Remote</option>
                <option value="absent">Absent</option>
              </Select>
            </Field>
            <Field label="Check in">
              <Input type="time" value={form.check_in ?? ''} onChange={(e) => setForm({ ...form, check_in: e.target.value })} />
            </Field>
            <Field label="Check out">
              <Input type="time" value={form.check_out ?? ''} onChange={(e) => setForm({ ...form, check_out: e.target.value })} />
            </Field>
          </div>
          {formError && (
            <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700 ring-1 ring-danger-200">
              {formError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
