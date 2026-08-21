import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthPage } from '@/features/auth/AuthPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { JobsView } from '@/features/jobs/JobsView';
import { CoursesView } from '@/features/courses/CoursesView';
import { SkillsView } from '@/features/skills/SkillsView';
import { CareerProfileView } from '@/features/career/CareerProfileView';
import { ResumesView } from '@/features/resumes/ResumesView';
import { SettingsView } from '@/features/settings/SettingsView';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Loading JobOS Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {!isAuthenticated ? (
            <>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </>
          ) : (
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardView />} />
              <Route path="/career" element={<CareerProfileView />} />
              <Route path="/jobs" element={<JobsView />} />
              <Route path="/resumes" element={<ResumesView />} />
              <Route path="/courses" element={<CoursesView />} />
              <Route path="/skills" element={<SkillsView />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
