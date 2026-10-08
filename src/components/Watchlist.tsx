import React, { useState } from 'react';
import { Token } from '../types';
import { formatCurrency, formatNumber, formatAddress, cn } from '../utils';
import {
  Star,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Search,
  Trash2,
  X,
  LineChart,
  Copy,
  Check,
} from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import { TokenChart } from './TokenChart';
import { generateMockChartData } from '../data';

interface WatchlistProps {
  tokens: Token[];
}

export const Watchlist: React.FC<WatchlistProps> = ({ tokens }) => {
  const { watchlistAddresses, toggleWatchlist } = useWatchlist();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (addr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  const watchlistTokens = watchlistAddresses
    .map(address => tokens.find(t => t.address === address) || {
      address,
      symbol: '...',
      name: 'Offline / Unlisted',
      price: 0,
      priceChange24h: 0,
      volume24h: 0,
      liquidity: 0,
      marketCap: 0,
      id: address,
      createdAt: 0,
    } as Token)
    .filter(t => t.symbol !== '...');

  const filteredTokens = watchlistTokens.filter(t =>
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = selectedToken ? generateMockChartData(selectedToken.price, selectedToken.priceChange24h) : [];

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-bg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <h1 className="text-[13px] font-bold text-txt uppercase tracking-wide">Watchlist</h1>
          </div>
          <span className="text-[11px] text-txt-3 font-mono border-l border-border pl-3">
            {watchlistAddresses.length} saved tokens
          </span>
        </div>

        <div className="relative w-64">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-3" />
          <input
            type="text"
            placeholder="Search watchlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-7 pl-7 pr-3 bg-surface-2 border border-border rounded text-[11.5px] text-txt placeholder-txt-3 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {watchlistAddresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-16">
            <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-3 text-txt-3">
              <Star size={18} />
            </div>
            <p className="text-[13px] font-medium text-txt mb-1">Your Watchlist is Empty</p>
            <p className="text-[12px] text-txt-3 max-w-sm">
              Keep track of high-potential Solana tokens. Navigate to the Screener and click the star icon beside any token to pin it here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border bg-surface sticky top-0 z-10 font-mono text-[10px] text-txt-3 uppercase tracking-wide">
                <th className="px-4 py-2.5">Token</th>
                <th className="px-4 py-2.5 text-right">Price</th>
                <th className="px-4 py-2.5 text-right">24h Change</th>
                <th className="px-4 py-2.5 text-right">Volume 24h</th>
                <th className="px-4 py-2.5 text-right">Liquidity</th>
                <th className="px-4 py-2.5 text-right">Market Cap</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-2 text-txt-2">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-txt-3 text-[12px]">
                    No tokens matched "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredTokens.map((token) => {
                  const isPos = token.priceChange24h >= 0;
                  return (
                    <tr
                      key={token.id}
                      onClick={() => setSelectedToken(token)}
                      className="hover:bg-surface transition-colors cursor-pointer group"
                    >
                      {/* Token */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {token.imageUrl ? (
                            <img src={token.imageUrl} alt={token.symbol} className="w-6 h-6 rounded-full object-cover shrink-0 border border-border" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-surface-2 border border-border flex items-center justify-center font-bold text-[10px] text-txt shrink-0">
                              {token.symbol[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-txt text-[12.5px] truncate">{token.symbol}</span>
                              <span className="text-[11px] text-txt-3 truncate max-w-30">{token.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-txt-3 font-mono">
                              <span>{formatAddress(token.address, 4)}</span>
                              <button
                                onClick={(e) => handleCopy(token.address, e)}
                                className="text-txt-3 hover:text-txt-2 transition-colors"
                              >
                                {copied === token.address ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-2.5 text-right font-mono font-medium text-txt">
                        ${formatNumber(token.price)}
                      </td>

                      {/* 24h Change */}
                      <td className="px-4 py-2.5 text-right font-mono">
                        <span className={cn(
                          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium',
                          isPos ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                        )}>
                          {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {Math.abs(token.priceChange24h).toFixed(2)}%
                        </span>
                      </td>

                      {/* Volume */}
                      <td className="px-4 py-2.5 text-right font-mono text-txt-2">
                        {formatCurrency(token.volume24h)}
                      </td>

                      {/* Liquidity */}
                      <td className="px-4 py-2.5 text-right font-mono text-txt-2">
                        {formatCurrency(token.liquidity)}
                      </td>

                      {/* MCap */}
                      <td className="px-4 py-2.5 text-right font-mono text-txt">
                        {formatCurrency(token.marketCap)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedToken(token)}
                            className="h-6 px-2 rounded bg-surface-2 hover:bg-border text-txt-2 hover:text-txt border border-border text-[10.5px] font-mono flex items-center gap-1 transition-colors"
                          >
                            <LineChart size={10} /> Chart
                          </button>
                          <a
                            href={`https://dexscreener.com/solana/${token.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-6 px-2 rounded bg-surface-2 hover:bg-border text-txt-2 hover:text-txt border border-border text-[10.5px] font-mono flex items-center gap-1 transition-colors"
                          >
                            Trade <ExternalLink size={9} />
                          </a>
                          <button
                            onClick={() => toggleWatchlist(token.address)}
                            className="h-6 w-6 flex items-center justify-center rounded bg-surface-2 hover:bg-red-500/10 text-txt-3 hover:text-red-400 border border-border transition-colors"
                            title="Remove from Watchlist"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Token Detail Modal */}
      {selectedToken && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedToken(null)}
        >
          <div
            className="bg-surface border border-border rounded-lg overflow-hidden w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-bg">
              <div className="flex items-center gap-3">
                {selectedToken.imageUrl ? (
                  <img src={selectedToken.imageUrl} alt={selectedToken.symbol} className="w-8 h-8 rounded-full border border-border object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center font-bold text-xs text-txt">
                    {selectedToken.symbol[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-[14px] font-bold text-txt flex items-center gap-2">
                    {selectedToken.symbol}
                    <span className="text-[11px] font-normal text-txt-3">{selectedToken.name}</span>
                  </h3>
                  <p className="text-[10px] text-txt-3 font-mono">{selectedToken.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`${import.meta.env.VITE_BUBBLEMAPS_URL || 'https://app.bubblemaps.io'}/sol/token/${selectedToken.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 px-2.5 rounded bg-surface-2 hover:bg-border text-txt-2 hover:text-txt border border-border text-[11px] flex items-center gap-1 transition-colors"
                >
                  Bubblemaps <ExternalLink size={10} />
                </a>
                <a
                  href={`${import.meta.env.VITE_SOLSCAN_URL || 'https://solscan.io'}/token/${selectedToken.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 px-2.5 rounded bg-surface-2 hover:bg-border text-txt-2 hover:text-txt border border-border text-[11px] flex items-center gap-1 transition-colors"
                >
                  Solscan <ExternalLink size={10} />
                </a>
                <button
                  onClick={() => setSelectedToken(null)}
                  className="h-7 w-7 flex items-center justify-center rounded bg-surface-2 text-txt-3 hover:text-txt border border-border transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-115">
              <div className="p-5 flex-1 border-r border-border flex flex-col overflow-y-auto bg-bg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[22px] font-bold text-txt font-mono">${formatNumber(selectedToken.price)}</p>
                    <p className={cn(
                      'text-[12px] font-mono mt-0.5 inline-flex items-center gap-1',
                      selectedToken.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {selectedToken.priceChange24h >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {selectedToken.priceChange24h >= 0 ? '+' : ''}{selectedToken.priceChange24h.toFixed(2)}% (24h)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-txt-3 uppercase tracking-wide">24h Volume</div>
                    <div className="text-[13px] font-mono text-txt">{formatCurrency(selectedToken.volume24h)}</div>
                  </div>
                </div>

                <div className="h-44 mb-5 bg-surface border border-surface-2 rounded p-2">
                  <TokenChart
                    data={chartData}
                    color={selectedToken.priceChange24h >= 0 ? '#10B981' : '#EF4444'}
                    height={160}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5 mt-auto">
                  <div className="bg-surface-2 rounded p-2.5 border border-border">
                    <p className="text-[10px] text-txt-3 uppercase tracking-wide mb-0.5">Liquidity</p>
                    <p className="text-[12px] font-mono text-txt font-semibold">{formatCurrency(selectedToken.liquidity)}</p>
                  </div>
                  <div className="bg-surface-2 rounded p-2.5 border border-border">
                    <p className="text-[10px] text-txt-3 uppercase tracking-wide mb-0.5">Market Cap</p>
                    <p className="text-[12px] font-mono text-txt font-semibold">{formatCurrency(selectedToken.marketCap)}</p>
                  </div>
                  <div className="bg-surface-2 rounded p-2.5 border border-border">
                    <p className="text-[10px] text-txt-3 uppercase tracking-wide mb-0.5">Chain</p>
                    <p className="text-[12px] font-mono text-txt font-semibold uppercase">Solana</p>
                  </div>
                </div>
              </div>

              {/* Bubblemaps embed */}
              <div className="flex-1 bg-surface hidden md:flex flex-col relative">
                <iframe
                  src={`${import.meta.env.VITE_BUBBLEMAPS_URL || 'https://app.bubblemaps.io'}/sol/token/${selectedToken.address}?embed=true`}
                  title={`Bubblemaps for ${selectedToken.symbol}`}
                  className="w-full h-full border-0"
                  allow="clipboard-write"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
