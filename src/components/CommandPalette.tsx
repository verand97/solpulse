import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Zap,
  TrendingUp,
  ExternalLink,
  Star,
  LayoutDashboard,
  LineChart,
  Brain,
  Flame,
  ShieldAlert,
  Radar,
  Wallet,
  Settings,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Token } from '../types';
import { TokenAvatar } from './TokenAvatar';
import { formatCurrency, formatAddress, cn } from '../utils';
import { playQuickActionClick } from '../utils/audioAlert';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: Token[];
  onSelectToken: (token: Token) => void;
  onNavigateTab: (tabId: string) => void;
  onToggleWatchlist?: (address: string) => void;
  isInWatchlist?: (address: string) => boolean;
}

interface NavCommand {
  id: string;
  type: 'tab';
  title: string;
  category: 'Navigation';
  icon: React.ElementType;
}

const NAV_COMMANDS: NavCommand[] = [
  { id: 'dashboard', type: 'tab', title: 'Dashboard Overview', category: 'Navigation', icon: LayoutDashboard },
  { id: 'screener', type: 'tab', title: 'Live DEX Screener', category: 'Navigation', icon: LineChart },
  { id: 'mlscreener', type: 'tab', title: 'AI Memecoin Screener (v1.1 ML)', category: 'Navigation', icon: Brain },
  { id: 'narrative', type: 'tab', title: 'X Narrative & Memecoin Radar', category: 'Navigation', icon: Flame },
  { id: 'alerts', type: 'tab', title: 'Whale Alerts & Tracker', category: 'Navigation', icon: ShieldAlert },
  { id: 'livescanner', type: 'tab', title: 'Live Stream Scanner', category: 'Navigation', icon: Radar },
  { id: 'watchlist', type: 'tab', title: 'Pinned Watchlist', category: 'Navigation', icon: Star },
  { id: 'wallet', type: 'tab', title: 'Wallet & DEX Swap', category: 'Navigation', icon: Wallet },
  { id: 'settings', type: 'tab', title: 'System & RPC Settings', category: 'Navigation', icon: Settings },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tokens,
  onSelectToken,
  onNavigateTab,
  onToggleWatchlist,
  isInWatchlist,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keydown listener for Esc and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter items
  const matchedTokens = useMemo(() => {
    if (!query.trim()) return tokens.slice(0, 8);
    const q = query.toLowerCase().trim();
    return tokens.filter(t =>
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [tokens, query]);

  const matchedTabs = useMemo(() => {
    if (!query.trim()) return NAV_COMMANDS;
    const q = query.toLowerCase().trim();
    return NAV_COMMANDS.filter(c => c.title.toLowerCase().includes(q));
  }, [query]);

  // Flattened items for keyboard indexing
  const allItems = useMemo(() => {
    return [
      ...matchedTabs.map(t => ({ ...t, kind: 'tab' as const })),
      ...matchedTokens.map(t => ({ ...t, kind: 'token' as const })),
    ];
  }, [matchedTabs, matchedTokens]);

  // Keyboard navigation
  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1 < allItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        executeItem(current);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeItem = (item: any) => {
    playQuickActionClick();
    if (item.kind === 'tab') {
      onNavigateTab(item.id);
      onClose();
    } else if (item.kind === 'token') {
      onSelectToken(item);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface border border-border-2 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyNavigation}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-bg/60">
          <Search size={16} className="text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tokens, symbols, contract addresses, or navigation tabs..."
            className="w-full bg-transparent text-[13.5px] text-txt placeholder-txt-3 outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-txt-3 hover:text-txt"
            >
              <X size={14} />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-2 border border-border text-[10px] font-mono text-txt-3">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-surface-2 custom-scrollbar p-2">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-txt-3 text-[12.5px]">
              No tokens or commands found for "{query}"
            </div>
          ) : (
            <>
              {/* Navigation Commands */}
              {matchedTabs.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-txt-3">
                    Terminal Navigation
                  </div>
                  {matchedTabs.map((tab, idx) => {
                    const isSelected = selectedIndex === idx;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => executeItem({ ...tab, kind: 'tab' })}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors text-[12.5px]',
                          isSelected
                            ? 'bg-blue-500/15 text-blue-400 font-medium'
                            : 'text-txt-2 hover:bg-surface-2 hover:text-txt'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={14} className={isSelected ? 'text-blue-400' : 'text-txt-3'} />
                          <span>{tab.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-txt-3 flex items-center gap-1">
                          Jump <ArrowRight size={10} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tokens Results */}
              {matchedTokens.length > 0 && (
                <div className="pt-1">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-txt-3 flex items-center justify-between">
                    <span>Tokens & Memecoins</span>
                    <span className="text-[9.5px] font-normal lowercase">{matchedTokens.length} results</span>
                  </div>
                  {matchedTokens.map((token, idx) => {
                    const globalIdx = matchedTabs.length + idx;
                    const isSelected = selectedIndex === globalIdx;
                    const isPos = token.priceChange24h >= 0;
                    const inWatch = isInWatchlist ? isInWatchlist(token.address) : false;

                    return (
                      <div
                        key={token.address}
                        onClick={() => executeItem({ ...token, kind: 'token' })}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-[12px]',
                          isSelected
                            ? 'bg-blue-500/15 border border-blue-500/30'
                            : 'hover:bg-surface-2 border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <TokenAvatar
                            symbol={token.symbol}
                            address={token.address}
                            imageUrl={token.imageUrl}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-txt text-[12.5px]">{token.symbol}</span>
                              <span className="text-[11px] text-txt-3 truncate max-w-40">{token.name}</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-surface-3 text-txt-3 font-mono uppercase">
                                {token.chainId}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-txt-3">
                              {formatAddress(token.address, 4)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-right">
                          <div>
                            <div className="font-mono font-semibold text-txt text-[12px]">
                              {formatCurrency(token.price)}
                            </div>
                            <div className={cn('text-[10px] font-mono', isPos ? 'text-green-400' : 'text-red-400')}>
                              {isPos ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            {onToggleWatchlist && (
                              <button
                                onClick={() => onToggleWatchlist(token.address)}
                                className={cn(
                                  'p-1.5 rounded hover:bg-surface-3 transition-colors',
                                  inWatch ? 'text-amber-400 fill-amber-400' : 'text-txt-3'
                                )}
                                title="Toggle Watchlist"
                              >
                                <Star size={12} className={inWatch ? 'fill-current' : ''} />
                              </button>
                            )}
                            <a
                              href={`https://jup.ag/swap/SOL-${token.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-[10.5px] font-mono flex items-center gap-1 transition-colors"
                            >
                              Trade <ExternalLink size={9} />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-border bg-bg/80 flex items-center justify-between text-[11px] text-txt-3 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to dismiss</span>
          </div>
          <div className="flex items-center gap-1 text-blue-400">
            <Sparkles size={11} />
            <span>SolPulse Global Spotlight</span>
          </div>
        </div>
      </div>
    </div>
  );
};
