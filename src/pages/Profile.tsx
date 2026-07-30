import { useState } from 'react';
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  FileText,
  Pencil,
  X,
  Plus,
  Shield,
  Building2,
  Briefcase,
  Check,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { Profile, ProfileInput } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

interface ProfilePageProps {
  data: AppData;
}

export function ProfilePage({ data }: ProfilePageProps) {
  const { profiles, employees, departments, tasks, projects, refresh, loading } = data;
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [search, setSearch] = useState('');

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId) ?? employees[0];
  const selectedProfile = profiles.find((p) => p.employee_id === selectedEmployee?.id);

  const empTasks = tasks.filter((t) => t.assignee_id === selectedEmployee?.id);
  const empProjects = projects.filter((p) =>
    tasks.some((t) => t.project_id === p.id && t.assignee_id === selectedEmployee?.id),
  );
  const completedTasks = empTasks.filter((t) => t.status === 'done').length;
  const completionRate = empTasks.length ? Math.round((completedTasks / empTasks.length) * 100) : 0;

  const profileFields = [
    selectedProfile?.bio,
    selectedProfile?.location,
    selectedProfile?.timezone,
    selectedProfile?.website,
    selectedProfile?.skills?.length,
    selectedEmployee?.avatar_url,
  ];
  const filled = profileFields.filter(Boolean).length;
  const profileCompletion = Math.round((filled / profileFields.length) * 100);

  const filteredEmployees = employees.filter((e) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.position ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  function openEdit() {
    if (!selectedProfile) return;
    setForm({
      cover_url: selectedProfile.cover_url,
      bio: selectedProfile.bio,
      location: selectedProfile.location,
      timezone: selectedProfile.timezone,
      website: selectedProfile.website,
      linkedin_url: selectedProfile.linkedin_url,
      github_url: selectedProfile.github_url,
      skills: selectedProfile.skills ?? [],
      resume_url: selectedProfile.resume_url,
      role: selectedProfile.role,
    });
    setSkillInput('');
    setEditing(true);
  }

  function addSkill() {
    if (!form || !skillInput.trim()) return;
    if (form.skills.includes(skillInput.trim())) return;
    setForm({ ...form, skills: [...form.skills, skillInput.trim()] });
    setSkillInput('');
  }

  function removeSkill(skill: string) {
    if (!form) return;
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  }

  async function handleSave() {
    if (!form || !selectedProfile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', selectedProfile.id);
    setSaving(false);
    if (error) {
      toast.error('Could not save profile', error.message);
      return;
    }
    toast.success('Profile updated', selectedEmployee?.name ?? '');
    setEditing(false);
    refresh();
  }

  if (loading || !selectedEmployee) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profile" description="Rich employee profiles" />
        <Card className="h-96 animate-pulse dark:bg-ink-850/60 dark:border-white/[0.06]" />
      </div>
    );
  }

  const dept = departments.find((d) => d.id === selectedEmployee.department_id);

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        title="Profiles"
        description="Rich employee profiles with skills, bio and more"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
        {/* Employee list */}
        <Card className="h-fit lg:sticky lg:top-20 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="border-b border-ink-100 p-3 dark:border-white/[0.06]">
            <Input
              placeholder="Search people…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[60vh] space-y-0.5 overflow-y-auto p-2">
            {filteredEmployees.map((emp) => {
              const active = emp.id === selectedEmployee.id;
              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors',
                    active ? 'bg-brand-500/10 ring-1 ring-inset ring-brand-500/20' : 'hover:bg-ink-50 dark:hover:bg-white/[0.03]',
                  )}
                >
                  <Avatar name={emp.name} src={emp.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink-900 dark:text-white">{emp.name}</p>
                    <p className="truncate text-xs text-ink-500 dark:text-ink-400">{emp.position}</p>
                  </div>
                  {active && <div className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Profile detail */}
        <div className="space-y-4">
          {/* Cover + avatar */}
          <Card className="overflow-hidden p-0 dark:bg-ink-850/60 dark:border-white/[0.06]">
            <div className="relative h-40 sm:h-52">
              {selectedProfile?.cover_url ? (
                <img
                  src={selectedProfile.cover_url}
                  alt="Cover"
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <button
                onClick={openEdit}
                className="absolute right-4 top-4 flex h-9 items-center gap-1.5 rounded-xl bg-white/20 px-3 text-[13px] font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            </div>

            <div className="px-5 pb-5">
              <div className="-mt-12 flex flex-col items-start gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                <div className="relative">
                  <Avatar
                    name={selectedEmployee.name}
                    src={selectedEmployee.avatar_url}
                    size="xl"
                    ring
                    className="!h-24 !w-24 !text-2xl ring-4 ring-white shadow-float dark:ring-ink-850 sm:!h-28 sm:!w-28"
                  />
                  <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-success-500 ring-2 ring-white dark:ring-ink-850">
                    <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 sm:pb-2">
                  <Badge tone="brand" soft>
                    <Shield className="mr-1 h-3 w-3" />
                    {selectedProfile?.role ?? selectedEmployee.role}
                  </Badge>
                  {selectedEmployee.status === 'active' && (
                    <Badge tone="success" soft>Active</Badge>
                  )}
                  {selectedEmployee.status === 'on-leave' && (
                    <Badge tone="warning" soft>On Leave</Badge>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h2 className="font-display text-xl font-bold text-ink-900 dark:text-white sm:text-2xl">
                  {selectedEmployee.name}
                </h2>
                <p className="mt-0.5 text-[15px] font-medium text-brand-600 dark:text-brand-400">
                  {selectedEmployee.position ?? 'No position set'}
                </p>
                {selectedProfile?.bio && (
                  <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-600 dark:text-ink-300">
                    {selectedProfile.bio}
                  </p>
                )}
              </div>

              {/* Contact row */}
              <div className="mt-4 flex flex-wrap gap-2">
                <ContactChip icon={Mail} text={selectedEmployee.email} />
                {selectedEmployee.phone && <ContactChip icon={Phone} text={selectedEmployee.phone} />}
                {selectedProfile?.location && <ContactChip icon={MapPin} text={selectedProfile.location} />}
                {selectedProfile?.timezone && <ContactChip icon={Globe} text={selectedProfile.timezone} />}
                {selectedProfile?.website && <ContactChip icon={Globe} text={selectedProfile.website} link />}
                {selectedProfile?.linkedin_url && <ContactChip icon={Linkedin} text="LinkedIn" link />}
                {selectedProfile?.github_url && <ContactChip icon={Github} text="GitHub" link />}
              </div>
            </div>
          </Card>

          {/* Stats + completion */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
              <CardContent className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Briefcase className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-xl font-bold text-ink-900 dark:text-white">{empProjects.length}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Projects involved</p>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
              <CardContent className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-xl font-bold text-ink-900 dark:text-white">{completionRate}%</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Task completion</p>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
              <CardContent className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-500/10 text-success-600 dark:text-success-400">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-ink-900 dark:text-white">{dept?.name ?? 'Unassigned'}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Department</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills */}
          <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
            <CardHeader>
              <div>
                <CardTitle>Skill Matrix</CardTitle>
                <CardDescription>Expertise and technologies</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {selectedProfile?.skills && selectedProfile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ink-100 px-3 py-1.5 text-[13px] font-medium text-ink-700 ring-1 ring-ink-200 dark:bg-white/[0.05] dark:text-ink-200 dark:ring-white/[0.08]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-ink-400 dark:text-ink-500">No skills listed yet. Edit the profile to add some.</p>
              )}
            </CardContent>
          </Card>

          {/* Experience / history */}
          <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
            <CardHeader>
              <div>
                <CardTitle>Experience</CardTitle>
                <CardDescription>Role and tenure</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Briefcase className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-ink-900 dark:text-white">{selectedEmployee.position}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{dept?.name ?? 'Unassigned'} · Since {formatDate(selectedEmployee.hire_date, { month: 'short', year: 'numeric' })}</p>
                </div>
                <span className="text-[13px] font-semibold tabular text-ink-700 dark:text-ink-200">{formatCurrency(selectedEmployee.salary)}</span>
              </div>

              {selectedProfile?.resume_url && (
                <a
                  href={selectedProfile.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 transition-colors hover:bg-ink-50 dark:border-white/[0.08] dark:hover:bg-white/[0.03]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-ink-900 dark:text-white">Resume / CV</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">View document</p>
                  </div>
                </a>
              )}
            </CardContent>
          </Card>

          {/* Profile completion */}
          <div className="rounded-2xl bg-gradient-to-r from-brand-50 to-accent-50 p-4 ring-1 ring-brand-100 dark:from-brand-500/10 dark:to-accent-500/10 dark:ring-brand-500/20">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-500 dark:text-brand-400" />
                <span className="text-sm font-semibold text-ink-800 dark:text-white">Profile completion</span>
              </div>
              <span className="font-display text-sm font-bold text-brand-700 dark:text-brand-400">{profileCompletion}%</span>
            </div>
            <ProgressBar value={profileCompletion} barClassName="bg-gradient-to-r from-brand-500 to-accent-500" />
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit Profile"
        description={selectedEmployee.name}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}><Check className="h-4 w-4" /> Save changes</Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            {/* Cover URL */}
            <Field label="Cover photo URL" hint="A wide landscape image for your profile banner.">
              <Input
                value={form.cover_url ?? ''}
                onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                placeholder="https://…"
              />
            </Field>

            {/* Bio */}
            <Field label="Bio">
              <Textarea
                rows={3}
                value={form.bio ?? ''}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell us about yourself…"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Location">
                <Input value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="San Francisco, CA" />
              </Field>
              <Field label="Timezone">
                <Input value={form.timezone ?? ''} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="PST (UTC-8)" />
              </Field>
              <Field label="Website">
                <Input value={form.website ?? ''} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://yoursite.com" />
              </Field>
              <Field label="LinkedIn URL">
                <Input value={form.linkedin_url ?? ''} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/…" />
              </Field>
              <Field label="GitHub URL">
                <Input value={form.github_url ?? ''} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/…" />
              </Field>
              <Field label="Resume / CV URL">
                <Input value={form.resume_url ?? ''} onChange={(e) => setForm({ ...form, resume_url: e.target.value })} placeholder="https://…pdf" />
              </Field>
              <Field label="Role">
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="member / admin / lead" />
              </Field>
            </div>

            {/* Skills editor */}
            <Field label="Skills" hint="Press Enter or click Add to add a skill.">
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  placeholder="e.g. TypeScript"
                />
                <Button variant="secondary" onClick={addSkill} type="button">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              {form.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ink-100 px-3 py-1.5 text-[13px] font-medium text-ink-700 ring-1 ring-ink-200 dark:bg-white/[0.05] dark:text-ink-200 dark:ring-white/[0.08]"
                    >
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="text-ink-400 hover:text-danger-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ContactChip({ icon: Icon, text, link }: { icon: typeof Mail; text: string; link?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600 ring-1 ring-ink-200 dark:bg-white/5 dark:text-ink-300 dark:ring-white/[0.06]">
      <Icon className="h-3.5 w-3.5 text-ink-400 dark:text-ink-500" />
      {text}
      {link && <span className="text-brand-500">↗</span>}
    </span>
  );
}
