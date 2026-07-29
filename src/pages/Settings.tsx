import { useState } from 'react';
import {
  User,
  Bell,
  Palette,
  Shield,
  Globe,
  Zap,
  Mail,
  Lock,
  Smartphone,
  Moon,
  Sun,
  Monitor,
  Check,
  Sparkles,
  Building,
  CreditCard,
  Key,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Field, Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'security' | 'workspace' | 'billing';

const tabs: { key: SettingsTab; label: string; icon: typeof User }[] = [
  { key: 'profile',       label: 'Profile',        icon: User },
  { key: 'notifications', label: 'Notifications',  icon: Bell },
  { key: 'appearance',    label: 'Appearance',     icon: Palette },
  { key: 'security',      label: 'Security',       icon: Shield },
  { key: 'workspace',     label: 'Workspace',      icon: Building },
  { key: 'billing',       label: 'Billing',        icon: CreditCard },
];

export function Settings() {
  const [tab, setTab] = useState<SettingsTab>('profile');

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account, preferences and workspace" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Tab sidebar */}
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-brand-600/15 text-brand-300 ring-1 ring-inset ring-brand-500/20'
                    : 'text-ink-300 hover:bg-white/[0.04] hover:text-white',
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-brand-400' : 'text-ink-400')} />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {tab === 'profile' && <ProfileSettings />}
          {tab === 'notifications' && <NotificationSettings />}
          {tab === 'appearance' && <AppearanceSettings />}
          {tab === 'security' && <SecuritySettings />}
          {tab === 'workspace' && <WorkspaceSettings />}
          {tab === 'billing' && <BillingSettings />}
        </div>
      </div>
    </div>
  );
}

/* ── Section wrapper ── */
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="p-6 dark:bg-ink-850/60 dark:border-white/[0.06]">
      <div className="mb-5">
        <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">{title}</h3>
        {description && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

/* ── Toggle switch ── */
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
        enabled ? 'bg-brand-500' : 'bg-ink-200 dark:bg-ink-700',
      )}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform duration-200',
          enabled ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

/* ── Profile ── */
function ProfileSettings() {
  return (
    <div className="space-y-5">
      <Section title="Profile photo" description="This appears on your profile and across the workspace">
        <div className="flex items-center gap-5">
          <Avatar name="Alex Rivera" size="xl" ring />
          <div className="space-y-2">
            <Button variant="outline" size="sm">Upload new photo</Button>
            <p className="text-xs text-ink-400 dark:text-ink-500">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>
      </Section>

      <Section title="Personal information" description="Update your personal details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input defaultValue="Alex Rivera" />
          </Field>
          <Field label="Email address">
            <Input type="email" defaultValue="alex.rivera@office.co" />
          </Field>
          <Field label="Phone number">
            <Input defaultValue="+1 415 555 0199" />
          </Field>
          <Field label="Role">
            <Input defaultValue="Administrator" disabled />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </Section>
    </div>
  );
}

/* ── Notifications ── */
function NotificationSettings() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [taskUpdates, setTaskUpdates] = useState(true);
  const [meetingReminders, setMeetingReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const items = [
    { label: 'Email notifications', desc: 'Receive notifications via email', icon: Mail, value: emailNotif, setter: setEmailNotif },
    { label: 'Push notifications', desc: 'Receive push notifications in browser', icon: Smartphone, value: pushNotif, setter: setPushNotif },
    { label: 'Task updates', desc: 'When a task is assigned or updated', icon: Bell, value: taskUpdates, setter: setTaskUpdates },
    { label: 'Meeting reminders', desc: '15 minutes before scheduled meetings', icon: Bell, value: meetingReminders, setter: setMeetingReminders },
    { label: 'Weekly digest', desc: 'Summary of workspace activity every Monday', icon: Mail, value: weeklyDigest, setter: setWeeklyDigest },
  ];

  return (
    <Section title="Notification preferences" description="Choose what you want to be notified about">
      <div className="divide-y divide-ink-100 dark:divide-white/[0.06]">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-white/5 dark:text-ink-300">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{item.desc}</p>
                </div>
              </div>
              <Toggle enabled={item.value} onChange={item.setter} />
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── Appearance ── */
function AppearanceSettings() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [accent, setAccent] = useState('blue');

  const themes: { key: typeof theme; label: string; icon: typeof Moon }[] = [
    { key: 'dark',   label: 'Dark',   icon: Moon },
    { key: 'light',  label: 'Light',  icon: Sun },
    { key: 'system', label: 'System', icon: Monitor },
  ];

  const accents = [
    { key: 'blue',   color: 'bg-brand-500' },
    { key: 'cyan',   color: 'bg-accent-500' },
    { key: 'green',  color: 'bg-success-500' },
    { key: 'amber',  color: 'bg-warning-500' },
    { key: 'red',    color: 'bg-danger-500' },
  ];

  return (
    <div className="space-y-5">
      <Section title="Theme" description="Choose how Atlas looks to you">
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => {
            const Icon = t.icon;
            const active = theme === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                  active
                    ? 'border-brand-500/40 bg-brand-500/10 ring-1 ring-brand-500/20'
                    : 'border-ink-200 dark:border-white/[0.06] hover:border-ink-300 dark:hover:border-white/[0.10]',
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-brand-400' : 'text-ink-400')} />
                <span className={cn('text-sm font-medium', active ? 'text-brand-300' : 'text-ink-600 dark:text-ink-300')}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Accent color" description="Personalize your interface highlight color">
        <div className="flex items-center gap-3">
          {accents.map((a) => (
            <button
              key={a.key}
              onClick={() => setAccent(a.key)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                a.color,
                accent === a.key ? 'ring-2 ring-offset-2 ring-offset-ink-850 ring-white/30 scale-110' : 'hover:scale-105',
              )}
              aria-label={a.key}
            >
              {accent === a.key && <Check className="h-4 w-4 text-white" />}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ── Security ── */
function SecuritySettings() {
  const [twoFA, setTwoFA] = useState(true);

  return (
    <div className="space-y-5">
      <Section title="Password" description="Update your password regularly to keep your account secure">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Current password">
            <Input type="password" defaultValue="password" />
          </Field>
          <div />
          <Field label="New password">
            <Input type="password" placeholder="Enter new password" />
          </Field>
          <Field label="Confirm password">
            <Input type="password" placeholder="Confirm new password" />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <Button>Update password</Button>
        </div>
      </Section>

      <Section title="Two-factor authentication" description="Add an extra layer of security to your account">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400">
              <Lock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-white">Authenticator app</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">{twoFA ? 'Enabled · using Google Authenticator' : 'Disabled'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {twoFA && <Badge tone="success" dot>Active</Badge>}
            <Toggle enabled={twoFA} onChange={setTwoFA} />
          </div>
        </div>
      </Section>

      <Section title="API keys" description="Manage keys for programmatic access">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-ink-200 dark:border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-white/5 dark:text-ink-300">
              <Key className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-white">Production key</p>
              <p className="font-mono text-xs text-ink-400">atlas_sk_••••••••••••3f8a</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Rotate</Button>
        </div>
      </Section>
    </div>
  );
}

/* ── Workspace ── */
function WorkspaceSettings() {
  return (
    <Section title="Workspace details" description="Manage your organization's workspace">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Workspace name">
          <Input defaultValue="Atlas Headquarters" />
        </Field>
        <Field label="Workspace URL">
          <Input defaultValue="atlas.office.co" />
        </Field>
        <Field label="Time zone">
          <Input defaultValue="America/Los_Angeles (PT)" />
        </Field>
        <Field label="Date format">
          <Input defaultValue="MM/DD/YYYY" />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost">Cancel</Button>
        <Button>Save changes</Button>
      </div>
    </Section>
  );
}

/* ── Billing ── */
function BillingSettings() {
  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden border-brand-500/20 p-6 dark:bg-gradient-to-br dark:from-brand-600/15 dark:to-ink-850/60 dark:border-brand-500/20">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/20 blur-3xl animate-glow-pulse" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-400" />
              <span className="font-display text-lg font-bold text-white">Enterprise Plan</span>
              <Badge tone="brand">Current</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-300">Unlimited employees, projects and AI insights</p>
            <p className="mt-4 font-display text-3xl font-bold text-white">$499<span className="text-base font-medium text-ink-400">/month</span></p>
          </div>
          <Button variant="outline">Manage plan</Button>
        </div>
      </Card>

      <Section title="Payment method" description="Your default payment method">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-ink-200 dark:border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-ink-700 to-ink-900 text-xs font-bold text-white">
              VISA
            </span>
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-white">•••• •••• •••• 4242</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">Expires 12/2027</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Update</Button>
        </div>
      </Section>

      <Section title="Billing history" description="Recent invoices">
        <div className="divide-y divide-ink-100 dark:divide-white/[0.06]">
          {[
            { date: 'Jul 1, 2025', amount: '$499.00', status: 'Paid' },
            { date: 'Jun 1, 2025', amount: '$499.00', status: 'Paid' },
            { date: 'May 1, 2025', amount: '$499.00', status: 'Paid' },
          ].map((inv) => (
            <div key={inv.date} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink-900 dark:text-white">{inv.date}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{inv.amount}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone="success" dot>{inv.status}</Badge>
                <button className="text-xs font-semibold text-brand-500 dark:text-brand-400 hover:text-brand-400">Download</button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
