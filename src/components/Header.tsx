import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, WalletCards, X, Check, CheckCheck, ShieldAlert, TrendingUp, Radio, LogOut } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Notification } from '../types';
import { cn } from '../utils';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  whale: <ShieldAlert size={16} className="text-danger drop-shadow-[0_0_5px_rgba(255,86,86,0.5)]" />,
  price: <TrendingUp size={16} className="text-lime-green drop-shadow-[0_0_5px_rgba(128,255,86,0.5)]" />,
  system: <Radio size={16} className="text-neon-purple drop-shadow-[0_0_5px_rgba(127,86,255,0.5)]" />,
};

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

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
    if (mins < 1) return 'SYS.NOW';
    if (mins < 60) return `-${mins}M`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `-${hrs}H`;
    return `-${Math.floor(hrs / 24)}D`;
  };
  
  const handleWalletAction = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  const shortenAddress = (addr: string | undefined) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <header className="h-20 bg-charcoal/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className={cn(
          "relative group transition-all duration-300 rounded-lg",
          isFocused ? "shadow-[0_0_20px_rgba(127,86,255,0.15)]" : ""
        )}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className={cn("transition-colors duration-300", isFocused ? "text-neon-purple" : "text-gray-500 group-hover:text-gray-400")} />
          </div>
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-11 pr-10 py-2.5 bg-black/40 border border-white/5 rounded-lg leading-5 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-neon-purple/50 focus:bg-charcoal/50 sm:text-sm transition-all duration-300 font-mono"
            placeholder="SCAN ASSETS..."
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neon-purple hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
          
          {/* Cyberpunk accent lines for search */}
          <div className={cn(
            "absolute -bottom-px left-2 right-2 h-px bg-neon-purple transition-all duration-500",
            isFocused ? "opacity-100" : "opacity-0 scale-x-0"
          )} />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="notif-button"
            onClick={() => setShowNotifs(prev => !prev)}
            className={cn(
              "p-2.5 rounded-lg transition-all duration-300 relative group border",
              showNotifs || unreadCount > 0
                ? "bg-neon-purple/10 text-neon-purple border-neon-purple/30 shadow-[0_0_15px_rgba(127,86,255,0.15)]" 
                : "bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:border-white/10 hover:text-gray-200"
            )}
          >
            <Bell size={20} className={cn(unreadCount > 0 ? "animate-pulse" : "")} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-md bg-neon-purple text-[10px] text-white font-bold font-mono flex items-center justify-center shadow-[0_0_10px_#7F56FF]">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-14 w-96 bg-charcoal/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-fade-in-up before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] before:bg-size-[100%_4px] before:pointer-events-none">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 relative z-10 bg-black/20">
                <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                  <Radio size={14} className="text-neon-purple animate-pulse" /> Comm Link
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-[10px] text-neon-purple hover:text-white uppercase tracking-wider font-bold flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck size={14} /> Clear All
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5 custom-scrollbar relative z-10">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                    <ShieldAlert size={32} className="text-gray-600" />
                    <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">No Active Alerts</span>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkRead(n.id)}
                      className={cn(
                        "px-5 py-4 flex gap-4 cursor-pointer transition-all duration-300 relative group overflow-hidden",
                        !n.read ? "bg-neon-purple/5 hover:bg-neon-purple/15" : "hover:bg-white/5"
                      )}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {!n.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-purple shadow-[0_0_10px_#7F56FF]" />
                      )}
                      
                      <div className="mt-1 shrink-0 p-2 rounded-lg bg-black/40 border border-white/5">
                        {NOTIF_ICONS[n.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={cn("text-sm font-bold truncate tracking-wide", !n.read ? "text-white drop-shadow-md" : "text-gray-400")}>
                            {n.title}
                          </p>
                          <p className="text-[10px] text-neon-purple font-mono font-bold shrink-0 mt-0.5 opacity-80">{timeAgo(n.timestamp)}</p>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{n.message}</p>
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
          onClick={handleWalletAction}
          className={cn(
            "flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 group relative overflow-hidden",
            connected
              ? "bg-charcoal border border-lime-green/30 text-lime-green hover:border-danger/50 hover:text-danger hover:shadow-[0_0_15px_rgba(255,86,86,0.2)]"
              : "bg-neon-purple text-white shadow-[0_0_20px_rgba(127,86,255,0.4)] hover:shadow-[0_0_30px_rgba(127,86,255,0.6)] border border-neon-purple-hover"
          )}
        >
          {connected ? (
            <>
              <div className="absolute inset-0 bg-lime-green/5 group-hover:bg-danger/10 transition-colors" />
              <div className="relative flex items-center justify-center w-2 h-2 group-hover:hidden">
                <div className="absolute w-full h-full rounded-full bg-lime-green animate-ping opacity-75" />
                <div className="relative w-1.5 h-1.5 rounded-full bg-lime-green" />
              </div>
              <span className="relative font-mono group-hover:hidden">{shortenAddress(publicKey?.toBase58())}</span>
              <span className="relative hidden group-hover:inline">Disconnect</span>
              <LogOut size={14} className="relative ml-1 hidden group-hover:block drop-shadow-[0_0_5px_rgba(255,86,86,0.8)]" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <WalletCards size={16} className="relative drop-shadow-md" />
              <span className="relative">Uplink Wallet</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
