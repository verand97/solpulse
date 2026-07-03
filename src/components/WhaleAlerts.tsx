import React, { useState } from 'react';
import { MOCK_WHALE_ALERTS } from '../data';
import { formatCurrency, formatAddress, cn } from '../utils';
import { ShieldAlert, ArrowRightLeft, ExternalLink, Filter } from 'lucide-react';

export const WhaleAlerts: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');

  const filteredAlerts = MOCK_WHALE_ALERTS.filter(alert => {
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <ShieldAlert className="text-[#7F56FF]" /> Whale Watcher
          </h2>
          <p className="text-gray-400 text-sm">Real-time alerts for large transactions on Solana.</p>
        </div>
        
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

      <div className="space-y-4">
        {filteredAlerts.map(alert => {
          const isBuy = alert.type === 'buy';
          const timeAgo = Math.floor((Date.now() - alert.timestamp) / 60000);
          
          return (
            <div key={alert.id} className="bg-[#2B2D31] border border-[#383A40] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-transform hover:scale-[1.01]">
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
                    <span className="text-gray-500 text-xs">• {timeAgo} mins ago</span>
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
                  <a href="#" className="text-[#7F56FF] hover:text-[#9675FF] font-mono text-sm flex items-center gap-1 transition-colors">
                    {formatAddress(alert.txHash)} <ExternalLink size={12} />
                  </a>
                </div>
                <button className="ml-auto bg-[#383A40] hover:bg-[#4a4d54] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Analyze
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
