import React, { useState, useEffect, useMemo } from 'react';
import { generateMockChartData } from '../data';
import { Token } from '../types';
import { formatCurrency, formatNumber, cn } from '../utils';
import { Search, TrendingUp, TrendingDown, Clock, Droplets, X, ExternalLink, ArrowUpDown, Loader2, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { TokenChart } from './TokenChart';
import { useWatchlist } from '../hooks/useWatchlist';
import { useRugCheck } from '../hooks/useRugCheck';
import { Star } from 'lucide-react';

interface ScreenerProps {
  searchQuery: string;
  tokens: Token[];
  isLoading: boolean;
}

type SortKey = 'price' | 'priceChange24h' | 'volume24h' | 'liquidity' | 'marketCap';

export const Screener: React.FC<ScreenerProps> = ({ searchQuery, tokens, isLoading }) => {
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers' | 'new'>('all');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('volume24h');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const rugCheck = useRugCheck(selectedToken?.address || null);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(prev => !prev);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  const filteredTokens = useMemo(() => {
    let result = tokens.filter(t => {
      if (chainFilter !== 'all' && t.chainId !== chainFilter) return false;
      if (filter === 'gainers') return t.priceChange24h > 0;
      if (filter === 'losers') return t.priceChange24h < 0;
      if (filter === 'new') return Date.now() - t.createdAt < 86400000 * 30;
      return true;
    });

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      const mult = sortAsc ? 1 : -1;
      return (a[sortBy] - b[sortBy]) * mult;
    });

    return result;
  }, [tokens, filter, chainFilter, searchQuery, sortBy, sortAsc]);

  const chartData = useMemo(() => {
    if (!selectedToken) return [];
    return generateMockChartData(selectedToken.price, selectedToken.priceChange24h, 80);
  }, [selectedToken]);

  const SortHeader = ({ label, field, align = 'right' }: { label: string; field: SortKey; align?: string }) => (
    <th
      className={cn("px-6 py-4 font-medium cursor-pointer hover:text-gray-200 transition-colors select-none", align === 'right' && 'text-right')}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === field && (
          <ArrowUpDown size={12} className={cn("transition-transform", sortAsc && "rotate-180")} />
        )}
      </span>
    </th>
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">DEX Screener</h2>
          <p className="text-gray-400 text-sm">Real-time cross-chain token pairs and liquidity.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <select
            value={chainFilter}
            onChange={(e) => setChainFilter(e.target.value)}
            className="bg-charcoal-light border border-charcoal-lighter rounded-lg px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:border-neon-purple cursor-pointer"
          >
            <option value="all">All Chains</option>
            <option value="solana">Solana</option>
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="base">Base</option>
          </select>
          <div className="flex bg-charcoal-light p-1 rounded-lg border border-charcoal-lighter">
            <button 
              onClick={() => setFilter('all')}
              className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors", filter === 'all' ? "bg-charcoal-lighter text-white" : "text-gray-400 hover:text-gray-200")}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('gainers')}
              className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1", filter === 'gainers' ? "bg-charcoal-lighter text-lime-green" : "text-gray-400 hover:text-gray-200")}
            >
              <TrendingUp size={14} /> Gainers
            </button>
            <button 
              onClick={() => setFilter('losers')}
              className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1", filter === 'losers' ? "bg-charcoal-lighter text-danger" : "text-gray-400 hover:text-gray-200")}
            >
              <TrendingDown size={14} /> Losers
            </button>
            <button 
              onClick={() => setFilter('new')}
              className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1", filter === 'new' ? "bg-charcoal-lighter text-neon-purple" : "text-gray-400 hover:text-gray-200")}
            >
              <Clock size={14} /> New Pairs
            </button>
          </div>
        </div>
      </div>

      {searchQuery && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
          <Search size={14} />
          Showing results for "<span className="text-white font-medium">{searchQuery}</span>"
          <span className="text-gray-500">— {filteredTokens.length} found</span>
        </div>
      )}

      <div className="bg-charcoal-light rounded-xl border border-charcoal-lighter overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-charcoal border-b border-charcoal-lighter text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Token</th>
                <SortHeader label="Price" field="price" />
                <SortHeader label="24h Change" field="priceChange24h" />
                <SortHeader label="Volume" field="volume24h" />
                <SortHeader label="Liquidity" field="liquidity" />
                <SortHeader label="Market Cap" field="marketCap" />
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-lighter">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={24} className="animate-spin text-neon-purple" />
                      Fetching real-time data from DexScreener...
                    </div>
                  </td>
                </tr>
              ) : filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No tokens found{searchQuery ? ` for "${searchQuery}"` : ''}.
                  </td>
                </tr>
              ) : (
                filteredTokens.map(token => {
                  const isPositive = token.priceChange24h >= 0;
                  return (
                    <tr
                      key={token.id}
                      className="hover:bg-charcoal-lighter/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedToken(token)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {token.imageUrl ? (
                            <img src={token.imageUrl} alt={token.symbol} className="w-8 h-8 rounded-full bg-charcoal border border-charcoal-lighter object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-charcoal border border-charcoal-lighter flex items-center justify-center font-bold text-xs text-white">
                              {token.symbol[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {token.symbol}
                              <span className="bg-charcoal-lighter text-gray-400 text-[10px] px-1.5 py-0.5 rounded border border-gray-700 uppercase">
                                {token.chainId === 'ethereum' ? 'eth' : token.chainId}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">{token.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-white">
                        {formatCurrency(token.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                        <span className={isPositive ? 'text-lime-green' : 'text-danger'}>
                          {isPositive ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-300">
                        {formatCurrency(token.volume24h)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-300">
                        <div className="flex items-center justify-end gap-1.5">
                          <Droplets size={14} className="text-gray-500" />
                          {formatCurrency(token.liquidity)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-300">
                        {formatCurrency(token.marketCap)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedToken(token); }}
                          className="text-xs bg-neon-purple/10 text-neon-purple hover:bg-neon-purple hover:text-white px-3 py-1.5 rounded transition-all font-medium border border-neon-purple/20 opacity-0 group-hover:opacity-100"
                        >
                          View Chart
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Token Detail Modal */}
      {selectedToken && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedToken(null)}
        >
          <div
            className="bg-charcoal-light border border-charcoal-lighter rounded-2xl overflow-hidden w-full max-w-4xl shadow-2xl shadow-black/50 animate-[fadeIn_150ms_ease-out] flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-charcoal-lighter">
              <div className="flex items-center gap-3">
                {selectedToken.imageUrl ? (
                  <img src={selectedToken.imageUrl} alt={selectedToken.symbol} className="w-10 h-10 rounded-full bg-charcoal border border-charcoal-lighter object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-charcoal border border-charcoal-lighter flex items-center justify-center font-bold text-sm text-white">
                    {selectedToken.symbol[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedToken.symbol}
                  </h3>
                  <p className="text-sm text-gray-400">{selectedToken.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleWatchlist(selectedToken.address)}
                  className={cn(
                    "transition-colors flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border",
                    isInWatchlist(selectedToken.address)
                      ? "bg-neon-purple/10 border-neon-purple text-neon-purple hover:bg-neon-purple/20"
                      : "text-gray-300 hover:text-white hover:bg-charcoal border-charcoal-lighter"
                  )}
                  title={isInWatchlist(selectedToken.address) ? "Remove from Watchlist" : "Add to Watchlist"}
                >
                  <Star size={14} className={isInWatchlist(selectedToken.address) ? "fill-neon-purple" : ""} />
                  <span className="hidden sm:inline">{isInWatchlist(selectedToken.address) ? "Saved" : "Watchlist"}</span>
                </button>
                <a
                  href={`${import.meta.env.VITE_BUBBLEMAPS_URL || 'https://app.bubblemaps.io'}/sol/token/${selectedToken.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white hover:bg-charcoal transition-colors flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-charcoal-lighter"
                  title="Open Bubblemaps in new tab"
                >
                  <img src="https://bubblemaps.io/favicon.ico" alt="Bubblemaps" className="w-3.5 h-3.5 rounded-full" />
                  <span className="hidden sm:inline">Bubblemaps</span>
                  <ExternalLink size={12} />
                </a>
                <a
                  href={`${import.meta.env.VITE_SOLSCAN_URL || 'https://solscan.io'}/token/${selectedToken.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white hover:bg-charcoal transition-colors flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-charcoal-lighter"
                  title="View on Solscan"
                >
                  <span className="hidden sm:inline">Solscan</span>
                  <ExternalLink size={12} />
                </a>
                <button
                  onClick={() => setSelectedToken(null)}
                  className="p-1.5 text-gray-400 hover:bg-danger/20 hover:text-danger rounded-lg transition-colors ml-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
              {/* Left Column: Stats & Chart */}
              <div className="p-6 flex-1 border-r border-charcoal-lighter flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-3xl font-bold text-white font-mono">{formatCurrency(selectedToken.price)}</p>
                    <p className={cn("text-sm font-medium mt-1", selectedToken.priceChange24h >= 0 ? "text-lime-green" : "text-danger")}>
                      {selectedToken.priceChange24h >= 0 ? '+' : ''}{selectedToken.priceChange24h.toFixed(2)}% (24h)
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-xs text-gray-500">Vol 24h</div>
                    <div className="text-sm font-mono text-gray-300">{formatCurrency(selectedToken.volume24h)}</div>
                    <div className="text-xs text-gray-500 mt-2">MCap</div>
                    <div className="text-sm font-mono text-gray-300">{formatCurrency(selectedToken.marketCap)}</div>
                  </div>
                </div>

                <div className="h-48 mb-6">
                  <TokenChart
                    data={chartData}
                    color={selectedToken.priceChange24h >= 0 ? '#80FF56' : '#FF5656'}
                    height={192}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 mt-auto">
                  <div className="bg-charcoal rounded-lg p-3 border border-charcoal-lighter">
                    <p className="text-xs text-gray-500 mb-1">Liquidity</p>
                    <p className="text-sm font-mono text-white">{formatCurrency(selectedToken.liquidity)}</p>
                  </div>
                  <div className="bg-charcoal rounded-lg p-3 border border-charcoal-lighter">
                    <p className="text-xs text-gray-500 mb-1">Market Cap</p>
                    <p className="text-sm font-mono text-white">{formatCurrency(selectedToken.marketCap)}</p>
                  </div>
                  <div className="bg-charcoal rounded-lg p-3 border border-charcoal-lighter overflow-hidden">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Shield size={12}/> Security</p>
                    {rugCheck.isLoading ? (
                      <p className="text-sm font-mono text-gray-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin"/> Scanning...</p>
                    ) : rugCheck.error ? (
                      <p className="text-sm font-mono text-gray-500" title={rugCheck.error}>Unavailable</p>
                    ) : rugCheck.data ? (
                      <div className={cn("text-sm font-mono flex items-center gap-1.5", rugCheck.data.isSafe ? "text-lime-green" : "text-danger")} title={rugCheck.data.risks.map(r => r.name).join(', ')}>
                        {rugCheck.data.isSafe ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                        {rugCheck.data.isSafe ? 'Good' : 'Risky'}
                      </div>
                    ) : (
                      <p className="text-sm font-mono text-gray-500">Unknown</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column: Bubblemaps iframe */}
              <div className="flex-1 bg-charcoal hidden md:flex flex-col relative">
                <div className="absolute inset-0 p-2">
                  <iframe 
                    src={`${import.meta.env.VITE_BUBBLEMAPS_URL || 'https://app.bubblemaps.io'}/sol/token/${selectedToken.address}?embed=true`}
                    title={`Bubblemaps for ${selectedToken.symbol}`}
                    className="w-full h-full border-0 rounded-xl"
                    allow="clipboard-write"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
