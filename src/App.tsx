import React, { useState, useCallback, useMemo } from 'react';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Screener } from './components/Screener';
import { LiveScanner } from './components/LiveScanner';
import { WhaleAlerts } from './components/WhaleAlerts';
import { Watchlist } from './components/Watchlist';
import { WalletView } from './components/WalletView';
import { SettingsView } from './components/SettingsView';
import { Footer } from './components/Footer';
import { MOCK_NOTIFICATIONS } from './data';
import { Notification, PortfolioAsset, SwapToken } from './types';
import { useDexScreenerTokens } from './hooks/useDexScreenerTokens';
import { useWalletPortfolio } from './hooks/useWalletPortfolio';

export default function App() {
  // Default directly to Terminal app so user can immediately use the tools
  const [showLandingPage, setShowLandingPage] = useState(() => {
    return localStorage.getItem('solpulse_landing_active') === 'true';
  });
  const [activeTab, setActiveTab] = useState('screener');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { tokens, isLoading, fetchTokenByAddress } = useDexScreenerTokens();
  const { portfolio, swapTokens, isWalletLoading } = useWalletPortfolio(tokens);

  const unreadCount = notifications.filter(n => !n.read).length;

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

  return (
    <>
      {showLandingPage ? (
        <LandingPage onLaunch={handleEnterTerminal} />
      ) : (
        <div className="flex h-screen bg-[#0A0A0B] overflow-hidden">
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
            />
            
            <main className="flex-1 overflow-hidden flex flex-col">
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
            </main>
            
            <Footer />
          </div>
        </div>
      )}
    </>
  );
}
