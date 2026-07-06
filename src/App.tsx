import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Screener } from './components/Screener';
import { WhaleAlerts } from './components/WhaleAlerts';
import { WalletView } from './components/WalletView';
import { MOCK_NOTIFICATIONS } from './data';
import { Notification } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('screener');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [walletConnected, setWalletConnected] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    <div className="flex h-screen bg-[#1E1F22] overflow-hidden selection:bg-[#7F56FF]/30">
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
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'screener' && <Screener searchQuery={searchQuery} />}
            {activeTab === 'alerts' && <WhaleAlerts />}
            {activeTab === 'wallet' && <WalletView walletConnected={walletConnected} onConnect={handleConnectWallet} />}
          </div>
        </main>
      </div>
    </div>
  );
}
