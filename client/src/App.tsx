import React, { useState, useEffect, useCallback, Suspense, lazy, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './context/AuthContext.js';
import { LeftSidebar } from './components/LeftSidebar.js';
import { RightSidebar } from './components/RightSidebar.js';
import { MobileBottomNav } from './components/MobileBottomNav.js';
import { ChirpComposer } from './components/ChirpComposer.js';
import { PixelAvatar } from './components/PixelAvatar.js';
import { Pressable } from './components/Pressable.js';
import { Reveal } from './components/Reveal.js';
import { AlertTriangle, Landmark, X } from 'lucide-react';
import { sound } from './utils/sound.js';

/* Route-level code splitting: pages + heavy modals load on demand */
const HomeFeedPage = lazy(() => import('./pages/HomeFeedPage.js').then((m) => ({ default: m.HomeFeedPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage.js').then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.js').then((m) => ({ default: m.NotificationsPage })));
const SearchPage = lazy(() => import('./pages/SearchPage.js').then((m) => ({ default: m.SearchPage })));
const HashtagPage = lazy(() => import('./pages/HashtagPage.js').then((m) => ({ default: m.HashtagPage })));
const GovernmentPanelPage = lazy(() => import('./pages/GovernmentPanelPage.js').then((m) => ({ default: m.GovernmentPanelPage })));
const ThreadView = lazy(() => import('./components/ThreadView.js').then((m) => ({ default: m.ThreadView })));
const AuthModal = lazy(() => import('./components/AuthModal.js').then((m) => ({ default: m.AuthModal })));

const FeedSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3.5">
    {[1, 2, 3].map((i) => (
      <div key={i} className="pixel-box p-4 flex gap-3.5">
        <div className="w-[42px] h-[42px] pixel-skeleton shrink-0" />
        <div className="flex-1 flex flex-col gap-2.5 pt-1">
          <div className="pixel-skeleton-text w-[70%]" />
          <div className="pixel-skeleton-text w-[90%]" />
          <div className="pixel-skeleton-text w-[40%]" />
        </div>
      </div>
    ))}
  </div>
);

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="pixel-box p-8 flex flex-col items-center gap-3 text-center mt-6">
          <AlertTriangle className="w-8 h-8 text-retro-danger" aria-hidden />
          <div className="civic-label">Could not render this view</div>
          <p className="font-body text-base text-retro-muted max-w-sm">
            The page failed to load. Your reports are still stored. Refresh to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="pixel-btn bg-retro-primary text-white mt-1 cursor-pointer"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const { user, isLoading, openAuthModal } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [viewUsername, setViewUsername] = useState<string>('');
  const [viewThreadId, setViewThreadId] = useState<string>('');
  const [viewHashtag, setViewHashtag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(2);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState<boolean>(false);
  const [isRouting, setIsRouting] = useState<boolean>(false);

  // Hash router sync
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash || hash === 'home') {
        setCurrentTab('home');
      } else if (hash === 'compose') {
        setCurrentTab('home');
        setIsComposeModalOpen(true);
      } else if (hash === 'search') {
        setCurrentTab('search');
      } else if (hash === 'notifications') {
        setCurrentTab('notifications');
      } else if (hash === 'gov-panel' || hash === 'government' || hash === 'civic') {
        setCurrentTab('gov-panel');
      } else if (hash === 'profile') {
        setViewUsername('');
        setCurrentTab('profile');
      } else if (hash.startsWith('profile-')) {
        const u = hash.replace('profile-', '');
        setViewUsername(u);
        setCurrentTab('profile');
      } else if (hash.startsWith('thread-')) {
        const tid = hash.replace('thread-', '');
        setViewThreadId(tid);
        setCurrentTab('thread');
      } else if (hash.startsWith('tag-')) {
        const tag = hash.replace('tag-', '');
        setViewHashtag(tag);
        setCurrentTab('hashtag');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = useCallback((tab: string, param?: string) => {
    sound.playClick();
    if (tab === 'profile' || tab.startsWith('profile-')) {
      const username = tab.startsWith('profile-') ? tab.replace(/^profile-/, '') : param;
      if (username) {
        window.location.hash = `profile-${username}`;
      } else if (user?.username) {
        window.location.hash = `profile-${user.username}`;
      } else {
        openAuthModal('login');
      }
      return;
    }
    if (tab === 'thread' && param) {
      window.location.hash = `thread-${param}`;
    } else if (tab === 'hashtag' && param) {
      window.location.hash = `tag-${param}`;
    } else {
      window.location.hash = tab;
    }
  }, [user, openAuthModal]);

  /* Stable callback props so memoized cards don't re-render */
  const handleNavigateProfile = useCallback((u: string) => navigateTo('profile', u), [navigateTo]);
  const handleNavigateTag = useCallback((t: string) => navigateTo('hashtag', t), [navigateTo]);
  const handleNavigateThread = useCallback((tid: string) => navigateTo('thread', tid), [navigateTo]);

  // View-switch loading bar pulse
  useEffect(() => {
    setIsRouting(true);
    const t = setTimeout(() => setIsRouting(false), 650);
    return () => clearTimeout(t);
  }, [currentTab, viewUsername, viewThreadId, viewHashtag]);

  // Keyboard shortcuts: [N] compose, [1-5] nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (user) setIsComposeModalOpen(true);
        else openAuthModal('signup');
      } else if (e.key === '1') {
        navigateTo('home');
      } else if (e.key === '2') {
        navigateTo('search');
      } else if (e.key === '3') {
        navigateTo('notifications');
      } else if (e.key === '4') {
        navigateTo('gov-panel');
      } else if (e.key === '5') {
        navigateTo('profile', user?.username);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user, navigateTo, openAuthModal]);

  useEffect(() => {
    if (currentTab !== 'profile' || viewUsername || isLoading) return;
    if (user?.username) {
      window.location.hash = `profile-${user.username}`;
      return;
    }
    openAuthModal('login');
  }, [currentTab, viewUsername, user, isLoading, openAuthModal]);

  const renderActiveView = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeFeedPage
            onNavigateProfile={handleNavigateProfile}
            onNavigateTag={handleNavigateTag}
            onNavigateThread={handleNavigateThread}
          />
        );

      case 'search':
        return (
          <SearchPage
            initialQuery={searchQuery}
            onNavigateProfile={handleNavigateProfile}
            onNavigateTag={handleNavigateTag}
            onNavigateThread={handleNavigateThread}
          />
        );

      case 'notifications':
        return (
          <NotificationsPage
            onNavigateProfile={handleNavigateProfile}
            onNavigateThread={handleNavigateThread}
          />
        );

      case 'profile': {
        const profileUsername = viewUsername || user?.username;
        if (!profileUsername) {
          return (
            <div className="pixel-box p-6 flex flex-col gap-3">
              <p className="font-body text-sm text-retro-text">Log in to view your account.</p>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="font-body text-sm font-semibold px-3 py-2 bg-retro-navy text-white border border-retro-navy cursor-pointer w-fit"
              >
                Log in
              </button>
            </div>
          );
        }
        return (
          <ProfilePage
            username={profileUsername}
            onNavigateProfile={handleNavigateProfile}
            onNavigateTag={handleNavigateTag}
            onNavigateThread={handleNavigateThread}
          />
        );
      }

      case 'hashtag':
        return (
          <HashtagPage
            tag={viewHashtag}
            onBack={() => navigateTo('home')}
            onNavigateProfile={handleNavigateProfile}
            onNavigateTag={handleNavigateTag}
            onNavigateThread={handleNavigateThread}
          />
        );

      case 'gov-panel':
      case 'government':
        return (
          <GovernmentPanelPage
            onBackToFeed={() => navigateTo('home')}
          />
        );

      case 'thread':
        return (
          <ThreadView
            postId={viewThreadId}
            onBack={() => navigateTo('home')}
            onNavigateProfile={handleNavigateProfile}
            onNavigateTag={handleNavigateTag}
            onNavigateThread={handleNavigateThread}
          />
        );

      default:
        return (
          <HomeFeedPage
            onNavigateProfile={handleNavigateProfile}
            onNavigateTag={handleNavigateTag}
            onNavigateThread={handleNavigateThread}
          />
        );
    }
  };

  const isGovPanel = currentTab === 'gov-panel' || currentTab === 'government';

  return (
    <div className={`min-h-screen bg-retro-bg text-retro-text flex justify-center overflow-x-clip ${isGovPanel ? 'shell-gov' : 'shell-citizen'}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[80] focus:bg-retro-navy focus:text-white focus:px-3 focus:py-2 focus:rounded-[6px] font-body text-sm"
      >
        Skip to main content
      </a>

      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-retro-card/90 backdrop-blur-md border-b border-retro-border px-4 py-3 flex items-center justify-between transition-[background-color,border-color,box-shadow] duration-200">
        <Reveal y={4} duration={0.32}>
          <Pressable
            as="div"
            hoverLift={false}
            className="flex items-center gap-2.5"
            onClick={() => navigateTo('home')}
            role="link"
            tabIndex={0}
            aria-label="Go to home feed"
          >
            <div className="w-8 h-8 bg-retro-navy rounded-sm flex items-center justify-center transition-transform duration-200">
              <Landmark className="w-4 h-4 text-white" aria-hidden />
            </div>
            <div>
              <span className="font-display text-[15px] font-semibold text-retro-text tracking-tight block leading-none">
                Red-Box
              </span>
              <span className="civic-label text-[10px] mt-1 block">India · anonymous reports</span>
            </div>
          </Pressable>
        </Reveal>

        <div className="flex items-center gap-2">
          {user ? (
            <Pressable
              as="div"
              hoverLift={false}
              className="cursor-pointer"
              onClick={() => navigateTo('profile', user.username)}
              aria-label="Open my profile"
            >
              <PixelAvatar avatarId={user.avatar_id} size={28} />
            </Pressable>
          ) : (
            <Pressable
              as="button"
              className="font-body text-xs font-semibold px-3 py-1.5 bg-retro-navy text-white rounded-sm"
              onClick={() => openAuthModal('login')}
            >
              Log in
            </Pressable>
          )}
        </div>
      </header>

      <div
        className={`w-full px-4 sm:px-5 md:px-8 lg:px-10 pt-[4.5rem] md:pt-6 pb-24 md:pb-8 flex gap-6 xl:gap-8 relative z-10 ${
          isGovPanel ? 'max-w-[1600px] justify-start' : 'max-w-[1240px] justify-center'
        }`}
      >
        <div className="hidden md:block">
          <LeftSidebar
            currentTab={currentTab}
            unreadCount={unreadCount}
            compact={isGovPanel}
            onSelectTab={(t) => navigateTo(t)}
            onOpenCompose={() => setIsComposeModalOpen(true)}
          />
        </div>

        <main
          id="main-content"
          tabIndex={-1}
          className={`w-full min-w-0 flex-1 flex flex-col overflow-x-clip ${
            isGovPanel ? 'max-w-none gap-5' : 'max-w-[720px] gap-6'
          }`}
        >
          <div className="h-0.5 bg-retro-subtle overflow-hidden shrink-0 rounded-full" aria-hidden>
            <motion.div
              className="h-full bg-retro-navy"
              initial={false}
              animate={isRouting ? { scaleX: 1, opacity: [1, 1, 0] } : { scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'left center' }}
            />
          </div>

          <ErrorBoundary>
            <div
              key={`${currentTab}-${viewUsername}-${viewThreadId}-${viewHashtag}`}
              className="animate-view-enter flex flex-col gap-5"
            >
              <Suspense fallback={<FeedSkeleton />}>
                {renderActiveView()}
              </Suspense>
            </div>
          </ErrorBoundary>
        </main>

        {!isGovPanel && (
          <div className="hidden xl:block">
            <RightSidebar
              onSearch={(q) => {
                setSearchQuery(q);
                navigateTo('search');
              }}
              onNavigateTag={handleNavigateTag}
            />
          </div>
        )}
      </div>

      {!isGovPanel && (
        <MobileBottomNav
          currentTab={currentTab}
          unreadCount={unreadCount}
          onSelectTab={(t) => navigateTo(t)}
          onOpenCompose={() => setIsComposeModalOpen(true)}
        />
      )}

      {isGovPanel && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-retro-card border-t border-retro-border px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="font-body text-sm font-semibold text-retro-navy cursor-pointer"
          >
            ← City reports
          </button>
          <span className="civic-label">Command center</span>
        </div>
      )}

      <AnimatePresence>
        {isComposeModalOpen && !isGovPanel && (
          <motion.div
            key="compose-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b2545]/45 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setIsComposeModalOpen(false)}
          >
            <motion.div
              key="compose-panel"
              className="bg-retro-card border border-retro-border max-w-xl w-full max-h-[92dvh] overflow-y-auto p-6 flex flex-col gap-4 rounded-md shadow-pixel-lg"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="File anonymous report"
            >
              <div className="flex items-center justify-between border-b border-retro-border pb-3">
                <span className="civic-label">File anonymous report</span>
                <Pressable
                  as="button"
                  hoverLift={false}
                  aria-label="Close"
                  onClick={() => setIsComposeModalOpen(false)}
                  className="text-retro-muted hover:text-retro-text p-1 rounded-sm transition-colors duration-150"
                >
                  <X className="w-4 h-4" />
                </Pressable>
              </div>
              <ChirpComposer
                onPostCreated={() => {
                  setIsComposeModalOpen(false);
                  navigateTo('home');
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <AuthModal />
      </Suspense>
    </div>
  );
};
export default App;