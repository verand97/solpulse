import React, { useState, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Screener } from './components/Screener';
import { WhaleAlerts } from './components/WhaleAlerts';
import { Watchlist } from './components/Watchlist';
import { WalletView } from './components/WalletView';
import { SettingsView } from './components/SettingsView';
import { MOCK_NOTIFICATIONS } from './data';
import { Notification, PortfolioAsset, SwapToken } from './types';
import { useDexScreenerTokens } from './hooks/useDexScreenerTokens';
import { useWalletPortfolio } from './hooks/useWalletPortfolio';

export default function App() {
  const [activeTab, setActiveTab] = useState('screener');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { tokens, isLoading } = useDexScreenerTokens();
  const { portfolio, swapTokens, isWalletLoading } = useWalletPortfolio(tokens);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  return (
    <div className="flex h-screen bg-charcoal overflow-hidden selection:bg-neon-purple/30">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
        />
        
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="mx-auto max-w-7xl h-full">
            {activeTab === 'dashboard' && <Dashboard portfolio={portfolio} isLoading={isLoading} />}
            {activeTab === 'screener' && <Screener searchQuery={searchQuery} tokens={tokens} isLoading={isLoading} />}
            {activeTab === 'watchlist' && <Watchlist tokens={tokens} />}
            {activeTab === 'alerts' && <WhaleAlerts tokens={tokens} />}
            {activeTab === 'wallet' && <WalletView swapTokens={swapTokens} portfolio={portfolio} />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}
