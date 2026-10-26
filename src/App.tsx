// SolPulse Terminal - Solana Analytics
import React, { useState, useCallback, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Screener } from './components/Screener';
import { Footer } from './components/Footer';

// Code-split heavy views with React.lazy
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const MLScreenerView = lazy(() => import('./components/MLScreenerView').then(m => ({ default: m.MLScreenerView })));
const NarrativeRadar = lazy(() => import('./components/NarrativeRadar').then(m => ({ default: m.NarrativeRadar })));
const LiveScanner = lazy(() => import('./components/LiveScanner').then(m => ({ default: m.LiveScanner })));
const WhaleAlerts = lazy(() => import('./components/WhaleAlerts').then(m => ({ default: m.WhaleAlerts })));
const Watchlist = lazy(() => import('./components/Watchlist').then(m => ({ default: m.Watchlist })));
const WalletView = lazy(() => import('./components/WalletView').then(m => ({ default: m.WalletView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));

const TabLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center py-24 text-txt-3">
    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2.5" />
    <span className="text-[11.5px] font-mono">Loading module...</span>
  </div>
);
import { MOCK_NOTIFICATIONS } from './data';
import { Notification, PortfolioAsset, SwapToken, Token } from './types';
import { useDexScreenerTokens } from './hooks/useDexScreenerTokens';
import { useWalletPortfolio } from './hooks/useWalletPortfolio';
import { useWatchlist } from './hooks/useWatchlist';
import { CommandPalette } from './components/CommandPalette';

export default function App() {
  // Default directly to Terminal app so user can immediately use the tools
  const [showLandingPage, setShowLandingPage] = useState(() => {
    return localStorage.getItem('solpulse_landing_active') === 'true';
  });
  const [activeTab, setActiveTab] = useState('screener');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const { tokens, isLoading, fetchTokenByAddress } = useDexScreenerTokens();
  const { portfolio, swapTokens, isWalletLoading } = useWalletPortfolio(tokens);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleEnterTerminal = () => {
    localStorage.removeItem('solpulse_landing_active');
    setShowLandingPage(false);
  };

  const handleOpenLanding = () => {
    localStorage.setItem('solpulse_landing_active', 'true');
    setShowLandingPage(true);
  };

  const handleSelectTokenFromPalette = (token: Token) => {
    setSearchQuery(token.symbol);
    setActiveTab('screener');
  };

  return (
    <>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tokens={tokens}
        onSelectToken={handleSelectTokenFromPalette}
        onNavigateTab={setActiveTab}
        onToggleWatchlist={toggleWatchlist}
        isInWatchlist={isInWatchlist}
      />
      {showLandingPage ? (
        <Suspense fallback={<TabLoader />}>
          <LandingPage onLaunch={handleEnterTerminal} />
        </Suspense>
      ) : (
        <div className="flex h-screen bg-bg overflow-hidden">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
            onOpenLanding={handleOpenLanding}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={handleMarkAllRead}
              onMarkRead={handleMarkRead}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            />
            
            <main className="flex-1 overflow-hidden flex flex-col">
              <Suspense fallback={<TabLoader />}>
                {activeTab === 'dashboard' && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <Dashboard portfolio={portfolio} isLoading={isLoading} />
                  </div>
                )}
                {activeTab === 'screener' && (
                  <Screener 
                    searchQuery={searchQuery} 
                    tokens={tokens} 
                    isLoading={isLoading} 
                    onSearchChange={setSearchQuery}
                    fetchTokenByAddress={fetchTokenByAddress}
                  />
                )}
                {activeTab === 'mlscreener' && <MLScreenerView />}
                {activeTab === 'narrative' && <NarrativeRadar />}
                {activeTab === 'livescanner' && <LiveScanner />}
                {activeTab === 'watchlist' && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <Watchlist tokens={tokens} />
                  </div>
                )}
                {activeTab === 'alerts' && <WhaleAlerts tokens={tokens} />}
                {activeTab === 'wallet' && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <WalletView swapTokens={swapTokens} portfolio={portfolio} />
                  </div>
                )}
                {activeTab === 'settings' && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <SettingsView />
                  </div>
                )}
              </Suspense>
            </main>
            
            <Footer />
          </div>
        </div>
      )}
    </>
  );
}
