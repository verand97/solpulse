import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  X,
  CheckCheck,
  ShieldAlert,
  TrendingUp,
  Radio,
  LogOut,
  Wallet,
  Volume2,
  Volume1,
  VolumeX,
  SlidersHorizontal,
  Play
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Notification } from '../types';
import { cn } from '../utils';
import {
  isAudioAlertEnabled,
  setAudioAlertEnabled,
  getAlertVolume,
  setAlertVolume,
  playBreakoutChime,
  playRiskWarningChime,
  playQuickActionClick
} from '../utils/audioAlert';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onOpenCommandPalette?: () => void;
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  whale: <ShieldAlert size={14} className="text-blue-400" />,
  price: <TrendingUp size={14} className="text-green-400" />,
  system: <Radio size={14} className="text-txt-2" />,
};

const timeAgo = (ts: number) => {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  onOpenCommandPalette,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(isAudioAlertEnabled);
  const [volume, setVolume] = useState(() => Math.round(getAlertVolume() * 100));

  const notifRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !audioEnabled;
    setAudioEnabled(next);
    setAudioAlertEnabled(next);
    if (next) playBreakoutChime();
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    setAlertVolume(newVal / 100);
    if (!audioEnabled && newVal > 0) {
      setAudioEnabled(true);
      setAudioAlertEnabled(true);
    }
  };

  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (audioRef.current && !audioRef.current.contains(e.target as Node)) {
        setShowAudioMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const shortenAddress = (addr?: string) =>
    addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : '';

  const getAudioIcon = () => {
    if (!audioEnabled || volume === 0) return <VolumeX size={14} />;
    if (volume < 50) return <Volume1 size={14} />;
    return <Volume2 size={14} />;
  };

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-bg shrink-0">
      {/* Search / Command Palette Trigger */}
      <div className="flex-1 max-w-96">
        <div 
          onClick={onOpenCommandPalette}
          className="relative group cursor-pointer"
        >
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-3 pointer-events-none group-hover:text-blue-400 transition-colors" />
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tokens, CAs, tabs (Ctrl+K)..."
            className="w-full h-8 pl-8 pr-16 bg-surface-2 border border-border group-hover:border-border-2 rounded-md text-[12px] text-txt placeholder-txt-3 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery ? (
              <button
                onClick={(e) => { e.stopPropagation(); onSearchChange(''); }}
                className="text-txt-3 hover:text-txt-2"
              >
                <X size={12} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-surface-3 border border-border text-[9.5px] font-mono text-txt-3 group-hover:text-txt-2 transition-colors"
                title="Open Global Spotlight (Ctrl+K)"
              >
                ⌘K
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-3">
        {/* Audio Alpha Alert Popover & Toggle */}
        <div className="relative" ref={audioRef}>
          <button
            id="audio-alert-button"
            onClick={() => setShowAudioMenu(prev => !prev)}
            className={cn(
              'relative h-8 w-8 flex items-center justify-center rounded-md transition-colors border',
              audioEnabled && volume > 0
                ? 'bg-surface-2 text-emerald-400 border-border hover:border-emerald-500/30'
                : 'text-txt-3 border-transparent hover:text-txt-2 hover:bg-surface-2'
            )}
            title={`Alpha Audio Chime: ${audioEnabled ? `${volume}%` : 'Muted'} (Click for sound controls)`}
          >
            {getAudioIcon()}
          </button>

          {showAudioMenu && (
            <div className="absolute right-0 top-10 w-64 bg-surface border border-border rounded-lg shadow-2xl p-3 z-50 text-[11px] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                <span className="font-semibold text-txt flex items-center gap-1.5">
                  <SlidersHorizontal size={12} className="text-emerald-400" />
                  Audio Alert Synthesizer
                </span>
                <button
                  onClick={toggleAudio}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-medium transition-colors border',
                    audioEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-surface-2 text-txt-3 border-border hover:text-txt'
                  )}
                >
                  {audioEnabled ? 'Active' : 'Muted'}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-txt-3">
                  <span>Volume Level</span>
                  <span className="font-mono text-txt font-medium">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-surface-3 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-1 mb-3">
                {[0, 30, 70, 100].map((v) => (
                  <button
                    key={v}
                    onClick={() => handleVolumeChange(v)}
                    className={cn(
                      'py-1 rounded text-[10px] font-mono border transition-colors',
                      volume === v
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-surface-2 text-txt-3 border-border hover:text-txt hover:bg-surface-3'
                    )}
                  >
                    {v === 0 ? 'Mute' : `${v}%`}
                  </button>
                ))}
              </div>

              {/* Sound Test Previews */}
              <div className="pt-2 border-t border-border/80 space-y-1">
                <span className="text-[10px] text-txt-3 uppercase tracking-wider font-semibold">Sound Previews</span>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => playBreakoutChime()}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-surface-2 border border-border hover:border-emerald-500/40 hover:text-emerald-400 text-txt-2 transition-colors text-[10px]"
                  >
                    <Play size={10} className="fill-current" />
                    Breakout Alpha
                  </button>
                  <button
                    onClick={() => playRiskWarningChime()}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-surface-2 border border-border hover:border-rose-500/40 hover:text-rose-400 text-txt-2 transition-colors text-[10px]"
                  >
                    <Play size={10} className="fill-current" />
                    Risk Warning
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="notif-button"
            onClick={() => setShowNotifs(prev => !prev)}
            className={cn(
              'relative h-8 w-8 flex items-center justify-center rounded-md transition-colors',
              showNotifs || unreadCount > 0
                ? 'bg-surface-2 text-blue-400 border border-border'
                : 'text-txt-3 hover:text-txt-2 hover:bg-surface-2'
            )}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 text-[9px] text-white font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-10 w-80 bg-surface border border-border rounded-lg shadow-2xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <span className="text-[11px] font-semibold text-txt-2 uppercase tracking-wider">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      playQuickActionClick();
                      onMarkAllRead();
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-surface-3 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-txt-3 text-[12px]">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        playQuickActionClick();
                        onMarkRead(n.id);
                      }}
                      className={cn(
                        'px-3 py-3 flex gap-3 cursor-pointer transition-colors',
                        !n.read ? 'bg-surface-2' : 'hover:bg-surface-2'
                      )}
                    >
                      <div className="mt-0.5 shrink-0">{NOTIF_ICONS[n.type]}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className={cn(
                            'text-[12px] font-medium truncate',
                            !n.read ? 'text-txt' : 'text-txt-2'
                          )}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-txt-3 shrink-0">{timeAgo(n.timestamp)}</span>
                        </div>
                        <p className="text-[11px] text-txt-3 line-clamp-2">{n.message}</p>
                      </div>
                      {!n.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      )}
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
          onClick={connected ? disconnect : () => setVisible(true)}
          className={cn(
            'h-8 flex items-center gap-2 px-3 rounded-md text-[12px] font-medium transition-colors border',
            connected
              ? 'bg-surface-2 text-txt-2 border-border hover:border-border-2 hover:text-txt'
              : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600'
          )}
        >
          {connected ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              <span className="font-mono">{shortenAddress(publicKey?.toBase58())}</span>
              <LogOut size={12} className="text-txt-3" />
            </>
          ) : (
            <>
              <Wallet size={13} />
              Connect Wallet
            </>
          )}
        </button>
      </div>
    </header>
  );
};
