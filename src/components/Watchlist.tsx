import React, { useState } from 'react';
import { Token } from '../types';
import { formatCurrency, formatNumber, cn } from '../utils';
import { Star, TrendingUp, TrendingDown, ExternalLink, Search, Trash2, X } from 'lucide-react';
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

  // Find the full token objects for addresses in the watchlist
  const watchlistTokens = watchlistAddresses
    .map(address => tokens.find(t => t.address === address) || {
      // If token not currently fetched in live data, provide a placeholder or skip
      // Ideally we would fetch them, but for this demo we'll just show what's live
      address,
      symbol: '...',
      name: 'Loading or Offline...',
      price: 0,
      priceChange24h: 0,
      volume24h: 0,
      liquidity: 0,
      marketCap: 0,
      id: address,
      createdAt: 0
    } as Token)
    .filter(t => t.symbol !== '...'); // Only show if we have live data

  const filteredTokens = watchlistTokens.filter(t => 
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = selectedToken ? generateMockChartData(selectedToken.price, selectedToken.priceChange24h) : [];

  return (
    <div className="flex flex-col h-full animate-[fadeIn_300ms_ease-out]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Star className="text-neon-purple fill-neon-purple" size={24} />
          My Watchlist
        </h2>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search watchlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-charcoal-light border border-charcoal-lighter rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/50 transition-all"
          />
        </div>
      </div>

      {watchlistAddresses.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-charcoal-light rounded-xl border border-charcoal-lighter border-dashed p-8 text-center">
          <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center mb-4">
            <Star size={24} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Your watchlist is empty</h3>
          <p className="text-gray-400 max-w-md">
            Keep track of your favorite Solana tokens. Go to the Screener and click the star icon to add tokens here.
          </p>
        </div>
      ) : (
        <div className="bg-charcoal-light rounded-xl border border-charcoal-lighter overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-charcoal border-b border-charcoal-lighter text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Token</th>
                  <th className="p-4 font-medium text-right">Price</th>
                  <th className="p-4 font-medium text-right">24h Change</th>
                  <th className="p-4 font-medium text-right hidden sm:table-cell">Volume</th>
                  <th className="p-4 font-medium text-right hidden md:table-cell">Liquidity</th>
                  <th className="p-4 font-medium text-right hidden lg:table-cell">Market Cap</th>
                  <th className="p-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-lighter">
                {filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      No matching tokens found in your watchlist.
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map((token) => {
                    const isPositive = token.priceChange24h >= 0;
                    return (
                      <tr 
                        key={token.id} 
                        className="hover:bg-charcoal/50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedToken(token)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {token.imageUrl ? (
                                <img src={token.imageUrl} alt={token.symbol} className="w-8 h-8 rounded-full bg-charcoal border border-charcoal-lighter object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-charcoal border border-charcoal-lighter flex items-center justify-center font-bold text-xs text-white">
                                  {token.symbol[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white group-hover:text-neon-purple transition-colors">{token.symbol}</div>
                              <div className="text-xs text-gray-500">{token.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-mono text-white">{formatCurrency(token.price)}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className={cn("flex items-center justify-end gap-1 text-sm font-medium", isPositive ? "text-lime-green" : "text-danger")}>
                            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {Math.abs(token.priceChange24h).toFixed(2)}%
                          </div>
                        </td>
                        <td className="p-4 text-right hidden sm:table-cell text-gray-300 font-mono text-sm">
                          {formatCurrency(token.volume24h)}
                        </td>
                        <td className="p-4 text-right hidden md:table-cell text-gray-300 font-mono text-sm">
                          {formatCurrency(token.liquidity)}
                        </td>
                        <td className="p-4 text-right hidden lg:table-cell text-gray-300 font-mono text-sm">
                          {formatCurrency(token.marketCap)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(token.address);
                            }}
                            className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove from Watchlist"
                          >
                            <Trash2 size={16} />
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
      )}

      {/* Token Detail Modal (Same as Screener) */}
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
                <a
                  href={`https://app.bubblemaps.io/sol/token/${selectedToken.address}`}
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
                  href={`https://solscan.io/token/${selectedToken.address}`}
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
                    <p className="text-xs text-gray-500 mb-1">Contract</p>
                    <p className="text-sm font-mono text-white truncate" title={selectedToken.address}>
                      {selectedToken.address.slice(0, 6)}...{selectedToken.address.slice(-4)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 bg-charcoal hidden md:flex flex-col relative">
                <div className="absolute inset-0 p-2">
                  <iframe 
                    src={`https://app.bubblemaps.io/sol/token/${selectedToken.address}?embed=true`}
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
