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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import { searchAll, searchPages, type SearchResult, type EntityType } from '@/lib/search';
import { generateRecommendations, type Recommendation } from '@/lib/recommendations';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

type Page = 'dashboard' | 'employees' | 'departments' | 'projects' | 'tasks' | 'attendance' | 'meetings' | 'admin' | 'settings';

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
  employee: 'text-brand-600 bg-brand-50',
  project: 'text-accent-600 bg-accent-50',
  task: 'text-warning-600 bg-warning-50',
  meeting: 'text-success-600 bg-success-50',
  department: 'text-ink-600 bg-ink-100',
  page: 'text-brand-600 bg-brand-50',
};

const entityLabel: Record<EntityType, string> = {
  employee: 'Employee',
  project: 'Project',
  task: 'Task',
  meeting: 'Meeting',
  department: 'Department',
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
  danger: { bg: 'bg-danger-50', text: 'text-danger-600', ring: 'ring-danger-100' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-600', ring: 'ring-warning-100' },
  accent: { bg: 'bg-accent-50', text: 'text-accent-600', ring: 'ring-accent-100' },
  brand: { bg: 'bg-brand-50', text: 'text-brand-600', ring: 'ring-brand-100' },
  success: { bg: 'bg-success-50', text: 'text-success-600', ring: 'ring-success-100' },
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

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTab('search');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard: ESC handled by parent via overlay; arrow keys + enter here
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
  const maxIndex = currentList.length - 1;

  // Reset active index when query/tab changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query, tab]);

  // Scroll active item into view
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

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />

      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-float animate-fade-in-scale"
        role="dialog"
        aria-modal="true"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3.5">
          <Search className="h-5 w-5 shrink-0 text-ink-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleEnter(); }
              if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            }}
            placeholder="Search people, projects, tasks… or press Tab for AI insights"
            className="flex-1 bg-transparent text-base text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-ink-100 px-3 pt-2">
          <button
            onClick={() => { setTab('search'); setActiveIndex(0); }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === 'search' ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800',
            )}
          >
            <Search className="h-4 w-4" />
            Results
            {results.length > 0 && (
              <span className={cn('rounded-full px-1.5 text-xs', tab === 'search' ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500')}>
                {results.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setTab('ai'); setActiveIndex(0); }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === 'ai' ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800',
            )}
          >
            <Sparkles className="h-4 w-4" />
            AI Insights
            {recommendations.length > 0 && (
              <span className={cn('rounded-full px-1.5 text-xs', tab === 'ai' ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500')}>
                {recommendations.length}
              </span>
            )}
          </button>
          <div className="ml-auto flex items-center gap-1 pb-2 text-[10px] text-ink-400">
            <kbd className="rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-semibold">Tab</kbd>
            <span>switch</span>
          </div>
        </div>

        {/* List */}
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {tab === 'search' && (
            <>
              {results.length === 0 ? (
                <EmptySearch query={query} />
              ) : (
                <>
                  {!query.trim() && (
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Quick navigate</p>
                  )}
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
              )}
            </>
          )}

          {tab === 'ai' && (
            <>
              {recommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-50 ring-1 ring-success-100">
                    <TrendingUp className="h-7 w-7 text-success-600" />
                  </div>
                  <p className="font-display text-base font-semibold text-ink-900">All clear</p>
                  <p className="mt-1 max-w-sm text-sm text-ink-500">No issues detected. Your team's workload, tasks and projects look healthy.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <Lightbulb className="h-4 w-4 text-brand-500" />
                    <p className="text-sm font-medium text-ink-600">
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
        <div className="flex items-center gap-4 border-t border-ink-100 bg-ink-50/60 px-4 py-2.5 text-[11px] text-ink-400">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-ink-200 bg-white px-1.5 py-0.5 font-semibold text-ink-600"><ArrowUp className="inline h-3 w-3" /></kbd>
            <kbd className="rounded border border-ink-200 bg-white px-1.5 py-0.5 font-semibold text-ink-600"><ArrowDown className="inline h-3 w-3" /></kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-ink-200 bg-white px-1.5 py-0.5 font-semibold text-ink-600"><CornerDownLeft className="inline h-3 w-3" /></kbd>
            open
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-ink-200 bg-white px-1.5 py-0.5 font-semibold text-ink-600">Esc</kbd>
            close
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-brand-500" />
            AI-powered
          </span>
        </div>
      </div>
    </div>,
    document.body,
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
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
        active ? 'bg-brand-50 ring-1 ring-brand-100' : 'hover:bg-ink-50',
      )}
    >
      {/* Icon or avatar */}
      {result.avatar ? (
        <Avatar name={result.title} src={result.avatar} size="sm" />
      ) : (
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', colorClass)}>
          <Icon className="h-4 w-4" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">{result.title}</p>
        <p className="truncate text-xs text-ink-500">{result.subtitle}</p>
      </div>

      {result.meta && (
        <span className="hidden truncate text-xs text-ink-400 sm:block">{result.meta}</span>
      )}
      <span className="rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
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
        'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors',
        active ? 'bg-brand-50 ring-1 ring-brand-100' : 'hover:bg-ink-50',
      )}
    >
      <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1', tone.bg, tone.text, tone.ring)}>
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink-900">{rec.title}</p>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', tone.bg, tone.text)}>
            {severityLabel[rec.severity]}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink-500">{rec.reason}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-600">
          <CornerDownLeft className="h-3 w-3" /> {rec.action}
        </p>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <span className="text-[10px] font-medium uppercase tracking-wide text-ink-400">Confidence</span>
        <span className="font-display text-sm font-bold text-ink-700">{rec.confidence}%</span>
      </div>
    </button>
  );
}

function EmptySearch({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 ring-1 ring-ink-200">
        <Search className="h-7 w-7 text-ink-400" />
      </div>
      <p className="font-display text-base font-semibold text-ink-900">No results for "{query}"</p>
      <p className="mt-1 max-w-sm text-sm text-ink-500">Try a different name, project, or task. Search covers everything in your workspace.</p>
    </div>
  );
}
