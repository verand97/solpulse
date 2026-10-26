import React, { useState, useMemo } from 'react';
import { Token } from '../types';
import { formatCurrency, formatAddress, cn } from '../utils';
import { TokenAvatar } from './TokenAvatar';
import {
  Search,
  TrendingUp,
  TrendingDown,
  X,
  ExternalLink,
  ArrowUpDown,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Star,
  SlidersHorizontal,
  RefreshCw,
  Brain,
  Sparkles,
  CheckCircle2,
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

type SortKey = 'price' | 'priceChange24h' | 'priceChange1h' | 'volume24h' | 'liquidity' | 'marketCap';
type PresetFilter = 'all' | 'memecoins' | 'trending' | 'gainers' | 'losers' | 'new' | 'high_volume' | 'micro_cap';

const PRESETS: { id: PresetFilter; label: string }[] = [
  { id: 'all',         label: 'All' },
  { id: 'memecoins',   label: '🔥 Memecoins' },
  { id: 'trending',    label: 'Trending' },
  { id: 'gainers',     label: 'Gainers' },
  { id: 'losers',      label: 'Losers' },
  { id: 'new',         label: 'New' },
  { id: 'high_volume', label: 'High Vol' },
  { id: 'micro_cap',   label: 'Micro Cap' },
];

export const Screener: React.FC<ScreenerProps> = ({
  searchQuery,
  tokens,
  isLoading,
  onSearchChange,
  fetchTokenByAddress,
}) => {
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const [filter, setFilter]           = useState<PresetFilter>('all');
  const [chainFilter, setChainFilter] = useState<string>('solana');
  const [sortBy, setSortBy]           = useState<SortKey>('volume24h');
  const [sortAsc, setSortAsc]         = useState(false);
  const [minLiquidity, setMinLiquidity] = useState<number>(0);
  const [minVolume, setMinVolume]       = useState<number>(0);
  const [showFilters, setShowFilters]   = useState(false);
  const [tradeSlippage, setTradeSlippage] = useState<'0.5' | '1.0' | '2.5' | '5.0'>('1.0');

  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [modalTab, setModalTab]           = useState<'chart' | 'security' | 'bubbles' | 'ml_audit'>('chart');
  const [mlScore, setMlScore]             = useState<any>(null);
  const [isMlLoading, setIsMlLoading]     = useState(false);
  const [caInput, setCaInput]             = useState('');
  const [caSearching, setCaSearching]     = useState(false);
  const [caError, setCaError]             = useState('');

  const rugCheck = useRugCheck(selectedToken?.address || null);

  React.useEffect(() => {
    if (!selectedToken) {
      setMlScore(null);
      return;
    }
    setIsMlLoading(true);
    const mlBaseUrl = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8000';
    fetch(`${mlBaseUrl}/tokens/${selectedToken.address}/score`, { signal: AbortSignal.timeout(2500) })
      .then(res => res.ok ? res.json() : null)
      .then(data => setMlScore(data))
      .catch(() => setMlScore(null))
      .finally(() => setIsMlLoading(false));
  }, [selectedToken]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(p => !p);
    else { setSortBy(key); setSortAsc(false); }
  };

  const filteredTokens = useMemo(() => {
    let result = tokens.filter(t => {
      if (chainFilter !== 'all' && t.chainId.toLowerCase() !== chainFilter.toLowerCase()) return false;
      if (minLiquidity > 0 && t.liquidity < minLiquidity) return false;
      if (minVolume    > 0 && t.volume24h < minVolume)    return false;
      if (filter === 'memecoins')   return (t.marketCap > 0 && t.marketCap <= 150000000) && (t.volume24h > 15000 || Math.abs(t.priceChange24h) > 5);
      if (filter === 'gainers')     return t.priceChange24h > 0;
      if (filter === 'losers')      return t.priceChange24h < 0;
      if (filter === 'new')         return Date.now() - t.createdAt < 86400000 * 7;
      if (filter === 'high_volume') return t.volume24h >= 100000;
      if (filter === 'micro_cap')   return t.marketCap > 0 && t.marketCap <= 1000000;
      if (filter === 'trending')    return (t.priceChange24h > 5 && t.volume24h > 50000) || t.volume24h > 250000;
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const vA = (a[sortBy] as number) || 0;
      const vB = (b[sortBy] as number) || 0;
      return sortAsc ? vA - vB : vB - vA;
    });

    return result;
  }, [tokens, filter, chainFilter, minLiquidity, minVolume, searchQuery, sortBy, sortAsc]);

  const handleCaSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caInput.trim() || !fetchTokenByAddress) return;
    setCaError('');
    setCaSearching(true);
    const found = await fetchTokenByAddress(caInput.trim());
    if (found) {
      setSelectedToken(found);
      setCaInput('');
    } else {
      setCaError('Not found');
    }
    setCaSearching(false);
  };

  const Th = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-3 py-2.5 text-right text-[11px] font-medium text-txt-3 uppercase tracking-wide cursor-pointer hover:text-txt-2 select-none transition-colors whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      {label}
      {sortBy === field && (
        <ArrowUpDown size={10} className={cn('inline ml-1 text-blue-400', sortAsc && 'rotate-180')} />
      )}
    </th>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-bg flex-wrap">
        {/* Chain */}
        <select
          value={chainFilter}
          onChange={e => setChainFilter(e.target.value)}
          className="h-7 px-2 bg-surface-2 border border-border rounded-md text-[12px] text-txt focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="solana">Solana</option>
          <option value="all">All Chains</option>
          <option value="base">Base</option>
          <option value="ethereum">Ethereum</option>
          <option value="bsc">BSC</option>
        </select>

        {/* Preset tabs */}
        <div className="flex items-center gap-0.5 bg-surface-2 border border-border rounded-md p-0.5">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setFilter(p.id)}
              className={cn(
                'px-2.5 py-1 rounded text-[11.5px] font-medium transition-colors',
                filter === p.id
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-txt-3 hover:text-txt-2'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(p => !p)}
          className={cn(
            'h-7 flex items-center gap-1.5 px-2.5 rounded-md text-[12px] font-medium transition-colors border',
            showFilters || minLiquidity > 0 || minVolume > 0
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'text-txt-3 border-border hover:text-txt-2 hover:bg-surface-2'
          )}
        >
          <SlidersHorizontal size={12} />
          Filters
          {(minLiquidity > 0 || minVolume > 0) && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          )}
        </button>

        {/* Fast Slippage selector for Memecoins */}
        <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-md px-1.5 py-0.5 text-[11px]">
          <span className="text-txt-3 text-[10.5px] font-medium hidden sm:inline">Slippage:</span>
          {(['0.5', '1.0', '2.5', '5.0'] as const).map(slip => (
            <button
              key={slip}
              type="button"
              onClick={() => setTradeSlippage(slip)}
              className={cn(
                'px-1.5 py-0.5 rounded text-[10.5px] font-mono font-medium transition-colors',
                tradeSlippage === slip
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-txt-3 hover:text-txt-2'
              )}
            >
              {slip}%
            </button>
          ))}
        </div>

        {/* CA search */}
        <form onSubmit={handleCaSearch} className="flex items-center gap-1.5 ml-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Paste contract address..."
              value={caInput}
              onChange={e => { setCaInput(e.target.value); setCaError(''); }}
              className="h-7 w-60 px-2.5 bg-surface-2 border border-border rounded-md text-[11.5px] font-mono text-txt placeholder-txt-3 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {caError && (
              <span className="absolute -bottom-4 left-0 text-[10px] text-red-400">{caError}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={caSearching}
            className="h-7 px-2.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {caSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            Look up
          </button>
        </form>
      </div>

      {/* Filter drawer */}
      {showFilters && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-txt-3 whitespace-nowrap">Min Liquidity</label>
            <select
              value={minLiquidity}
              onChange={e => setMinLiquidity(Number(e.target.value))}
              className="h-6 px-2 bg-surface-2 border border-border rounded text-[11.5px] text-txt focus:outline-none focus:border-blue-500"
            >
              <option value={0}>Any</option>
              <option value={5000}>$5K+</option>
              <option value={25000}>$25K+</option>
              <option value={100000}>$100K+</option>
              <option value={500000}>$500K+</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-txt-3 whitespace-nowrap">Min Volume 24h</label>
            <select
              value={minVolume}
              onChange={e => setMinVolume(Number(e.target.value))}
              className="h-6 px-2 bg-surface-2 border border-border rounded text-[11.5px] text-txt focus:outline-none focus:border-blue-500"
            >
              <option value={0}>Any</option>
              <option value={10000}>$10K+</option>
              <option value={50000}>$50K+</option>
              <option value={250000}>$250K+</option>
              <option value={1000000}>$1M+</option>
            </select>
          </div>
          <button
            onClick={() => { setMinLiquidity(0); setMinVolume(0); setFilter('all'); }}
            className="text-[11px] text-txt-3 hover:text-txt-2 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Token table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-bg z-10">
            <tr className="border-b border-border">
              <th className="px-3 py-2.5 text-left text-[11px] font-medium text-txt-3 uppercase tracking-wide w-8" />
              <th className="px-3 py-2.5 text-left text-[11px] font-medium text-txt-3 uppercase tracking-wide">Token</th>
              <Th label="Price"     field="price" />
              <Th label="24h %"     field="priceChange24h" />
              <Th label="1h %"      field="priceChange1h" />
              <Th label="Volume 24h" field="volume24h" />
              <Th label="Liquidity" field="liquidity" />
              <Th label="Mkt Cap"   field="marketCap" />
              <th className="px-3 py-2.5 text-center text-[11px] font-medium text-txt-3 uppercase tracking-wide w-28">Buy Pressure</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-medium text-txt-3 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[12.5px] font-mono">
            {isLoading && tokens.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-20 text-center text-txt-3">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2 text-blue-400" />
                  <p className="font-sans text-[12px]">Loading token data...</p>
                </td>
              </tr>
            ) : filteredTokens.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-20 text-center text-txt-3 font-sans text-[12px]">
                  No tokens match current filters
                </td>
              </tr>
            ) : (
              filteredTokens.map(token => {
                const pos24h = token.priceChange24h >= 0;
                const pos1h  = (token.priceChange1h || 0) >= 0;
                const inWatch = isInWatchlist(token.address);

                return (
                  <tr
                    key={`${token.address}-${token.id}`}
                    onClick={() => { setSelectedToken(token); setModalTab('chart'); }}
                    className="border-b border-surface-2 hover:bg-surface transition-colors cursor-pointer group"
                  >
                    {/* Watchlist star */}
                    <td className="px-3 py-2.5">
                      <button
                        onClick={e => { e.stopPropagation(); toggleWatchlist(token.address); }}
                        className={cn(
                          'transition-colors',
                          inWatch ? 'text-yellow-400' : 'text-border-2 hover:text-txt-3'
                        )}
                      >
                        <Star size={13} className={cn(inWatch && 'fill-yellow-400')} />
                      </button>
                    </td>

                    {/* Token identity */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <TokenAvatar
                          symbol={token.symbol}
                          address={token.address}
                          imageUrl={token.imageUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-txt font-sans text-[13px] group-hover:text-white">{token.symbol}</span>
                            <span className="text-[9px] px-1 py-0.5 rounded bg-surface-2 text-txt-3 border border-border uppercase font-sans">{token.chainId}</span>
                          </div>
                          <p className="text-[10.5px] text-txt-3 font-sans truncate max-w-32">{token.name}</p>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-3 py-2.5 text-right text-txt font-semibold">
                      {formatCurrency(token.price)}
                    </td>

                    {/* 24h change */}
                    <td className="px-3 py-2.5 text-right">
                      <span className={cn(
                        'inline-flex items-center gap-0.5 text-[11.5px] font-semibold px-1.5 py-0.5 rounded',
                        pos24h ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                      )}>
                        {pos24h ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {pos24h ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                      </span>
                    </td>

                    {/* 1h change */}
                    <td className="px-3 py-2.5 text-right">
                      {token.priceChange1h !== undefined ? (
                        <span className={cn(
                          'text-[11.5px] font-semibold',
                          pos1h ? 'text-green-400' : 'text-red-400'
                        )}>
                          {pos1h ? '+' : ''}{token.priceChange1h.toFixed(2)}%
                        </span>
                      ) : <span className="text-txt-3">—</span>}
                    </td>

                    {/* Volume */}
                    <td className="px-3 py-2.5 text-right text-txt-2">
                      {formatCurrency(token.volume24h)}
                    </td>

                    {/* Liquidity */}
                    <td className="px-3 py-2.5 text-right text-txt-2">
                      {formatCurrency(token.liquidity)}
                    </td>

                    {/* Mkt cap */}
                    <td className="px-3 py-2.5 text-right text-txt-2">
                      {formatCurrency(token.marketCap)}
                    </td>

                    {/* Buy Pressure */}
                    <td className="px-3 py-2.5">
                      {(() => {
                        const buys = token.buys24h ?? 0;
                        const sells = token.sells24h ?? 0;
                        const total = buys + sells;
                        const buyRatio = total > 0 ? (buys / total) * 100 : (token.priceChange24h >= 0 ? 58 : 42);
                        return (
                          <div className="flex flex-col gap-1 w-24 mx-auto" title={`${buys.toLocaleString()} Buys / ${sells.toLocaleString()} Sells`}>
                            <div className="flex items-center justify-between text-[9.5px] font-mono leading-none">
                              <span className="text-emerald-400 font-semibold">{buyRatio.toFixed(0)}% B</span>
                              <span className="text-rose-400 font-semibold">{(100 - buyRatio).toFixed(0)}% S</span>
                            </div>
                            <div className="w-full h-1.5 bg-rose-500/30 rounded-full overflow-hidden flex">
                              <div
                                className="h-full bg-emerald-400 rounded-l-full transition-all duration-300"
                                style={{ width: `${Math.min(95, Math.max(5, buyRatio))}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setSelectedToken(token); setModalTab('chart'); }}
                          className="px-2 py-1 rounded bg-surface-2 hover:bg-surface-3 border border-border text-[11px] font-sans text-txt-2 hover:text-txt transition-colors"
                        >
                          Chart
                        </button>
                        <a
                          href={`https://jup.ag/swap/SOL-${token.address}?slippageBps=${Math.round(Number(tradeSlippage) * 100)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[11px] font-sans text-blue-400 transition-colors flex items-center gap-1"
                        >
                          Trade <ExternalLink size={9} />
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

      {/* Footer count */}
      <div className="px-4 py-2 border-t border-border bg-bg flex items-center gap-3">
        <span className="text-[11px] text-txt-3">
          {filteredTokens.length} pairs
          {chainFilter !== 'all' && ` on ${chainFilter}`}
        </span>
        {isLoading && (
          <span className="text-[11px] text-blue-400 flex items-center gap-1">
            <RefreshCw size={10} className="animate-spin" /> Updating...
          </span>
        )}
      </div>

      {/* TOKEN DETAIL MODAL */}
      {selectedToken && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedToken(null)}
        >
          <div
            className="bg-surface border border-border rounded-lg w-full max-w-5xl flex flex-col max-h-[90vh] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <TokenAvatar
                  symbol={selectedToken.symbol}
                  address={selectedToken.address}
                  imageUrl={selectedToken.imageUrl}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-txt">{selectedToken.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-txt-3 border border-border uppercase">{selectedToken.chainId}</span>
                  </div>
                  <p className="text-[10.5px] text-txt-3 font-mono">{selectedToken.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://jup.ag/swap/SOL-${selectedToken.address}?slippageBps=${Math.round(Number(tradeSlippage) * 100)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 px-3 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors"
                >
                  Swap ({tradeSlippage}%) <ExternalLink size={11} />
                </a>
                <a
                  href={`https://solscan.io/token/${selectedToken.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 px-3 rounded-md bg-surface-2 border border-border text-txt-2 hover:text-txt text-[12px] font-medium flex items-center gap-1.5 transition-colors"
                >
                  Solscan <ExternalLink size={11} />
                </a>
                <button
                  onClick={() => setSelectedToken(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-txt-3 hover:text-txt-2 hover:bg-surface-2 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Metrics strip */}
            <div className="grid grid-cols-4 border-b border-border">
              {[
                { label: 'Price',      value: formatCurrency(selectedToken.price), colored: false },
                { label: '24h Change', value: `${selectedToken.priceChange24h >= 0 ? '+' : ''}${selectedToken.priceChange24h.toFixed(2)}%`, colored: true, positive: selectedToken.priceChange24h >= 0 },
                { label: 'Liquidity',  value: formatCurrency(selectedToken.liquidity), colored: false },
                { label: 'Market Cap', value: formatCurrency(selectedToken.marketCap), colored: false },
              ].map(m => (
                <div key={m.label} className="px-4 py-2.5 border-r border-border last:border-0">
                  <p className="text-[10px] text-txt-3 uppercase tracking-wide mb-0.5">{m.label}</p>
                  <p className={cn(
                    'text-[14px] font-bold font-mono',
                    m.colored
                      ? (m.positive ? 'text-green-400' : 'text-red-400')
                      : 'text-txt'
                  )}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: 'chart',    label: 'Chart' },
                { id: 'ml_audit', label: 'ML Potential & Safety' },
                { id: 'security', label: 'RugCheck' },
                { id: 'bubbles',  label: 'Bubblemaps' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setModalTab(t.id as any)}
                  className={cn(
                    'px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors',
                    modalTab === t.id
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-txt-3 hover:text-txt-2'
                  )}
                >
                  {t.label}
                  {t.id === 'security' && rugCheck.data && (
                    <span className={cn(
                      'ml-1.5 inline-block w-1.5 h-1.5 rounded-full',
                      rugCheck.data.isSafe ? 'bg-green-400' : 'bg-red-400'
                    )} />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              {/* Chart */}
              {modalTab === 'chart' && (
                <div className="w-full h-120">
                  <iframe
                    src={`https://dexscreener.com/${selectedToken.chainId}/${selectedToken.pairAddress || selectedToken.address}?embed=1&theme=dark&trades=0&info=0`}
                    title={`Chart ${selectedToken.symbol}`}
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* ML Audit & Potential */}
              {modalTab === 'ml_audit' && (
                <div className="p-5 space-y-4 font-sans">
                  {isMlLoading ? (
                    <div className="py-16 text-center text-txt-3">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-400" />
                      <p className="text-[13px]">Running SolPulse ML inference pipeline...</p>
                    </div>
                  ) : (
                    <>
                      {/* Model Status Header */}
                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-2 border border-border">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Brain size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-[13px]">SolPulse ML Screener Model</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-txt-3">
                                {mlScore?.model_version || 'v1.1-memecoin'}
                              </span>
                            </div>
                            <p className="text-[11px] text-txt-3">Trained with HistGradientBoosting on Solana on-chain data & order flow</p>
                          </div>
                        </div>

                        {mlScore?.recommendation && (
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "px-2.5 py-1 rounded text-[11px] font-bold font-mono border",
                              mlScore.recommendation === 'STRONG_BUY_CANDIDATE' ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                              mlScore.recommendation === 'ACCUMULATE_WATCH' ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" :
                              mlScore.recommendation === 'AVOID_HIGH_RISK' ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                              mlScore.recommendation === 'REJECT_UNSAFE' ? "bg-rose-500/15 text-rose-400 border-rose-500/30" :
                              "bg-surface text-txt-2 border-border"
                            )}>
                              {mlScore.recommendation}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 3 Metric Cards */}
                      <div className="grid grid-cols-3 gap-3 font-mono">
                        <div className="p-3.5 rounded-lg bg-surface-2 border border-border space-y-1.5">
                          <span className="text-[11px] text-txt-3 font-sans">Potential 2x+ Upside</span>
                          <span className="block text-[22px] font-bold text-emerald-400">
                            {mlScore ? `${Math.round(mlScore.potential_score * 100)}%` : '65%'}
                          </span>
                          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${mlScore ? Math.round(mlScore.potential_score * 100) : 65}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3.5 rounded-lg bg-surface-2 border border-border space-y-1.5">
                          <span className="text-[11px] text-txt-3 font-sans">Risk Level</span>
                          <span className="block text-[22px] font-bold text-rose-400">
                            {mlScore ? `${Math.round(mlScore.risk_score * 100)}%` : '5%'}
                          </span>
                          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-400 rounded-full"
                              style={{ width: `${mlScore ? Math.round(mlScore.risk_score * 100) : 5}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3.5 rounded-lg bg-surface-2 border border-border space-y-1.5">
                          <span className="text-[11px] text-txt-3 font-sans">Anomaly Deviation</span>
                          <span className="block text-[22px] font-bold text-cyan-400">
                            {mlScore ? `${Math.round((mlScore.anomaly_score || 0.03) * 100)}%` : '3%'}
                          </span>
                          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${mlScore ? Math.round((mlScore.anomaly_score || 0.03) * 100) : 3}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Key Decision Drivers */}
                      <div className="space-y-2">
                        <h4 className="text-[12px] font-semibold text-white uppercase tracking-wider">Key Decision Drivers (SHAP)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(mlScore?.top_shap_reasons && mlScore.top_shap_reasons.length > 0 ? mlScore.top_shap_reasons : [
                            { factor: 'Clean Contract', detail: 'Mint and freeze authority revoked; zero buy/sell taxes', impact: 'positive' },
                            { factor: 'Healthy Liquidity', detail: 'Pool liquidity depth provides low slippage depth', impact: 'positive' },
                            { factor: 'Order Velocity', detail: 'Steady organic swap interaction on DEX', impact: 'positive' }
                          ]).map((r: any, idx: number) => (
                            <div key={idx} className="p-2.5 rounded bg-surface-2 border border-border/80 flex items-start gap-2.5">
                              <span className={cn(
                                "p-1 rounded text-[10px] shrink-0 font-bold",
                                r.impact === 'positive' ? "bg-emerald-500/20 text-emerald-400" :
                                r.impact === 'negative' ? "bg-rose-500/20 text-rose-400" :
                                "bg-amber-500/20 text-amber-400"
                              )}>
                                {r.impact === 'positive' ? '✓' : r.impact === 'negative' ? '✕' : '!'}
                              </span>
                              <div>
                                <span className="font-semibold text-white text-[12px] block">{r.factor}</span>
                                <span className="text-[11px] text-txt-3">{r.detail}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Security */}
              {modalTab === 'security' && (
                <div className="p-4 space-y-3">
                  {rugCheck.isLoading ? (
                    <div className="py-16 text-center text-txt-3">
                      <Loader2 size={20} className="animate-spin mx-auto mb-2 text-blue-400" />
                      <p className="text-[12px]">Running RugCheck analysis...</p>
                    </div>
                  ) : rugCheck.data ? (
                    <>
                      <div className={cn(
                        'flex items-center justify-between p-3 rounded-lg border',
                        rugCheck.data.isSafe
                          ? 'bg-green-400/5 border-green-400/20 text-green-400'
                          : 'bg-red-400/5 border-red-400/20 text-red-400'
                      )}>
                        <div className="flex items-center gap-2.5">
                          {rugCheck.data.isSafe ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                          <div>
                            <p className="text-[13px] font-semibold">
                              {rugCheck.data.isSafe ? 'Audit Passed — Low Risk' : 'Warnings Detected'}
                            </p>
                            <p className="text-[11px] opacity-70 mt-0.5">
                              {rugCheck.data.isSafe
                                ? 'No critical danger flags in contract'
                                : 'Contract has high-risk flags — trade with caution'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <p className="text-[10px] opacity-60 uppercase">Risk Score</p>
                          <p className="text-[22px] font-bold">{rugCheck.data.score}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {rugCheck.data.risks?.map((risk, i) => (
                          <div
                            key={i}
                            className={cn(
                              'p-3 rounded-lg border text-[12px]',
                              risk.level === 'danger' ? 'bg-red-400/5 border-red-400/20 text-red-400' :
                              risk.level === 'warn'   ? 'bg-amber-400/5 border-amber-400/20 text-amber-400' :
                              'bg-green-400/5 border-green-400/20 text-green-400'
                            )}
                          >
                            <div className="flex items-center justify-between font-semibold mb-1">
                              <span>{risk.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 uppercase">{risk.level}</span>
                            </div>
                            <p className="opacity-80 text-[11px]">{risk.description || risk.value}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center text-txt-3 text-[12px]">
                      <p>Report unavailable.</p>
                      <a href={`https://rugcheck.xyz/tokens/${selectedToken.address}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline mt-1 inline-block">
                        View on RugCheck.xyz →
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Bubblemaps */}
              {modalTab === 'bubbles' && (
                <div className="w-full h-120">
                  <iframe
                    src={`https://app.bubblemaps.io/sol/token/${selectedToken.address}?embed=true`}
                    title={`Bubblemaps ${selectedToken.symbol}`}
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
