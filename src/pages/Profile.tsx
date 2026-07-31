import { useState } from 'react';
import {
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
  Users,
  ChevronDown,
  MessageSquare,
  Camera,
  Upload,
} from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { ProfileInput, Employee } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
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
  profileId?: string | null;
  onMessage?: (empId: string) => void;
  onViewProfile?: (empId: string) => void;
}

export function ProfilePage({ data, profileId, onMessage, onViewProfile }: ProfilePageProps) {
  const { profiles, employees, departments, tasks, projects, refresh, loading } = data;
  const toast = useToast();
  const { user: currentUser } = useCurrentUser();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [search, setSearch] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const targetId = profileId ?? currentUser?.id ?? null;
  const selectedEmployee = employees.find((e) => e.id === targetId) ?? employees[0];
  const selectedProfile = profiles.find((p) => p.employee_id === selectedEmployee?.id);
  const isOwnProfile = currentUser?.id === selectedEmployee?.id;

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

  function selectEmployee(id: string) {
    onViewProfile?.(id);
    setListOpen(false);
  }

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

  async function uploadAvatar(file: File) {
    if (!selectedEmployee) return;
    setAvatarUploading(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${selectedEmployee.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from('chat-files').upload(path, file, { upsert: true });
    if (upErr) {
      toast.error('Upload failed', upErr.message);
      setAvatarUploading(false);
      return;
    }
    const url = supabase.storage.from('chat-files').getPublicUrl(path).data.publicUrl;
    const { error: dbErr } = await supabase.from('employees').update({ avatar_url: url }).eq('id', selectedEmployee.id);
    setAvatarUploading(false);
    if (dbErr) {
      toast.error('Could not update avatar', dbErr.message);
      return;
    }
    toast.success('Profile photo updated');
    refresh();
  }

  async function uploadCover(file: File) {
    if (!selectedProfile) return;
    setCoverUploading(true);
    const ext = file.name.split('.').pop();
    const path = `covers/${selectedProfile.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from('chat-files').upload(path, file, { upsert: true });
    if (upErr) {
      toast.error('Upload failed', upErr.message);
      setCoverUploading(false);
      return;
    }
    const url = supabase.storage.from('chat-files').getPublicUrl(path).data.publicUrl;
    const { error: dbErr } = await supabase.from('profiles').update({ cover_url: url, updated_at: new Date().toISOString() }).eq('id', selectedProfile.id);
    setCoverUploading(false);
    if (dbErr) {
      toast.error('Could not update cover', dbErr.message);
      return;
    }
    toast.success('Cover photo updated');
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
        title={isOwnProfile ? 'My Profile' : 'Profile'}
        description={isOwnProfile ? 'Manage your profile, skills and resume' : `${selectedEmployee.name}'s profile`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* Desktop sidebar: employee list */}
        <Card className="hidden h-fit lg:block lg:sticky lg:top-20 dark:bg-ink-850/60 dark:border-white/[0.06]">
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
                  onClick={() => selectEmployee(emp.id)}
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

        {/* Mobile: avatar strip + collapsible list */}
        <div className="lg:hidden">
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {employees.map((emp) => {
              const active = emp.id === selectedEmployee.id;
              return (
                <button
                  key={emp.id}
                  onClick={() => selectEmployee(emp.id)}
                  className="group flex shrink-0 flex-col items-center gap-1.5"
                >
                  <span className={cn(
                    'rounded-full p-0.5 transition-all',
                    active ? 'bg-brand-500 ring-2 ring-brand-500/30' : 'ring-1 ring-ink-200 dark:ring-white/[0.08]',
                  )}>
                    <Avatar name={emp.name} src={emp.avatar_url} size="md" />
                  </span>
                  <span className={cn(
                    'max-w-[64px] truncate text-[10px] font-medium',
                    active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-ink-400',
                  )}>
                    {emp.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setListOpen((v) => !v)}
            className="mt-1 flex w-full items-center justify-between rounded-xl border border-ink-200 px-3 py-2.5 text-[13px] font-medium text-ink-600 transition-colors hover:bg-ink-50 dark:border-white/[0.08] dark:text-ink-300 dark:hover:bg-white/[0.03]"
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-ink-400" />
              {filteredEmployees.length} people
            </span>
            <ChevronDown className={cn('h-4 w-4 text-ink-400 transition-transform', listOpen && 'rotate-180')} />
          </button>

          {listOpen && (
            <div className="mt-2 rounded-xl border border-ink-200 dark:border-white/[0.08]">
              <div className="border-b border-ink-100 p-2 dark:border-white/[0.06]">
                <Input
                  placeholder="Search people…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="max-h-64 space-y-0.5 overflow-y-auto p-1.5">
                {filteredEmployees.map((emp) => {
                  const active = emp.id === selectedEmployee.id;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => selectEmployee(emp.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors',
                        active ? 'bg-brand-500/10' : 'hover:bg-ink-50 dark:hover:bg-white/[0.03]',
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
            </div>
          )}
        </div>

        {/* Profile detail */}
        <div className="space-y-4">
          {/* Cover + avatar */}
          <Card className="overflow-hidden p-0 dark:bg-ink-850/60 dark:border-white/[0.06]">
            <div className="relative h-32 sm:h-44 lg:h-52">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              {/* Cover upload (own profile only) */}
              {isOwnProfile && (
                <label className="absolute right-3 top-3 flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-white/20 px-3 text-[13px] font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30 active:scale-95 sm:right-4 sm:top-4">
                  {coverUploading ? <span className="text-[11px]">Uploading…</span> : (<><Camera className="h-3.5 w-3.5" /> Cover</>)}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }}
                  />
                </label>
              )}
            </div>

            <div className="px-4 pb-5 sm:px-5">
              <div className="-mt-10 flex flex-col items-start gap-3 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                <div className="relative">
                  <Avatar
                    name={selectedEmployee.name}
                    src={selectedEmployee.avatar_url}
                    size="xl"
                    ring
                    className="!h-20 !w-20 !text-xl ring-4 ring-white shadow-float dark:ring-ink-850 sm:!h-28 sm:!w-28 sm:!text-2xl"
                  />
                  {/* Avatar upload (own profile only) */}
                  {isOwnProfile && (
                    <label className="absolute bottom-1 right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white shadow-soft ring-2 ring-white transition-transform hover:scale-110 dark:ring-ink-850">
                      {avatarUploading ? (
                        <span className="h-2 w-2 animate-spin rounded-full border border-white/40 border-t-white" />
                      ) : (
                        <Camera className="h-3.5 w-3.5" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
                      />
                    </label>
                  )}
                  <span className="absolute left-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-success-500 ring-2 ring-white dark:ring-ink-850 sm:h-7 sm:w-7">
                    <span className="h-2 w-2 rounded-full bg-white sm:h-2.5 sm:w-2.5" />
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:pb-2">
                  <Badge tone="brand" soft>
                    <Shield className="mr-1 h-3 w-3" />
                    {selectedProfile?.role ?? selectedEmployee.role}
                  </Badge>
                  {selectedEmployee.status === 'active' && <Badge tone="success" soft>Active</Badge>}
                  {selectedEmployee.status === 'on-leave' && <Badge tone="warning" soft>On Leave</Badge>}
                  {/* Message button — only on OTHER profiles */}
                  {!isOwnProfile && onMessage && (
                    <Button size="sm" onClick={() => onMessage(selectedEmployee.id)}>
                      <MessageSquare className="h-3.5 w-3.5" /> Message
                    </Button>
                  )}
                  {/* Edit button — only on OWN profile */}
                  {isOwnProfile && (
                    <Button size="sm" onClick={openEdit}>
                      <Pencil className="h-3.5 w-3.5" /> Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white sm:text-2xl">
                  {selectedEmployee.name}
                </h2>
                <p className="mt-0.5 text-sm font-medium text-brand-600 dark:text-brand-400 sm:text-[15px]">
                  {selectedEmployee.position ?? 'No position set'}
                </p>
                {selectedProfile?.bio && (
                  <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-ink-600 dark:text-ink-300 sm:text-[14px]">
                    {selectedProfile.bio}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <ContactChip icon={Mail} text={selectedEmployee.email} />
                {selectedEmployee.phone && <ContactChip icon={Phone} text={selectedEmployee.phone} />}
                {selectedProfile?.location && <ContactChip icon={MapPin} text={selectedProfile.location} />}
                {selectedProfile?.timezone && <ContactChip icon={Globe} text={selectedProfile.timezone} />}
                {selectedProfile?.website && <ContactChip icon={Globe} text="Website" link />}
                {selectedProfile?.linkedin_url && <ContactChip icon={Linkedin} text="LinkedIn" link />}
                {selectedProfile?.github_url && <ContactChip icon={Github} text="GitHub" link />}
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
              <CardContent className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 sm:h-11 sm:w-11">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold text-ink-900 dark:text-white sm:text-xl">{empProjects.length}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Projects</p>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
              <CardContent className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400 sm:h-11 sm:w-11">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold text-ink-900 dark:text-white sm:text-xl">{completionRate}%</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Task completion</p>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
              <CardContent className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-500/10 text-success-600 dark:text-success-400 sm:h-11 sm:w-11">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-ink-900 dark:text-white">{dept?.name ?? 'Unassigned'}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Department</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills + Experience */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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

            <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
              <CardHeader>
                <div>
                  <CardTitle>Experience</CardTitle>
                  <CardDescription>Role and tenure</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink-900 dark:text-white">{selectedEmployee.position}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">{dept?.name ?? 'Unassigned'} · Since {formatDate(selectedEmployee.hire_date, { month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold tabular text-ink-700 dark:text-ink-200">{formatCurrency(selectedEmployee.salary)}</span>
                </div>

                {selectedProfile?.resume_url && (
                  <a
                    href={selectedProfile.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 transition-colors hover:bg-ink-50 dark:border-white/[0.08] dark:hover:bg-white/[0.03]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink-900 dark:text-white">Resume / CV</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">View document</p>
                    </div>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile completion (own only) */}
          {isOwnProfile && (
            <div className="rounded-2xl bg-gradient-to-r from-brand-50 to-accent-50 p-4 ring-1 ring-brand-100 dark:from-brand-500/10 dark:to-accent-500/10 dark:ring-brand-500/20">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-500 dark:text-brand-400" />
                  <span className="text-sm font-semibold text-ink-800 dark:text-white">Profile completion</span>
                </div>
                <span className="font-display text-sm font-bold text-brand-700 dark:text-brand-400">{profileCompletion}%</span>
              </div>
              <ProgressBar value={profileCompletion} barClassName="bg-gradient-to-r from-brand-500 to-accent-500" />
              {profileCompletion < 100 && (
                <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">Add a cover photo, skills and resume to reach 100%</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal — own profile only */}
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit My Profile"
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
            <Field label="Cover photo URL" hint="Paste an image URL, or use the camera button on the cover.">
              <Input
                value={form.cover_url ?? ''}
                onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                placeholder="https://…"
              />
            </Field>

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

            <Field label="Skills" hint="Press Enter or click Add to add a skill.">
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  placeholder="e.g. TypeScript"
                />
                <Button variant="secondary" onClick={addSkill} type="button" className="shrink-0">
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
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600 ring-1 ring-ink-200 dark:bg-white/5 dark:text-ink-300 dark:ring-white/[0.06]">
      <Icon className="h-3.5 w-3.5 shrink-0 text-ink-400 dark:text-ink-500" />
      <span className="truncate">{text}</span>
      {link && <span className="shrink-0 text-brand-500">↗</span>}
    </span>
  );
}
