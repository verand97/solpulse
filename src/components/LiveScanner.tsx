import React, { useState } from 'react';
import { useLiveScanner } from '../hooks/useLiveScanner';
import { formatCurrency, formatNumber, formatAddress, cn } from '../utils';
import {
  Radio,
  Play,
  Square,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Clock,
  Filter,
} from 'lucide-react';

export const LiveScanner: React.FC = () => {
  const { liveTokens, isScanning, setIsScanning, minLiquidity, setMinLiquidity, clearTokens } = useLiveScanner();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B]">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-[#222226] bg-[#0A0A0B]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              'w-2 h-2 rounded-full',
              isScanning ? 'bg-green-400 animate-pulse' : 'bg-[#52525E]'
            )} />
            <h1 className="text-[13px] font-bold text-[#EEEFF2] uppercase tracking-wide">Live Stream Scanner</h1>
          </div>
          <span className="text-[11px] text-[#52525E] font-mono border-l border-[#222226] pl-3">
            {liveTokens.length} verified tokens
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Min Liquidity Input */}
          <div className="flex items-center gap-1.5 bg-[#17171A] border border-[#222226] rounded px-2.5 py-1">
            <Filter size={11} className="text-[#52525E]" />
            <span className="text-[11px] text-[#52525E]">Min Liq:</span>
            <span className="text-[11px] text-[#8A8A96] font-mono">$</span>
            <input
              type="number"
              value={minLiquidity}
              onChange={(e) => setMinLiquidity(Math.max(0, Number(e.target.value)))}
              disabled={isScanning}
              className="w-16 bg-transparent text-[11.5px] font-mono text-[#EEEFF2] focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Toggle Scan Button */}
          <button
            onClick={() => setIsScanning(!isScanning)}
            className={cn(
              'h-7 flex items-center gap-1.5 px-3 rounded text-[12px] font-semibold transition-colors',
              isScanning
                ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                : 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
            )}
          >
            {isScanning ? (
              <>
                <Square size={11} className="fill-current" /> Stop Stream
              </>
            ) : (
              <>
                <Play size={11} className="fill-current" /> Start Stream
              </>
            )}
          </button>

          {/* Clear Feed */}
          <button
            onClick={clearTokens}
            className="h-7 w-7 flex items-center justify-center rounded bg-[#17171A] border border-[#222226] text-[#52525E] hover:text-[#8A8A96] transition-colors"
            title="Clear Feed"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Main content table / feed */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {!isScanning && liveTokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-16">
            <div className="w-10 h-10 rounded-full bg-[#17171A] border border-[#222226] flex items-center justify-center mb-3 text-[#52525E]">
              <Radio size={18} />
            </div>
            <p className="text-[13px] font-medium text-[#EEEFF2] mb-1">Live Stream Inactive</p>
            <p className="text-[12px] text-[#52525E] max-w-sm mb-4">
              Click 'Start Stream' to monitor DexScreener token profiles and on-chain RugCheck in real-time.
            </p>
            <button
              onClick={() => setIsScanning(true)}
              className="h-7 px-3.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-medium transition-colors"
            >
              Start Stream
            </button>
          </div>
        ) : isScanning && liveTokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-16">
            <RefreshCw size={20} className="animate-spin text-blue-400 mb-3" />
            <p className="text-[13px] font-medium text-[#EEEFF2] mb-1">Listening to Solana DEX Pools...</p>
            <p className="text-[12px] text-[#52525E] max-w-sm">
              Filtering token profiles with liquidity &gt; ${minLiquidity.toLocaleString()} and clean RugCheck score.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-[#222226] bg-[#0D0D0F] sticky top-0 z-10 font-mono text-[10px] text-[#52525E] uppercase tracking-wide">
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Token</th>
                <th className="px-4 py-2.5 text-right">Price</th>
                <th className="px-4 py-2.5 text-right">24h Change</th>
                <th className="px-4 py-2.5 text-right">Liquidity</th>
                <th className="px-4 py-2.5 text-right">24h Volume</th>
                <th className="px-4 py-2.5 text-center">Safety</th>
                <th className="px-4 py-2.5 text-right">External</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17171A] text-[#8A8A96]">
              {liveTokens.map((token) => {
                const isPos = token.priceChange24h >= 0;
                return (
                  <tr key={`${token.address}-${token.detectedAt.getTime()}`} className="hover:bg-[#111113] transition-colors">
                    {/* Time */}
                    <td className="px-4 py-2.5 text-[#52525E] font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        {token.detectedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    {/* Token */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {token.imageUrl ? (
                          <img src={token.imageUrl} alt={token.symbol} className="w-6 h-6 rounded-full object-cover shrink-0 border border-[#222226]" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#17171A] border border-[#222226] flex items-center justify-center font-bold text-[10px] text-[#EEEFF2] shrink-0">
                            {token.symbol[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#EEEFF2] text-[12.5px] truncate">{token.symbol}</span>
                            <span className="text-[11px] text-[#52525E] truncate max-w-[120px]">{token.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-[#52525E] font-mono">
                            <span>{formatAddress(token.address, 4)}</span>
                            <button
                              onClick={() => handleCopy(token.address)}
                              className="text-[#52525E] hover:text-[#8A8A96] transition-colors"
                            >
                              {copied === token.address ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-[#EEEFF2]">
                      ${formatNumber(token.price)}
                    </td>

                    {/* Change */}
                    <td className="px-4 py-2.5 text-right font-mono">
                      <span className={cn(
                        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium',
                        isPos ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                      )}>
                        {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(token.priceChange24h).toFixed(2)}%
                      </span>
                    </td>

                    {/* Liquidity */}
                    <td className="px-4 py-2.5 text-right font-mono text-[#EEEFF2]">
                      {formatCurrency(token.liquidity)}
                    </td>

                    {/* Volume */}
                    <td className="px-4 py-2.5 text-right font-mono text-[#8A8A96]">
                      {formatCurrency(token.volume24h)}
                    </td>

                    {/* Safety */}
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                        <ShieldCheck size={10} /> SAFE
                      </span>
                    </td>

                    {/* External links */}
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`https://dexscreener.com/solana/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-6 px-2 rounded bg-[#17171A] hover:bg-[#222226] text-[#8A8A96] hover:text-[#EEEFF2] border border-[#222226] text-[10.5px] font-mono flex items-center gap-1 transition-colors"
                        >
                          DEX <ExternalLink size={9} />
                        </a>
                        <a
                          href={`https://rugcheck.xyz/tokens/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-6 px-2 rounded bg-[#17171A] hover:bg-[#222226] text-[#8A8A96] hover:text-[#EEEFF2] border border-[#222226] text-[10.5px] font-mono flex items-center gap-1 transition-colors"
                        >
                          RC <ExternalLink size={9} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
