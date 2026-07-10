import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { LOGIN_RETURN_KEY, useAuth } from './hooks/useAuth';
import { useImages } from './hooks/useImages';
import { useFollows } from './hooks/useFollows';
import { AppLayout } from './layouts/AppLayout';
import { StandaloneLayout } from './layouts/StandaloneLayout';
import { ToastProvider } from './ui/Toast';
import { ProfileProvider } from './context/ProfileContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { isPublicPath } from './utils/AuthGuard';
import { shouldBypassAuthRequired } from './lib/devAuth';
import { staticAuthDisabled, staticStoryMode } from './lib/staticMode';
import { checkForUpdates } from './lib/updater';
import type { TimelineMonth } from './types/image';

const Home = lazy(() => import('./pages/Home'));
const Story = lazy(() => import('./pages/Story'));
const Album = lazy(() => import('./pages/Album'));
const CaptureStory = lazy(() => import('./pages/Story').then((module) => ({ default: module.CaptureStory })));
const Post = lazy(() => import('./pages/Post'));
const Following = lazy(() => import('./pages/Following'));
const Follower = lazy(() => import('./pages/Follower'));
const Config = lazy(() => import('./pages/Config'));
const AuthEmail = lazy(() => import('./pages/AuthEmail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const InviteRedirect = lazy(() => import('./pages/InviteRedirect'));

const routerBasename = import.meta.env.BASE_URL === '/'
  ? undefined
  : import.meta.env.BASE_URL.replace(/\/$/, '');

const resolveTheme = (): 'dark' | 'light' => {
  const savedTheme = window.localStorage.getItem('story-theme');

  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function LoginReturnHandler({ authenticated }: { authenticated: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authenticated) return;
    let target = '';
    try {
      target = localStorage.getItem(LOGIN_RETURN_KEY) ?? '';
    } catch {
      target = '';
    }

    if (!target || !target.startsWith('/')) return;

    try {
      localStorage.removeItem(LOGIN_RETURN_KEY);
    } catch {
      // ignore
    }

    const current = `${location.pathname}${location.search}${location.hash}`;
    if (current === target) return;

    navigate(target, { replace: true });
  }, [authenticated, location.hash, location.pathname, location.search, navigate]);

  return null;
}

function RequireAuth({ children, loading, authenticated }: { children: React.ReactNode; loading: boolean; authenticated: boolean }) {
  const location = useLocation();
  const authAllowed = shouldBypassAuthRequired(authenticated);

  useEffect(() => {
    if (isPublicPath(location.pathname) || loading || authAllowed) return;

    try {
      localStorage.setItem(LOGIN_RETURN_KEY, `${location.pathname}${location.search}${location.hash}`);
    } catch {
      // ignore storage errors
    }
  }, [authAllowed, loading, location.hash, location.pathname, location.search]);

  if (isPublicPath(location.pathname)) return <>{children}</>;
  if (loading) return null;
  if (!authAllowed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return <>{children}</>;
}

function ServerBackedApp({ onThemeToggle, theme }: { onThemeToggle: () => void; theme: 'dark' | 'light' }) {
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [activeMonth, setActiveMonth] = useState<TimelineMonth | null>(null);
  const auth = useAuth();
  const images = useImages();
  const follows = useFollows(auth, { onChange: images.refreshFeedUsers });

  useEffect(() => {
    if (!images.timeline.length || activeMonth) {
      return;
    }

    setActiveMonth(images.timeline[0]);
  }, [activeMonth, images.timeline]);

  const footerStats = {
    ...images.stats,
    githubOwner: images.stats.githubOwner || auth.user?.login || 'dieWehmut',
  };

  return (
    <AuthProvider isAdmin={auth.isAdmin}>
      <ProfileProvider user={auth.user}>
          <LoginReturnHandler authenticated={auth.authenticated} />
          <RequireAuth loading={auth.loading} authenticated={auth.authenticated}>
              <Routes>
                <Route element={<AppLayout footerStats={footerStats} />}>
                  <Route
                    path="/"
                    element={<Home auth={auth} images={images} follows={follows} onThemeToggle={onThemeToggle} theme={theme} />}
                  />
                  <Route
                    path="/story"
                    element={
                      staticStoryMode ? (
                        <CaptureStory onThemeToggle={onThemeToggle} theme={theme} />
                      ) : (
                        <Story
                          activeMonth={activeMonth}
                          auth={auth}
                          follows={follows}
                          images={images}
                          onActiveMonthChange={setActiveMonth}
                          onThemeToggle={onThemeToggle}
                          onTimelineClose={() => setTimelineOpen(false)}
                          onTimelineToggle={() => setTimelineOpen((open) => !open)}
                          theme={theme}
                          timelineOpen={timelineOpen}
                        />
                      )
                    }
                  />
                  <Route
                    path="/story/:id"
                    element={
                      staticStoryMode ? (
                        <CaptureStory onThemeToggle={onThemeToggle} theme={theme} />
                      ) : (
                        <Story
                          activeMonth={activeMonth}
                          auth={auth}
                          follows={follows}
                          images={images}
                          onActiveMonthChange={setActiveMonth}
                          onThemeToggle={onThemeToggle}
                          onTimelineClose={() => setTimelineOpen(false)}
                          onTimelineToggle={() => setTimelineOpen((open) => !open)}
                          theme={theme}
                          timelineOpen={timelineOpen}
                        />
                      )
                    }
                  />
                  <Route
                    path="/album"
                    element={<Album auth={auth} images={images} onThemeToggle={onThemeToggle} theme={theme} />}
                  />
                  <Route
                    path="/post"
                    element={<Post auth={auth} images={images} />}
                  />
                  <Route
                    path="/following"
                    element={<Following auth={auth} follows={follows} onThemeToggle={onThemeToggle} theme={theme} />}
                  />
                  <Route
                    path="/follower"
                    element={<Follower auth={auth} follows={follows} onThemeToggle={onThemeToggle} theme={theme} />}
                  />
                </Route>
                <Route element={<StandaloneLayout />}>
                  <Route
                    path="/config"
                    element={<Config auth={auth} theme={theme} onThemeToggle={onThemeToggle} />}
                  />
                  <Route
                    path="/login"
                    element={staticAuthDisabled ? <Navigate to="/story" replace /> : <Login auth={auth} onThemeToggle={onThemeToggle} theme={theme} />}
                  />
                  <Route
                    path="/register"
                    element={staticAuthDisabled ? <Navigate to="/story" replace /> : <Register auth={auth} onThemeToggle={onThemeToggle} theme={theme} />}
                  />
                  <Route path="/invites/:code" element={<InviteRedirect />} />
                  <Route path="/auth/email" element={<AuthEmail />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          </RequireAuth>
      </ProfileProvider>
    </AuthProvider>
  );
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(resolveTheme);
  const onThemeToggle = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('story-theme', theme);
  }, [theme]);

  useEffect(() => {
    void checkForUpdates();
  }, []);

  return (
    <ToastProvider>
      <LanguageProvider>
        <BrowserRouter basename={routerBasename}>
          <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
              <LoaderCircle className="animate-spin text-cyan-300" size={32} />
            </div>
          }>
            <Routes>
              <Route path="/*" element={<ServerBackedApp onThemeToggle={onThemeToggle} theme={theme} />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </ToastProvider>
  );
}

export default App;
