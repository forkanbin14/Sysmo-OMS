import { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, Building2, Shield, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function AuthPage() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim()) { setError('Please enter your ID'); return; }
    setLoading(true);
    const { error } = await signIn(username, password);
    if (error) {
      setError(
        error.includes('Invalid login credentials')
          ? 'Wrong ID or password'
          : error
      );
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
          <p className="mt-1 text-sm text-ink-400">Office Management System</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-ink-850/80 p-6 shadow-dark-float backdrop-blur-2xl sm:p-8">
          <div className="mb-6 flex items-center gap-2 text-sm text-ink-400">
            <Shield className="h-4 w-4 text-brand-400" />
            <span>Sign in with your admin-assigned ID</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field icon={<User className="h-4 w-4" />}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your ID (e.g. Ahmed FK 98545)"
                className="w-full bg-transparent text-sm text-white placeholder:text-ink-500 focus:outline-none"
                required
                autoComplete="username"
              />
            </Field>

            <Field icon={<Lock className="h-4 w-4" />}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent text-sm text-white placeholder:text-ink-500 focus:outline-none"
                required
                autoComplete="current-password"
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
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-500">
            Don't have an ID? Contact your administrator.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-ink-600">
          Only admin-assigned accounts can sign in
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
