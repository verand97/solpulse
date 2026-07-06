import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, WalletCards, X, Check, CheckCheck, ShieldAlert, TrendingUp, Radio, LogOut } from 'lucide-react';
import { Notification } from '../types';
import { cn } from '../utils';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  walletConnected: boolean;
  onConnectWallet: () => void;
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  whale: <ShieldAlert size={16} className="text-danger" />,
  price: <TrendingUp size={16} className="text-lime-green" />,
  system: <Radio size={16} className="text-neon-purple" />,
};

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  walletConnected,
  onConnectWallet,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const timeAgo = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <header className="h-16 bg-charcoal border-b border-charcoal-lighter flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-500" />
          </div>
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-charcoal-lighter rounded-lg leading-5 bg-charcoal-light text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple sm:text-sm transition-colors"
            placeholder="Search tokens, pairs, or addresses..."
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="notif-button"
            onClick={() => setShowNotifs(prev => !prev)}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-[10px] text-white font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-96 bg-charcoal-light border border-charcoal-lighter rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-[fadeIn_150ms_ease-out]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal-lighter">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-xs text-neon-purple hover:text-neon-purple-hover font-medium flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-charcoal-lighter">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => onMarkRead(n.id)}
                      className={cn(
                        "px-4 py-3 flex gap-3 cursor-pointer transition-colors",
                        !n.read ? "bg-neon-purple/5 hover:bg-neon-purple/10" : "hover:bg-charcoal-lighter/50"
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {NOTIF_ICONS[n.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("text-sm font-medium truncate", !n.read ? "text-white" : "text-gray-400")}>
                            {n.title}
                          </p>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-neon-purple shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-gray-600 mt-1">{timeAgo(n.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Wallet */}
        <button
          id="connect-wallet"
          onClick={onConnectWallet}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            walletConnected
              ? "bg-lime-green/10 text-lime-green border border-lime-green/20 hover:bg-lime-green/20"
              : "bg-neon-purple hover:bg-neon-purple-hover text-white shadow-[0_0_15px_rgba(127,86,255,0.3)]"
          )}
        >
          {walletConnected ? (
            <>
              <div className="w-2 h-2 rounded-full bg-lime-green animate-pulse" />
              7aV...9Kp
              <LogOut size={14} className="ml-1 opacity-0 group-hover:opacity-100" />
            </>
          ) : (
            <>
              <WalletCards size={16} />
              Connect Wallet
            </>
          )}
        </button>
      </div>
    </header>
  );
};
