import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Sidebar, type PageKey } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ToastProvider } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { useAppData } from '@/hooks/useAppData';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { SearchPalette } from '@/components/search/SearchPalette';
import { ProfilePanel } from '@/components/layout/ProfilePanel';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { BottomNav, MoreSheet } from '@/components/layout/BottomNav';
import { AuthPage } from '@/pages/Auth';
import { ProfileSetupPage } from '@/pages/ProfileSetup';
import { Dashboard } from '@/pages/Dashboard';
import { Employees } from '@/pages/Employees';
import { Departments } from '@/pages/Departments';
import { Projects } from '@/pages/Projects';
import { Tasks } from '@/pages/Tasks';
import { Attendance } from '@/pages/Attendance';
import { Meetings } from '@/pages/Meetings';
import { Admin } from '@/pages/Admin';
import { Settings } from '@/pages/Settings';
import { ProfilePage } from '@/pages/Profile';
import { FeedPage } from '@/pages/Feed';
import { MessengerPage } from '@/pages/Messenger';

const pageMeta: Record<PageKey, { title: string; subtitle: string }> = {
  dashboard:   { title: 'Dashboard',   subtitle: 'Your office at a glance' },
  employees:   { title: 'Employees',   subtitle: 'Manage your team members' },
  departments: { title: 'Departments', subtitle: 'Organizational structure' },
  projects:    { title: 'Projects',    subtitle: 'Track initiatives and progress' },
  tasks:       { title: 'Tasks',       subtitle: 'Work items and assignments' },
  attendance:  { title: 'Attendance',  subtitle: 'Daily check-ins and presence' },
  meetings:    { title: 'Meetings',    subtitle: 'Scheduled team sessions' },
  admin:       { title: 'Admin Panel', subtitle: 'Manage roles, transactions & system controls' },
  feed:        { title: 'Feed',        subtitle: 'Share updates with your team' },
  messenger:   { title: 'Messenger',   subtitle: 'Direct messages with teammates' },
  profile:     { title: 'Profile',     subtitle: 'Rich employee profiles' },
  settings:    { title: 'Settings',    subtitle: 'Manage your account, preferences and workspace' },
};

function AppContent() {
  const { session, loading: authLoading, accountStatus } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [messageTargetId, setMessageTargetId] = useState<string | null>(null);
  const data = useAppData();

  function navigate(p: PageKey) {
    setPage(p);
    setMobileOpen(false);
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function viewProfile(empId: string) {
    setViewProfileId(empId);
    navigate('profile');
  }

  function messageEmployee(empId: string) {
    setMessageTargetId(empId);
    navigate('messenger');
  }

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

  useEffect(() => {
    const main = document.getElementById('main-scroll');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Show auth page if not signed in
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-925">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-brand-500" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  // Pending or rejected users see setup/waiting screen instead of the app
  if (accountStatus === 'pending' || accountStatus === 'rejected') {
    return <ProfileSetupPage />;
  }

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

        <main id="main-scroll" className="mx-auto max-w-[1400px] px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-8">
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
            {page === 'dashboard' && <Dashboard data={data} onNavigate={navigate} onViewProfile={viewProfile} />}
            {page === 'employees' && <Employees data={data} onViewProfile={viewProfile} />}
            {page === 'departments' && <Departments data={data} />}
            {page === 'projects' && <Projects data={data} />}
            {page === 'tasks' && <Tasks data={data} onViewProfile={viewProfile} />}
            {page === 'attendance' && <Attendance data={data} />}
            {page === 'meetings' && <Meetings data={data} />}
            {page === 'admin' && <Admin data={data} onNavigate={navigate} />}
            {page === 'settings' && <Settings />}
            {page === 'profile' && (
              <ProfilePage
                data={data}
                profileId={viewProfileId}
                onMessage={messageEmployee}
                onViewProfile={viewProfile}
              />
            )}
            {page === 'feed' && <FeedPage data={data} onViewProfile={viewProfile} />}
            {page === 'messenger' && (
              <MessengerPage
                data={data}
                initialTargetId={messageTargetId}
                onViewProfile={viewProfile}
                onClearTarget={() => setMessageTargetId(null)}
              />
            )}
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

      <BottomNav
        current={page}
        onNavigate={navigate}
        onOpenMore={() => setMoreOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAI={() => setAiOpen(true)}
      />
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        current={page}
        onNavigate={navigate}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAI={() => setAiOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
