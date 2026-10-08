import React, { useState, useMemo } from 'react';
import { Token } from '../types';
import { formatCurrency, formatNumber, formatAddress, cn } from '../utils';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Droplets, 
  X, 
  ExternalLink, 
  ArrowUpDown, 
  Loader2, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  Star,
  Flame,
  Zap,
  BarChart2,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import { useRugCheck } from '../hooks/useRugCheck';

interface ScreenerProps {
  searchQuery: string;
  tokens: Token[];
  isLoading: boolean;
  onSearchChange?: (q: string) => void;
  fetchTokenByAddress?: (addr: string) => Promise<Token | null>;
}

type SortKey = 'price' | 'priceChange24h' | 'priceChange1h' | 'volume24h' | 'liquidity' | 'marketCap' | 'createdAt';
type PresetFilter = 'all' | 'trending' | 'gainers' | 'losers' | 'new' | 'high_volume' | 'micro_cap';

export const Screener: React.FC<ScreenerProps> = ({ 
  searchQuery, 
  tokens, 
  isLoading,
  onSearchChange,
  fetchTokenByAddress
}) => {
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const [filter, setFilter] = useState<PresetFilter>('all');
  const [chainFilter, setChainFilter] = useState<string>('solana'); // default to Solana for solpulse
  const [sortBy, setSortBy] = useState<SortKey>('volume24h');
  const [sortAsc, setSortAsc] = useState(false);
  
  // Custom numeric filters
  const [minLiquidity, setMinLiquidity] = useState<number>(0);
  const [minVolume, setMinVolume] = useState<number>(0);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Modal State
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [modalTab, setModalTab] = useState<'chart' | 'security' | 'bubbles'>('chart');
  const [addressLookupInput, setAddressLookupInput] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const rugCheck = useRugCheck(selectedToken?.address || null);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(prev => !prev);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  const handleDirectAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLookupInput.trim()) return;
    setLookupError('');
    setIsSearchingAddress(true);

    if (fetchTokenByAddress) {
      const found = await fetchTokenByAddress(addressLookupInput.trim());
      if (found) {
        setSelectedToken(found);
        setAddressLookupInput('');
      } else {
        setLookupError('Token address not found on DEXes.');
      }
    }
    setIsSearchingAddress(false);
  };

  const filteredTokens = useMemo(() => {
    let result = tokens.filter(t => {
      // Chain filter
      if (chainFilter !== 'all' && t.chainId.toLowerCase() !== chainFilter.toLowerCase()) return false;
      
      // Numeric thresholds
      if (minLiquidity > 0 && t.liquidity < minLiquidity) return false;
      if (minVolume > 0 && t.volume24h < minVolume) return false;

      // Presets
      if (filter === 'gainers') return t.priceChange24h > 0;
      if (filter === 'losers') return t.priceChange24h < 0;
      if (filter === 'new') return Date.now() - t.createdAt < 86400000 * 7; // < 7 days
      if (filter === 'high_volume') return t.volume24h >= 100000;
      if (filter === 'micro_cap') return t.marketCap > 0 && t.marketCap <= 1000000;
      if (filter === 'trending') return (t.priceChange24h > 5 && t.volume24h > 50000) || t.volume24h > 250000;
      
      return true;
    });

    // Apply text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      const valA = (a[sortBy] as number) || 0;
      const valB = (b[sortBy] as number) || 0;
      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [tokens, filter, chainFilter, minLiquidity, minVolume, searchQuery, sortBy, sortAsc]);

  const SortHeader = ({ label, field, align = 'right' }: { label: string; field: SortKey; align?: string }) => (
    <th
      className={cn("px-4 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none text-xs", align === 'right' && 'text-right')}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === field && (
          <ArrowUpDown size={12} className={cn("text-neon-purple transition-transform", sortAsc && "rotate-180")} />
        )}
      </span>
    </th>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lime-green text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
              <Zap size={14} className="text-lime-green" /> Real-Time Screener
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            DEX Coin Screener
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Scan and filter tokens by liquidity, volume, price momentum, and automated RugCheck security audits.
          </p>
        </div>

        {/* Direct Contract Address Quick Search */}
        <form onSubmit={handleDirectAddressSearch} className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-80">
            <input
              type="text"
              placeholder="Paste CA / Mint Address..."
              value={addressLookupInput}
              onChange={(e) => setAddressLookupInput(e.target.value)}
              className="w-full bg-charcoal-light border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple"
            />
            {lookupError && (
              <span className="absolute -bottom-5 left-0 text-[10px] text-danger">{lookupError}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearchingAddress}
            className="px-3.5 py-2 rounded-xl bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/40 text-neon-purple text-xs font-bold uppercase transition-all flex items-center gap-1 shrink-0"
          >
            {isSearchingAddress ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Lookup
          </button>
        </form>
      </div>

      {/* Filter and Presets Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Chain Selector */}
          <div className="flex items-center gap-2">
            <select
              value={chainFilter}
              onChange={(e) => setChainFilter(e.target.value)}
              className="bg-charcoal border border-white/10 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-white focus:outline-none focus:border-neon-purple cursor-pointer shadow-inner"
            >
              <option value="solana">⚡ Solana</option>
              <option value="all">🌐 All Chains</option>
              <option value="base">🔵 Base</option>
              <option value="ethereum">💎 Ethereum</option>
              <option value="bsc">🟡 BSC</option>
            </select>

            <button
              onClick={() => setShowFiltersDrawer(prev => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                showFiltersDrawer || minLiquidity > 0 || minVolume > 0
                  ? "bg-neon-purple/20 text-neon-purple border-neon-purple/40"
                  : "bg-charcoal text-gray-400 border-white/10 hover:text-white"
              )}
            >
              <SlidersHorizontal size={14} /> Filters
              {(minLiquidity > 0 || minVolume > 0) && <span className="w-2 h-2 rounded-full bg-lime-green" />}
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-charcoal/80 p-1 rounded-xl border border-white/5">
            {[
              { id: 'all', label: 'All Pairs' },
              { id: 'trending', label: '🔥 Trending' },
              { id: 'gainers', label: '🚀 Gainers' },
              { id: 'losers', label: '🩸 Losers' },
              { id: 'new', label: '✨ New' },
              { id: 'high_volume', label: '💎 High Vol' },
              { id: 'micro_cap', label: '🎯 Micro Cap' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => setFilter(preset.id as PresetFilter)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200",
                  filter === preset.id
                    ? "bg-neon-purple text-white shadow-[0_0_12px_rgba(127,86,255,0.4)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Expandable Numeric Filters Drawer */}
        {showFiltersDrawer && (
          <div className="bg-charcoal-light/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Min Liquidity (USD)
              </label>
              <select
                value={minLiquidity}
                onChange={(e) => setMinLiquidity(Number(e.target.value))}
                className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neon-purple"
              >
                <option value={0}>Any Liquidity</option>
                <option value={5000}>&gt; $5,000</option>
                <option value={25000}>&gt; $25,000</option>
                <option value={100000}>&gt; $100,000</option>
                <option value={500000}>&gt; $500,000</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Min 24h Volume (USD)
              </label>
              <select
                value={minVolume}
                onChange={(e) => setMinVolume(Number(e.target.value))}
                className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neon-purple"
              >
                <option value={0}>Any Volume</option>
                <option value={10000}>&gt; $10,000</option>
                <option value={50000}>&gt; $50,000</option>
                <option value={250000}>&gt; $250,000</option>
                <option value={1000000}>&gt; $1,000,000</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-end justify-end gap-2">
              <button
                onClick={() => {
                  setMinLiquidity(0);
                  setMinVolume(0);
                  setFilter('all');
                }}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold uppercase transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tokens Table */}
      <div className="bg-charcoal-light/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-charcoal/90 border-b border-white/10 text-gray-400">
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Asset</th>
                <SortHeader label="Price" field="price" />
                <SortHeader label="24h Change" field="priceChange24h" />
                <SortHeader label="1h Change" field="priceChange1h" />
                <SortHeader label="24h Volume" field="volume24h" />
                <SortHeader label="Liquidity" field="liquidity" />
                <SortHeader label="Market Cap" field="marketCap" />
                <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-sm">
              {isLoading && tokens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <Loader2 size={32} className="animate-spin text-neon-purple mx-auto mb-3" />
                    <p className="font-sans font-bold text-white">Streaming Live Token Data from DexScreener...</p>
                    <p className="text-xs text-gray-500 mt-1">Fetching latest liquidity pools &amp; price feeds</p>
                  </td>
                </tr>
              ) : filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <p className="font-sans font-bold text-white text-base">No matching tokens found</p>
                    <p className="text-xs text-gray-500 mt-1">Try relaxing filters or search with contract address</p>
                  </td>
                </tr>
              ) : (
                filteredTokens.map((token) => {
                  const isPositive = token.priceChange24h >= 0;
                  const isPositive1h = (token.priceChange1h || 0) >= 0;
                  const inWatch = isInWatchlist(token.address);

                  return (
                    <tr
                      key={`${token.address}-${token.id}`}
                      onClick={() => setSelectedToken(token)}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      {/* Asset Identity */}
                      <td className="px-4 py-4 font-sans">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(token.address);
                            }}
                            className="p-1 rounded text-gray-600 hover:text-neon-purple transition-colors"
                            title={inWatch ? "Remove from Watchlist" : "Add to Watchlist"}
                          >
                            <Star size={16} className={cn(inWatch && "fill-neon-purple text-neon-purple")} />
                          </button>

                          <div className="relative w-9 h-9 rounded-full bg-charcoal border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {token.imageUrl ? (
                              <img src={token.imageUrl} alt={token.symbol} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-xs text-white">{token.symbol[0]}</span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-neon-purple transition-colors">
                                {token.symbol}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/5 uppercase">
                                {token.chainId}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 font-sans truncate max-w-[130px]">
                              {token.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4 text-right text-white font-bold">
                        {formatCurrency(token.price)}
                      </td>

                      {/* 24h Change */}
                      <td className="px-4 py-4 text-right">
                        <span className={cn(
                          "inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded",
                          isPositive ? "text-lime-green bg-lime-green/10" : "text-danger bg-danger/10"
                        )}>
                          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {isPositive ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                        </span>
                      </td>

                      {/* 1h Change */}
                      <td className="px-4 py-4 text-right text-xs">
                        {token.priceChange1h !== undefined ? (
                          <span className={isPositive1h ? "text-lime-green" : "text-danger"}>
                            {isPositive1h ? '+' : ''}{token.priceChange1h.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>

                      {/* 24h Volume */}
                      <td className="px-4 py-4 text-right text-gray-300">
                        {formatCurrency(token.volume24h)}
                      </td>

                      {/* Liquidity */}
                      <td className="px-4 py-4 text-right text-gray-300">
                        {formatCurrency(token.liquidity)}
                      </td>

                      {/* Market Cap */}
                      <td className="px-4 py-4 text-right text-gray-300">
                        {formatCurrency(token.marketCap)}
                      </td>

                      {/* Quick Actions */}
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedToken(token)}
                            className="px-2.5 py-1 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 text-neon-purple text-xs font-bold font-sans transition-colors"
                          >
                            Chart
                          </button>
                          <a
                            href={`https://jup.ag/swap/SOL-${token.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg bg-lime-green/10 hover:bg-lime-green/20 text-lime-green text-xs font-bold font-sans transition-colors flex items-center gap-1"
                            title="Trade on Jupiter"
                          >
                            Trade <ExternalLink size={10} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REAL TOKEN DETAIL MODAL */}
      {selectedToken && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedToken(null)}
        >
          <div
            className="bg-charcoal border border-white/15 rounded-2xl overflow-hidden w-full max-w-5xl shadow-2xl shadow-black/80 flex flex-col max-h-[92vh] animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-charcoal-light border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedToken.imageUrl ? (
                    <img src={selectedToken.imageUrl} alt={selectedToken.symbol} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-sm text-white">{selectedToken.symbol[0]}</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{selectedToken.symbol}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300 font-mono uppercase">
                      {selectedToken.chainId}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono truncate max-w-xs">
                    CA: {selectedToken.address}
                  </p>
                </div>
              </div>

              {/* Action buttons in header */}
              <div className="flex items-center gap-2">
                <a
                  href={`https://jup.ag/swap/SOL-${selectedToken.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-lime-green/20 hover:bg-lime-green/30 text-lime-green border border-lime-green/40 text-xs font-bold uppercase transition-all flex items-center gap-1.5"
                >
                  Swap Jupiter <ExternalLink size={12} />
                </a>

                <a
                  href={`https://solscan.io/token/${selectedToken.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-mono transition-all flex items-center gap-1.5"
                >
                  Solscan <ExternalLink size={12} />
                </a>

                <button
                  onClick={() => setSelectedToken(null)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 ml-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-charcoal-light/40 border-b border-white/5 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-charcoal/60 border border-white/5">
                <span className="text-gray-500 uppercase text-[10px] block">Price</span>
                <span className="text-base font-bold text-white">{formatCurrency(selectedToken.price)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-charcoal/60 border border-white/5">
                <span className="text-gray-500 uppercase text-[10px] block">24h Change</span>
                <span className={cn("text-base font-bold", selectedToken.priceChange24h >= 0 ? "text-lime-green" : "text-danger")}>
                  {selectedToken.priceChange24h >= 0 ? '+' : ''}{selectedToken.priceChange24h.toFixed(2)}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-charcoal/60 border border-white/5">
                <span className="text-gray-500 uppercase text-[10px] block">Liquidity</span>
                <span className="text-base font-bold text-white">{formatCurrency(selectedToken.liquidity)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-charcoal/60 border border-white/5">
                <span className="text-gray-500 uppercase text-[10px] block">Market Cap</span>
                <span className="text-base font-bold text-white">{formatCurrency(selectedToken.marketCap)}</span>
              </div>
            </div>

            {/* Tabs (Chart / RugCheck Security / Bubblemaps) */}
            <div className="flex border-b border-white/10 px-4 bg-charcoal">
              <button
                onClick={() => setModalTab('chart')}
                className={cn(
                  "py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
                  modalTab === 'chart'
                    ? "border-neon-purple text-white text-shadow"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                )}
              >
                📊 Live TradingView Chart
              </button>
              <button
                onClick={() => setModalTab('security')}
                className={cn(
                  "py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5",
                  modalTab === 'security'
                    ? "border-neon-purple text-white text-shadow"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                )}
              >
                🛡️ RugCheck Audit
                {rugCheck.data && (
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    rugCheck.data.isSafe ? "bg-lime-green" : "bg-danger"
                  )} />
                )}
              </button>
              <button
                onClick={() => setModalTab('bubbles')}
                className={cn(
                  "py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
                  modalTab === 'bubbles'
                    ? "border-neon-purple text-white text-shadow"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                )}
              >
                🫧 Bubblemaps Clusters
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[480px]">
              {/* TAB 1: REAL DEXSCREENER TRADINGVIEW EMBED */}
              {modalTab === 'chart' && (
                <div className="w-full h-[480px] rounded-xl overflow-hidden bg-black/60 border border-white/10">
                  <iframe
                    src={`https://dexscreener.com/${selectedToken.chainId}/${selectedToken.pairAddress || selectedToken.address}?embed=1&theme=dark&trades=0&info=0`}
                    title={`Chart for ${selectedToken.symbol}`}
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* TAB 2: RUGCHECK SECURITY AUDIT */}
              {modalTab === 'security' && (
                <div className="space-y-4">
                  {rugCheck.isLoading ? (
                    <div className="p-16 text-center text-gray-400">
                      <Loader2 size={32} className="animate-spin text-neon-purple mx-auto mb-2" />
                      <p className="font-bold text-white">Running RugCheck Smart Contract Analysis...</p>
                    </div>
                  ) : rugCheck.data ? (
                    <div className="space-y-4">
                      {/* Security Header Banner */}
                      <div className={cn(
                        "p-4 rounded-xl border flex items-center justify-between",
                        rugCheck.data.isSafe
                          ? "bg-lime-green/10 border-lime-green/30 text-lime-green"
                          : "bg-danger/10 border-danger/30 text-danger"
                      )}>
                        <div className="flex items-center gap-3">
                          {rugCheck.data.isSafe ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
                          <div>
                            <h4 className="font-bold text-base">
                              {rugCheck.data.isSafe ? 'Token Audit: Passed (Low Risk)' : 'Security Warnings Detected!'}
                            </h4>
                            <p className="text-xs opacity-80">
                              {rugCheck.data.isSafe 
                                ? 'No critical danger flags found in token contract.' 
                                : 'Contract contains high-risk vulnerabilities or dangerous authorities.'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-xs uppercase block">Risk Score</span>
                          <span className="text-2xl font-bold">{rugCheck.data.score}</span>
                        </div>
                      </div>

                      {/* Risks List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {rugCheck.data.risks?.map((risk, idx) => (
                          <div 
                            key={idx} 
                            className={cn(
                              "p-3.5 rounded-xl border text-xs",
                              risk.level === 'danger' ? "bg-danger/10 border-danger/20 text-danger" :
                              risk.level === 'warn' ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                              "bg-lime-green/10 border-lime-green/20 text-lime-green"
                            )}
                          >
                            <div className="flex items-center justify-between font-bold mb-1">
                              <span>{risk.name}</span>
                              <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-black/30">
                                {risk.level}
                              </span>
                            </div>
                            <p className="opacity-90">{risk.description || risk.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-gray-500">
                      <p>Security report currently unavailable for this token.</p>
                      <a
                        href={`https://rugcheck.xyz/tokens/${selectedToken.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neon-purple hover:underline text-xs mt-2 inline-block"
                      >
                        Inspect directly on RugCheck.xyz &rarr;
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: BUBBLEMAPS CLUSTERS */}
              {modalTab === 'bubbles' && (
                <div className="w-full h-[480px] rounded-xl overflow-hidden bg-black/60 border border-white/10">
                  <iframe
                    src={`https://app.bubblemaps.io/sol/token/${selectedToken.address}?embed=true`}
                    title={`Bubblemaps for ${selectedToken.symbol}`}
                    className="w-full h-full border-0"
                    allow="clipboard-write"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
