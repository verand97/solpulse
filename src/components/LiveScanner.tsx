import React from 'react';
import { useLiveScanner } from '../hooks/useLiveScanner';
import { formatCurrency, formatNumber } from '../utils';
import { Radar, Play, Square, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';

export const LiveScanner: React.FC = () => {
  const { liveTokens, isScanning, setIsScanning, minLiquidity, setMinLiquidity, clearTokens } = useLiveScanner();

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto w-full relative z-10 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans text-white uppercase tracking-wider mb-2 flex items-center gap-3">
            <Radar className={isScanning ? "text-lime-green animate-spin-slow" : "text-neon-purple"} size={28} />
            Auto <span className="text-neon-purple">Scanner</span>
          </h1>
          <p className="text-gray-400">Real-time monitoring for safe, high-liquidity new tokens.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-charcoal/80 p-4 rounded-xl border border-charcoal-lighter backdrop-blur-xl">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Min Liquidity (USD)</label>
            <input
              type="number"
              value={minLiquidity}
              onChange={(e) => setMinLiquidity(Number(e.target.value))}
              disabled={isScanning}
              className="bg-charcoal-light border border-charcoal-lighter rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-neon-purple disabled:opacity-50"
            />
          </div>
          
          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
              isScanning 
                ? 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20' 
                : 'bg-lime-green/10 text-lime-green border border-lime-green/20 hover:bg-lime-green/20'
            }`}
          >
            {isScanning ? <Square size={16} className="fill-danger" /> : <Play size={16} className="fill-lime-green" />}
            {isScanning ? 'Stop Scanner' : 'Start Scanner'}
          </button>
          
          <button 
            onClick={clearTokens}
            className="p-2.5 text-gray-400 hover:text-white bg-charcoal-light border border-charcoal-lighter rounded-lg transition-colors"
            title="Clear Feed"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-charcoal/80 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden flex flex-col">
        {!isScanning && liveTokens.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
            <Radar size={48} className="mb-4 text-charcoal-light" />
            <p className="text-lg">Scanner is offline.</p>
            <p className="text-sm mt-2">Click 'Start Scanner' to begin monitoring DexScreener for safe tokens in real-time.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {liveTokens.map((token, index) => (
              <div 
                key={`${token.address}-${token.detectedAt.getTime()}`} 
                className="bg-charcoal-light border border-charcoal-lighter rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6 animate-[fadeIn_0.3s_ease-out] hover:border-lime-green/30 transition-colors group"
              >
                {/* Token Identity */}
                <div className="flex items-center gap-4 w-full sm:w-auto sm:flex-1">
                  {token.imageUrl ? (
                    <img src={token.imageUrl} alt={token.symbol} className="w-12 h-12 rounded-full border border-charcoal-lighter object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-charcoal border border-charcoal-lighter flex items-center justify-center font-bold text-white">
                      {token.symbol[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {token.symbol}
                      <span className="bg-lime-green/10 text-lime-green text-[10px] px-2 py-0.5 rounded border border-lime-green/20 flex items-center gap-1">
                        <ShieldCheck size={10} /> SAFE
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      {token.address.slice(0, 8)}...{token.address.slice(-6)}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 w-full sm:w-auto sm:flex-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Price</p>
                    <p className="text-sm font-mono text-white">${formatNumber(token.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Liquidity</p>
                    <p className="text-sm font-mono text-white">{formatCurrency(token.liquidity)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Market Cap</p>
                    <p className="text-sm font-mono text-white">{formatCurrency(token.marketCap)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href={`https://dexscreener.com/solana/${token.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none text-center bg-charcoal text-gray-300 hover:text-white hover:bg-neon-purple/20 transition-colors text-xs px-4 py-2 rounded-lg border border-charcoal-lighter"
                  >
                    DexScreener <ExternalLink size={12} className="inline ml-1" />
                  </a>
                  <a
                    href={`https://rugcheck.xyz/tokens/${token.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none text-center bg-charcoal text-gray-300 hover:text-white hover:bg-lime-green/20 transition-colors text-xs px-4 py-2 rounded-lg border border-charcoal-lighter"
                  >
                    RugCheck <ExternalLink size={12} className="inline ml-1" />
                  </a>
                </div>
              </div>
            ))}

            {isScanning && liveTokens.length === 0 && (
              <div className="flex flex-col items-center justify-center text-neon-purple/70 p-8 text-center animate-pulse">
                <Radar size={32} className="mb-4 animate-spin-slow" />
                <p>Scanning DexScreener & RugCheck...</p>
                <p className="text-xs text-gray-500 mt-2">Waiting for safe tokens with &gt; ${minLiquidity} liquidity.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
