import { useState } from 'react';
import { Mail, Lock, User, Briefcase, Eye, EyeOff, ArrowRight, Building2, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

type Mode = 'signin' | 'signup';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await signIn(email.trim(), password);
      if (error) setError(error);
    } else {
      if (!name.trim()) { setError('Please enter your name'); setLoading(false); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
      const { error } = await signUp(email.trim(), password, name.trim(), position.trim() || undefined);
      if (error) setError(error);
      else {
        // Auto sign-in after signup
        const { error: signInErr } = await signIn(email.trim(), password);
        if (signInErr) setError(signInErr);
      }
    }
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-925 p-4">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent-600/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Afferent Tech BD</h1>
          <p className="mt-1 text-sm text-ink-400">Enterprise Office Management System</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-ink-850/80 p-6 shadow-dark-float backdrop-blur-2xl sm:p-8">
          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-ink-900/60 p-1">
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'text-ink-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'text-ink-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <Field icon={<User className="h-4 w-4" />}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-transparent text-sm text-white placeholder:text-ink-500 focus:outline-none"
                    required
                  />
                </Field>
                <Field icon={<Briefcase className="h-4 w-4" />}>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Job title (optional)"
                    className="w-full bg-transparent text-sm text-white placeholder:text-ink-500 focus:outline-none"
                  />
                </Field>
              </>
            )}

            <Field icon={<Mail className="h-4 w-4" />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-transparent text-sm text-white placeholder:text-ink-500 focus:outline-none"
                required
              />
            </Field>

            <Field icon={<Lock className="h-4 w-4" />}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                className="w-full bg-transparent text-sm text-white placeholder:text-ink-500 focus:outline-none"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-ink-500 hover:text-ink-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>

            {error && (
              <div className="rounded-lg border border-danger-500/20 bg-danger-500/10 px-3 py-2 text-[13px] text-danger-300">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {mode === 'signin' && (
            <p className="mt-4 text-center text-xs text-ink-500">
              New employee?{' '}
              <button onClick={() => { setMode('signup'); setError(null); }} className="font-semibold text-brand-400 hover:text-brand-300">
                Create an account
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p className="mt-4 text-center text-xs text-ink-500">
              Already have an account?{' '}
              <button onClick={() => { setMode('signin'); setError(null); }} className="font-semibold text-brand-400 hover:text-brand-300">
                Sign in
              </button>
            </p>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-ink-600">
          <Sparkles className="h-3 w-3" />
          Each employee has their own secure account
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
