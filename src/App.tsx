import React, { useState, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Screener } from './components/Screener';
import { WhaleAlerts } from './components/WhaleAlerts';
import { WalletView } from './components/WalletView';
import { MOCK_NOTIFICATIONS } from './data';
import { Notification, PortfolioAsset, SwapToken } from './types';
import { useDexScreenerTokens } from './hooks/useDexScreenerTokens';

export default function App() {
  const [activeTab, setActiveTab] = useState('screener');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [walletConnected, setWalletConnected] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { tokens, isLoading } = useDexScreenerTokens();

  const portfolio = useMemo(() => {
    if (!tokens.length) return [];
    
    // Create a dynamic portfolio based on real tokens
    const assets: PortfolioAsset[] = [];
    if (tokens.length > 0) assets.push({ token: tokens[0], balance: 45.5, avgBuyPrice: tokens[0].price * 0.8 }); // e.g., SOL
    if (tokens.length > 1) assets.push({ token: tokens[1], balance: 1500, avgBuyPrice: tokens[1].price * 1.2 });
    if (tokens.length > 2) assets.push({ token: tokens[2], balance: 25000, avgBuyPrice: tokens[2].price * 0.9 });
    
    return assets;
  }, [tokens]);

  const swapTokens = useMemo(() => {
    if (!tokens.length) return [];
    
    return tokens.slice(0, 10).map((t, i) => ({
      symbol: t.symbol,
      name: t.name,
      balance: i === 0 ? 42.5 : (i === 1 ? 1250.0 : 0),
      price: t.price,
      icon: t.symbol[0],
      imageUrl: t.imageUrl
    }));
  }, [tokens]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleConnectWallet = useCallback(() => {
    setWalletConnected(prev => !prev);
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
          walletConnected={walletConnected}
          onConnectWallet={handleConnectWallet}
        />
        
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="mx-auto max-w-7xl h-full">
            {activeTab === 'dashboard' && <Dashboard portfolio={portfolio} isLoading={isLoading} />}
            {activeTab === 'screener' && <Screener searchQuery={searchQuery} tokens={tokens} isLoading={isLoading} />}
            {activeTab === 'alerts' && <WhaleAlerts tokens={tokens} />}
            {activeTab === 'wallet' && <WalletView walletConnected={walletConnected} onConnect={handleConnectWallet} swapTokens={swapTokens} portfolio={portfolio} />}
          </div>
        </main>
      </div>
    </div>
  );
}
