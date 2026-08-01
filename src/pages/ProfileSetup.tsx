import { useState } from 'react';
import { User, Briefcase, Phone, MapPin, Sparkles, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function ProfileSetupPage() {
  const { employee, completeProfile, signOut, accountStatus } = useAuth();
  const [name, setName] = useState(employee?.name ?? '');
  const [position, setPosition] = useState(employee?.position ?? '');
  const [phone, setPhone] = useState(employee?.phone ?? '');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Please enter your name'); return; }
    setLoading(true);
    const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const { error } = await completeProfile({ name: name.trim(), position: position.trim() || undefined, phone: phone.trim() || undefined, bio: bio.trim() || undefined, location: location.trim() || undefined, skills: skills.length ? skills : undefined });
    setLoading(false);
    if (error) { setError(error); return; }
    setDone(true);
  }

  if (accountStatus === 'rejected') {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-925 p-4">
        <div className="relative w-full max-w-md text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-500/15 ring-1 ring-danger-500/25">
            <Clock className="h-8 w-8 text-danger-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Account not approved</h1>
          <p className="mt-2 text-sm text-ink-400">Your account has not been approved by the administrator. Please contact your admin for assistance.</p>
          <Button variant="outline" className="mt-6" onClick={() => signOut()}>Sign out</Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-925 p-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-success-600/20 blur-3xl" />
        </div>
        <div className="relative w-full max-w-md text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success-500/15 ring-1 ring-success-500/25">
            <CheckCircle2 className="h-8 w-8 text-success-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Profile saved</h1>
          <p className="mt-2 text-sm text-ink-400">
            Your profile is complete. An administrator will review and approve your account.
            Once approved, you'll get full access to the platform.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <div className="inline-flex items-center justify-center gap-2 rounded-lg bg-warning-500/10 px-4 py-2 text-sm text-warning-400 ring-1 ring-warning-500/20">
              <Clock className="h-4 w-4" /> Awaiting admin approval
            </div>
            <Button variant="outline" className="mt-2" onClick={() => signOut()}>Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-925 p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent-600/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Set up your profile</h1>
          <p className="mt-1 text-sm text-ink-400">Welcome! Fill in your details to get started.</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-ink-850/80 p-6 shadow-dark-float backdrop-blur-2xl sm:p-8">
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-warning-500/10 px-3 py-2 text-[13px] text-warning-400 ring-1 ring-warning-500/20">
            <Clock className="h-4 w-4" />
            Your account is pending admin approval
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field icon={<User className="h-4 w-4" />}>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full bg-transparent text-sm text-white placeholder:text-ink-500 focus:outline-none" required />
            </Field>
            <Field icon={<Briefcase className="h-4 w-4" />}>
              <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Job title / position" className="w-full bg-transparent text-sm text-white placeholder:text-ink-500 focus:outline-none" />
            </Field>
            <Field icon={<Phone className="h-4 w-4" />}>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="w-full bg-transparent text-sm text-white placeholder:text-ink-500 focus:outline-none" />
            </Field>
            <Field icon={<MapPin className="h-4 w-4" />}>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full bg-transparent text-sm text-white placeholder:text-ink-500 focus:outline-none" />
            </Field>
            <div>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio about yourself" rows={3} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-500 transition-colors focus:border-brand-500/40 focus:bg-white/[0.05] focus:outline-none" />
            </div>
            <Field icon={<Sparkles className="h-4 w-4" />}>
              <input type="text" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="Skills (comma separated)" className="w-full bg-transparent text-sm text-white placeholder:text-ink-500 focus:outline-none" />
            </Field>

            {error && (
              <div className="rounded-lg border border-danger-500/20 bg-danger-500/10 px-3 py-2 text-[13px] text-danger-300">{error}</div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Save profile
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink-600">
          You'll get access once the admin approves your account
        </p>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 transition-colors focus-within:border-brand-500/40 focus-within:bg-white/[0.05]">
      <span className="text-ink-500">{icon}</span>
      {children}
    </div>
  );
}
