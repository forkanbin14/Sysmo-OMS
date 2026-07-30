import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Users,
  FolderKanban,
  CheckSquare,
  CalendarClock,
  Building2,
  LayoutDashboard,
  AlertTriangle,
  UserX,
  UserPlus,
  Flag,
  PauseCircle,
  Clock,
  X,
  Lightbulb,
  TrendingUp,
  Hash,
  Command,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import { searchAll, searchPages, type SearchResult, type EntityType } from '@/lib/search';
import { generateRecommendations, type Recommendation } from '@/lib/recommendations';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

type Page = 'dashboard' | 'employees' | 'departments' | 'projects' | 'tasks' | 'attendance' | 'meetings' | 'admin' | 'settings' | 'feed' | 'messenger' | 'profile';

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
  data: AppData;
  onNavigate: (page: Page) => void;
}

const entityIcon: Record<EntityType, LucideIcon> = {
  employee: Users,
  project: FolderKanban,
  task: CheckSquare,
  meeting: CalendarClock,
  department: Building2,
  page: LayoutDashboard,
};

const entityColor: Record<EntityType, string> = {
  employee: 'text-brand-400 bg-brand-500/10 ring-brand-500/20',
  project: 'text-accent-400 bg-accent-500/10 ring-accent-500/20',
  task: 'text-warning-400 bg-warning-500/10 ring-warning-500/20',
  meeting: 'text-success-400 bg-success-500/10 ring-success-500/20',
  department: 'text-ink-300 bg-white/[0.06] ring-white/[0.08]',
  page: 'text-brand-400 bg-brand-500/10 ring-brand-500/20',
};

const entityLabel: Record<EntityType, string> = {
  employee: 'Person',
  project: 'Project',
  task: 'Task',
  meeting: 'Meeting',
  department: 'Dept',
  page: 'Page',
};

const recIcon: Record<string, LucideIcon> = {
  AlertTriangle,
  UserX,
  UserPlus,
  Flag,
  PauseCircle,
  Clock,
  CalendarClock,
  Building2,
};

const recToneClasses: Record<string, { bg: string; text: string; ring: string }> = {
  danger:  { bg: 'bg-danger-500/10',  text: 'text-danger-400',  ring: 'ring-danger-500/20' },
  warning: { bg: 'bg-warning-500/10', text: 'text-warning-400', ring: 'ring-warning-500/20' },
  accent:  { bg: 'bg-accent-500/10',  text: 'text-accent-400',  ring: 'ring-accent-500/20' },
  brand:   { bg: 'bg-brand-500/10',   text: 'text-brand-400',   ring: 'ring-brand-500/20' },
  success: { bg: 'bg-success-500/10', text: 'text-success-400', ring: 'ring-success-500/20' },
};

const severityLabel: Record<string, string> = {
  high: 'High priority',
  medium: 'Worth reviewing',
  low: 'Minor',
};

type Tab = 'search' | 'ai';

export function SearchPalette({ open, onClose, data, onNavigate }: SearchPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState<Tab>('search');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTab('search');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, currentList.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setTab((t) => (t === 'search' ? 'ai' : 'search'));
        setActiveIndex(0);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const results = useMemo(() => {
    if (!query.trim()) return searchPages('');
    const entityHits = searchAll(query, data);
    const pageHits = searchPages(query);
    return [...entityHits, ...pageHits].sort((a, b) => b.score - a.score);
  }, [query, data]);

  const recommendations = useMemo(() => generateRecommendations(data), [data]);

  const currentList = tab === 'search' ? results : recommendations;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, tab]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function handleSelect(item: SearchResult | Recommendation) {
    const page = 'page' in item ? (item as SearchResult).page : (item as Recommendation).page;
    onNavigate(page);
    onClose();
  }

  function handleEnter() {
    if (currentList.length === 0) return;
    handleSelect(currentList[activeIndex]);
  }

  // Group results by type for unique enterprise layout
  const groupedResults = useMemo(() => {
    const groups = new Map<EntityType, SearchResult[]>();
    results.forEach((r) => {
      const arr = groups.get(r.type) ?? [];
      arr.push(r);
      groups.set(r.type, arr);
    });
    return Array.from(groups.entries());
  }, [results]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[10vh]">
      <div
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-850/95 shadow-dark-float backdrop-blur-2xl animate-fade-in-scale"
        role="dialog"
        aria-modal="true"
      >
        {/* Ambient brand glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-brand-600/15 blur-3xl" />

        {/* Search input */}
        <div className="relative flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
          {tab === 'ai' ? (
            <Sparkles className="h-5 w-5 shrink-0 text-brand-400" />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-ink-500" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleEnter(); }
              if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            }}
            placeholder={tab === 'ai' ? 'AI insights — select an action below…' : 'Search people, projects, tasks… or Tab for AI insights'}
            className="flex-1 bg-transparent text-base text-white placeholder:text-ink-500 focus:outline-none"
          />
          {tab === 'search' && query && (
            <button
              onClick={() => setQuery('')}
              className="rounded-lg p-1 text-ink-500 transition-colors hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="relative flex items-center gap-1 border-b border-white/[0.06] px-3 pt-2">
          <button
            onClick={() => { setTab('search'); setActiveIndex(0); }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
              tab === 'search' ? 'bg-white/[0.06] text-white' : 'text-ink-500 hover:bg-white/[0.03] hover:text-ink-300',
            )}
          >
            <Search className="h-3.5 w-3.5" />
            Search
            {results.length > 0 && (
              <span className={cn('rounded-full px-1.5 text-[11px] tabular', tab === 'search' ? 'bg-brand-500/20 text-brand-300' : 'bg-white/[0.06] text-ink-500')}>
                {results.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setTab('ai'); setActiveIndex(0); }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
              tab === 'ai' ? 'bg-white/[0.06] text-white' : 'text-ink-500 hover:bg-white/[0.03] hover:text-ink-300',
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Insights
            {recommendations.length > 0 && (
              <span className={cn('rounded-full px-1.5 text-[11px] tabular', tab === 'ai' ? 'bg-brand-500/20 text-brand-300' : 'bg-white/[0.06] text-ink-500')}>
                {recommendations.length}
              </span>
            )}
          </button>
          <div className="ml-auto flex items-center gap-1 pb-2 text-[10px] text-ink-600">
            <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-medium text-ink-400">Tab</kbd>
            <span>switch</span>
          </div>
        </div>

        {/* List */}
        <div ref={listRef} className="relative max-h-[52vh] overflow-y-auto p-2">
          {tab === 'search' && (
            <>
              {results.length === 0 ? (
                <EmptySearch query={query} />
              ) : (
                <>
                  {!query.trim() ? (
                    <>
                      <SectionLabel icon={Hash} label="Quick navigate" />
                      {results.map((r, idx) => (
                        <ResultRow
                          key={`${r.type}-${r.id}`}
                          result={r}
                          active={idx === activeIndex}
                          idx={idx}
                          onSelect={() => handleSelect(r)}
                          onHover={() => setActiveIndex(idx)}
                        />
                      ))}
                    </>
                  ) : (
                    groupedResults.map(([type, items]) => {
                      const Icon = entityIcon[type];
                      const startIndex = results.findIndex((r) => r === items[0]);
                      return (
                        <div key={type}>
                          <SectionLabel icon={Icon} label={entityLabel[type]} />
                          {items.map((r, i) => {
                            const idx = startIndex + i;
                            return (
                              <ResultRow
                                key={`${r.type}-${r.id}`}
                                result={r}
                                active={idx === activeIndex}
                                idx={idx}
                                onSelect={() => handleSelect(r)}
                                onHover={() => setActiveIndex(idx)}
                              />
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </>
          )}

          {tab === 'ai' && (
            <>
              {recommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-in">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 -m-2 rounded-3xl bg-success-500/15 blur-2xl" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-success-500/10">
                      <TrendingUp className="h-6 w-6 text-success-400" />
                    </div>
                  </div>
                  <p className="font-display text-sm font-semibold text-white">All clear</p>
                  <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-400">No issues detected. Your team's workload, tasks and projects look healthy.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <Lightbulb className="h-4 w-4 text-brand-400" />
                    <p className="text-[13px] font-medium text-ink-300">
                      {recommendations.length} smart {recommendations.length === 1 ? 'insight' : 'insights'} from your data
                    </p>
                  </div>
                  {recommendations.map((rec, idx) => (
                    <RecommendationRow
                      key={rec.id}
                      rec={rec}
                      active={idx === activeIndex}
                      idx={idx}
                      onSelect={() => handleSelect(rec)}
                      onHover={() => setActiveIndex(idx)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[11px] text-ink-500">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-medium text-ink-400"><ArrowUp className="inline h-3 w-3" /></kbd>
            <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-medium text-ink-400"><ArrowDown className="inline h-3 w-3" /></kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-medium text-ink-400"><CornerDownLeft className="inline h-3 w-3" /></kbd>
            open
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-medium text-ink-400">Esc</kbd>
            close
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-brand-400">
            <Sparkles className="h-3 w-3" />
            AI-powered
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SectionLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-ink-600">
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
}

function ResultRow({
  result,
  active,
  idx,
  onSelect,
  onHover,
}: {
  result: SearchResult;
  active: boolean;
  idx: number;
  onSelect: () => void;
  onHover: () => void;
}) {
  const Icon = entityIcon[result.type];
  const colorClass = entityColor[result.type];

  return (
    <button
      data-idx={idx}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ease-out-quart',
        active ? 'bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]' : 'hover:bg-white/[0.03]',
      )}
    >
      {result.avatar ? (
        <Avatar name={result.title} src={result.avatar} size="sm" />
      ) : (
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset', colorClass)}>
          <Icon className="h-4 w-4" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white">{result.title}</p>
        <p className="truncate text-xs text-ink-500">{result.subtitle}</p>
      </div>

      {result.meta && (
        <span className="hidden truncate text-xs text-ink-600 sm:block">{result.meta}</span>
      )}
      <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-400 ring-1 ring-inset ring-white/[0.06]">
        {entityLabel[result.type]}
      </span>
    </button>
  );
}

function RecommendationRow({
  rec,
  active,
  idx,
  onSelect,
  onHover,
}: {
  rec: Recommendation;
  active: boolean;
  idx: number;
  onSelect: () => void;
  onHover: () => void;
}) {
  const Icon = recIcon[rec.icon] ?? AlertTriangle;
  const tone = recToneClasses[rec.tone] ?? recToneClasses.warning;

  return (
    <button
      data-idx={idx}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150 ease-out-quart',
        active ? 'bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]' : 'hover:bg-white/[0.03]',
      )}
    >
      <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', tone.bg, tone.text, tone.ring)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-white">{rec.title}</p>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', tone.bg, tone.text)}>
            {severityLabel[rec.severity]}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink-500">{rec.reason}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-400">
          <CornerDownLeft className="h-3 w-3" /> {rec.action}
        </p>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <span className="text-[10px] font-medium uppercase tracking-wide text-ink-600">Confidence</span>
        <span className="font-display text-sm font-bold tabular text-ink-300">{rec.confidence}%</span>
      </div>
    </button>
  );
}

function EmptySearch({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center animate-fade-in">
      <div className="relative mb-4">
        <div className="absolute inset-0 -m-2 rounded-3xl bg-white/5 blur-2xl" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.04]">
          <Search className="h-6 w-6 text-ink-500" />
        </div>
      </div>
      <p className="font-display text-sm font-semibold text-white">No results for "{query}"</p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-400">Try a different name, project, or task. Search covers everything in your workspace.</p>
    </div>
  );
}
