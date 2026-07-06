import React, { useState, useEffect } from 'react';
import { MOCK_WHALE_ALERTS } from '../data';
import { WhaleAlert } from '../types';
import { formatCurrency, formatAddress, cn } from '../utils';
import { ShieldAlert, ArrowRightLeft, ExternalLink, Eye, EyeOff, RefreshCw } from 'lucide-react';

export const WhaleAlerts: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [alerts, setAlerts] = useState<WhaleAlert[]>(MOCK_WHALE_ALERTS);
  const [liveMode, setLiveMode] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Simulate new whale alerts coming in
  useEffect(() => {
    if (!liveMode) return;
    
    const interval = setInterval(() => {
      const tokens = ['SOL', 'WIF', 'BONK', 'JUP', 'POPCAT', 'RAY', 'ORCA', 'PYTH'];
      const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
      const isBuy = Math.random() > 0.45;
      const amount = Math.floor(Math.random() * 5000000) + 200000;
      
      const newAlert: WhaleAlert = {
        id: `w-live-${Date.now()}`,
        tokenSymbol: randomToken,
        type: isBuy ? 'buy' : 'sell',
        amountUsd: amount,
        timestamp: Date.now(),
        txHash: Array.from({ length: 44 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789'[Math.floor(Math.random() * 57)]).join(''),
        walletAddress: Array.from({ length: 44 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789'[Math.floor(Math.random() * 57)]).join(''),
      };

      setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep max 50
    }, 8000);

    return () => clearInterval(interval);
  }, [liveMode]);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  const timeAgo = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <ShieldAlert className="text-[#7F56FF]" /> Whale Watcher
          </h2>
          <p className="text-gray-400 text-sm">Real-time alerts for large transactions on Solana.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Live toggle */}
          <button
            id="live-toggle"
            onClick={() => setLiveMode(prev => !prev)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
              liveMode
                ? "bg-[#80FF56]/10 text-[#80FF56] border-[#80FF56]/20"
                : "bg-[#383A40] text-gray-400 border-[#383A40]"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", liveMode ? "bg-[#80FF56] animate-pulse" : "bg-gray-500")} />
            {liveMode ? 'LIVE' : 'PAUSED'}
          </button>

          <div className="flex bg-[#2B2D31] p-1 rounded-lg border border-[#383A40]">
            <button 
              onClick={() => setFilter('all')}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", filter === 'all' ? "bg-[#383A40] text-white" : "text-gray-400 hover:text-gray-200")}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('buy')}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", filter === 'buy' ? "bg-[#383A40] text-[#80FF56]" : "text-gray-400 hover:text-gray-200")}
            >
              Buys
            </button>
            <button 
              onClick={() => setFilter('sell')}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", filter === 'sell' ? "bg-[#383A40] text-[#FF5656]" : "text-gray-400 hover:text-gray-200")}
            >
              Sells
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#2B2D31] rounded-xl border border-[#383A40] p-4">
          <p className="text-xs text-gray-500 mb-1">Total Alerts</p>
          <p className="text-xl font-bold text-white font-mono">{alerts.length}</p>
        </div>
        <div className="bg-[#2B2D31] rounded-xl border border-[#383A40] p-4">
          <p className="text-xs text-gray-500 mb-1">Total Buy Volume</p>
          <p className="text-xl font-bold text-[#80FF56] font-mono">
            {formatCurrency(alerts.filter(a => a.type === 'buy').reduce((sum, a) => sum + a.amountUsd, 0))}
          </p>
        </div>
        <div className="bg-[#2B2D31] rounded-xl border border-[#383A40] p-4">
          <p className="text-xs text-gray-500 mb-1">Total Sell Volume</p>
          <p className="text-xl font-bold text-[#FF5656] font-mono">
            {formatCurrency(alerts.filter(a => a.type === 'sell').reduce((sum, a) => sum + a.amountUsd, 0))}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAlerts.map(alert => {
          const isBuy = alert.type === 'buy';
          const isExpanded = expandedId === alert.id;
          
          return (
            <div
              key={alert.id}
              className={cn(
                "bg-[#2B2D31] border rounded-xl overflow-hidden transition-all duration-200 hover:border-[#7F56FF]/30",
                alert.id.startsWith('w-live-') ? "border-[#7F56FF]/20 animate-[fadeIn_300ms_ease-out]" : "border-[#383A40]"
              )}
            >
              <div
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                    isBuy ? "bg-[rgba(128,255,86,0.1)] text-[#80FF56]" : "bg-[rgba(255,86,86,0.1)] text-[#FF5656]"
                  )}>
                    <ArrowRightLeft size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-sm font-bold uppercase tracking-wider", isBuy ? "text-[#80FF56]" : "text-[#FF5656]")}>
                        WHALE {isBuy ? 'BUY' : 'SELL'}
                      </span>
                      <span className="text-gray-500 text-xs">• {timeAgo(alert.timestamp)}</span>
                      {alert.id.startsWith('w-live-') && (
                        <span className="text-[10px] bg-[#7F56FF]/20 text-[#7F56FF] px-1.5 py-0.5 rounded font-medium">NEW</span>
                      )}
                    </div>
                    <div className="text-lg font-medium text-white">
                      <span className="font-mono font-bold">{formatCurrency(alert.amountUsd)}</span> 
                      <span className="text-gray-400 mx-2">of</span> 
                      <span className="text-white font-bold">{alert.tokenSymbol}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:border-l sm:border-[#383A40] sm:pl-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Transaction</p>
                    <a
                      href={`https://solscan.io/tx/${alert.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#7F56FF] hover:text-[#9675FF] font-mono text-sm flex items-center gap-1 transition-colors"
                    >
                      {formatAddress(alert.txHash)} <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-0 border-t border-[#383A40] mt-0 animate-[fadeIn_150ms_ease-out]">
                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#1E1F22] rounded-lg p-3 border border-[#383A40]">
                      <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                      <a
                        href={`https://solscan.io/account/${alert.walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#7F56FF] hover:text-[#9675FF] font-mono flex items-center gap-1 transition-colors"
                      >
                        {formatAddress(alert.walletAddress)} <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="bg-[#1E1F22] rounded-lg p-3 border border-[#383A40]">
                      <p className="text-xs text-gray-500 mb-1">Full TX Hash</p>
                      <p className="text-sm text-gray-300 font-mono truncate" title={alert.txHash}>
                        {alert.txHash}
                      </p>
                    </div>
                    <div className="bg-[#1E1F22] rounded-lg p-3 border border-[#383A40]">
                      <p className="text-xs text-gray-500 mb-1">Exact Time</p>
                      <p className="text-sm text-gray-300">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
