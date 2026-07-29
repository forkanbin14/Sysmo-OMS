import { useEffect, useRef, useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Command,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenMobile: () => void;
  onSearch: () => void;
  onOpenProfile: () => void;
}

export function Topbar({ title, subtitle, onOpenMobile, onSearch, onOpenProfile }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Close on Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dropdownOpen]);

  function handleViewProfile() {
    setDropdownOpen(false);
    onOpenProfile();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu toggle */}
        <button
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile search icon */}
        <button
          onClick={onSearch}
          className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 md:hidden"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Page title */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-semibold text-ink-900 sm:text-xl">{title}</h1>
          {subtitle && (
            <p className="hidden truncate text-sm text-ink-500 sm:block">{subtitle}</p>
          )}
        </div>

        {/* Desktop search bar */}
        <button
          onClick={onSearch}
          className="hidden items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-400 transition-colors hover:border-ink-300 hover:text-ink-600 md:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search…</span>
          <kbd className="ml-2 inline-flex items-center gap-0.5 rounded border border-ink-200 bg-ink-50 px-1.5 text-[10px] font-semibold text-ink-400">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        {/* Notifications bell */}
        <button
          className="relative rounded-xl p-2.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ring-ping rounded-full bg-danger-400" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-danger-500" />
          </span>
        </button>

        {/* ── Profile button + dropdown ── */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 transition-all duration-200',
              dropdownOpen
                ? 'border-brand-300 bg-brand-50 shadow-glow'
                : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50',
            )}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <Avatar name="Alex Rivera" size="sm" ring />
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-semibold text-ink-900">Alex Rivera</p>
              <p className="text-xs text-ink-500">Administrator</p>
            </div>
            <ChevronDown
              className={cn(
                'hidden h-3.5 w-3.5 text-ink-400 transition-transform duration-200 sm:block',
                dropdownOpen && 'rotate-180',
              )}
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-float animate-fade-in-scale">
              {/* User card */}
              <div className="flex items-center gap-3 border-b border-ink-100 bg-gradient-to-r from-brand-50 to-accent-50 px-4 py-3.5">
                <Avatar name="Alex Rivera" size="md" ring />
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-ink-900">Alex Rivera</p>
                  <p className="truncate text-xs text-ink-500">alex.rivera@office.co</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Shield className="h-2.5 w-2.5" /> Admin
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-1.5">
                <button
                  onClick={handleViewProfile}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  View full profile
                </button>

                <button
                  onClick={handleViewProfile}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
                    <Settings className="h-3.5 w-3.5" />
                  </span>
                  Settings
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); onSearch(); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  AI Search
                  <kbd className="ml-auto rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] font-semibold text-ink-400">⌘K</kbd>
                </button>
              </div>

              <div className="border-t border-ink-100 p-1.5">
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-50 text-danger-500">
                    <LogOut className="h-3.5 w-3.5" />
                  </span>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
