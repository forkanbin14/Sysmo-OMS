import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Sidebar, type PageKey } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ToastProvider } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { useAppData } from '@/hooks/useAppData';
import { SearchPalette } from '@/components/search/SearchPalette';
import { ProfilePanel } from '@/components/layout/ProfilePanel';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { Dashboard } from '@/pages/Dashboard';
import { Employees } from '@/pages/Employees';
import { Departments } from '@/pages/Departments';
import { Projects } from '@/pages/Projects';
import { Tasks } from '@/pages/Tasks';
import { Attendance } from '@/pages/Attendance';
import { Meetings } from '@/pages/Meetings';
import { Admin } from '@/pages/Admin';
import { Settings } from '@/pages/Settings';

const pageMeta: Record<PageKey, { title: string; subtitle: string }> = {
  dashboard:   { title: 'Dashboard',   subtitle: 'Your office at a glance' },
  employees:   { title: 'Employees',   subtitle: 'Manage your team members' },
  departments: { title: 'Departments', subtitle: 'Organizational structure' },
  projects:    { title: 'Projects',    subtitle: 'Track initiatives and progress' },
  tasks:       { title: 'Tasks',       subtitle: 'Work items and assignments' },
  attendance:  { title: 'Attendance',  subtitle: 'Daily check-ins and presence' },
  meetings:    { title: 'Meetings',    subtitle: 'Scheduled team sessions' },
  admin:       { title: 'Admin Panel', subtitle: 'Manage roles, transactions & system controls' },
  settings:    { title: 'Settings',    subtitle: 'Manage your account, preferences and workspace' },
};

function AppContent() {
  const [page, setPage] = useState<PageKey>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const data = useAppData();

  function navigate(p: PageKey) {
    setPage(p);
    setMobileOpen(false);
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Global Cmd+K / Ctrl+K to open search, Cmd+J for AI
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setAiOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Reset scroll on page change
  useEffect(() => {
    const main = document.getElementById('main-scroll');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const meta = pageMeta[page];

  return (
    <div className="min-h-screen bg-ink-925 text-ink-100 mesh-bg-dark noise">
      <Sidebar
        current={page}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="lg:pl-[260px]">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenMobile={() => setMobileOpen(true)}
          onSearch={() => setSearchOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenAI={() => setAiOpen(true)}
        />

        <main id="main-scroll" className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Global error banner */}
          {data.error && !data.loading && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm text-danger-300 animate-fade-in">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="flex-1">Couldn't load some data: {data.error}</span>
              <Button size="sm" variant="outline" onClick={data.refresh}>
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
            </div>
          )}

          <div key={page} className="animate-fade-in">
            {page === 'dashboard' && <Dashboard data={data} onNavigate={navigate} />}
            {page === 'employees' && <Employees data={data} />}
            {page === 'departments' && <Departments data={data} />}
            {page === 'projects' && <Projects data={data} />}
            {page === 'tasks' && <Tasks data={data} />}
            {page === 'attendance' && <Attendance data={data} />}
            {page === 'meetings' && <Meetings data={data} />}
            {page === 'admin' && <Admin data={data} onNavigate={navigate} />}
            {page === 'settings' && <Settings />}
          </div>
        </main>
      </div>

      <SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        data={data}
        onNavigate={navigate}
      />

      <ProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        data={data}
        onNavigate={navigate}
      />

      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
