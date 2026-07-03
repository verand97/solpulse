import React, { useState, useEffect } from 'react';
import { MOCK_TOKENS } from '../data';
import { Token } from '../types';
import { formatCurrency, formatNumber, cn } from '../utils';
import { Search, Filter, TrendingUp, TrendingDown, Clock, Droplets } from 'lucide-react';

export const Screener: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>(MOCK_TOKENS);
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers' | 'new'>('all');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTokens(prev => prev.map(t => {
        const change = (Math.random() - 0.5) * 0.05 * t.price;
        const newPrice = t.price + change;
        const newChange24h = t.priceChange24h + (change / t.price) * 100;
        return {
          ...t,
          price: Math.max(0.000001, newPrice),
          priceChange24h: newChange24h
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredTokens = tokens.filter(t => {
    if (filter === 'gainers') return t.priceChange24h > 0;
    if (filter === 'losers') return t.priceChange24h < 0;
    if (filter === 'new') return Date.now() - t.createdAt < 86400000 * 30; // Within 30 days
    return true;
  }).sort((a, b) => b.volume24h - a.volume24h);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">DEX Screener</h2>
          <p className="text-gray-400 text-sm">Real-time Solana token pairs and liquidity.</p>
        </div>
        
        <div className="flex bg-[#2B2D31] p-1 rounded-lg border border-[#383A40]">
          <button 
            onClick={() => setFilter('all')}
            className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors", filter === 'all' ? "bg-[#383A40] text-white" : "text-gray-400 hover:text-gray-200")}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('gainers')}
            className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1", filter === 'gainers' ? "bg-[#383A40] text-[#80FF56]" : "text-gray-400 hover:text-gray-200")}
          >
            <TrendingUp size={14} /> Gainers
          </button>
          <button 
            onClick={() => setFilter('losers')}
            className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1", filter === 'losers' ? "bg-[#383A40] text-[#FF5656]" : "text-gray-400 hover:text-gray-200")}
          >
            <TrendingDown size={14} /> Losers
          </button>
          <button 
            onClick={() => setFilter('new')}
            className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1", filter === 'new' ? "bg-[#383A40] text-[#7F56FF]" : "text-gray-400 hover:text-gray-200")}
          >
            <Clock size={14} /> New Pairs
          </button>
        </div>
      </div>

      <div className="bg-[#2B2D31] rounded-xl border border-[#383A40] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1E1F22] border-b border-[#383A40] text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Token</th>
                <th className="px-6 py-4 font-medium text-right">Price</th>
                <th className="px-6 py-4 font-medium text-right">24h Change</th>
                <th className="px-6 py-4 font-medium text-right">Volume</th>
                <th className="px-6 py-4 font-medium text-right">Liquidity</th>
                <th className="px-6 py-4 font-medium text-right">Market Cap</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#383A40]">
              {filteredTokens.map(token => {
                const isPositive = token.priceChange24h >= 0;
                return (
                  <tr key={token.id} className="hover:bg-[#383A40]/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1E1F22] border border-[#383A40] flex items-center justify-center font-bold text-xs text-white">
                          {token.symbol[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{token.symbol}</div>
                          <div className="text-xs text-gray-500">{token.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-white">
                      {formatCurrency(token.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      <span className={isPositive ? 'text-[#80FF56]' : 'text-[#FF5656]'}>
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
                      <button className="text-xs bg-[#7F56FF]/10 text-[#7F56FF] hover:bg-[#7F56FF] hover:text-white px-3 py-1.5 rounded transition-colors font-medium border border-[#7F56FF]/20 opacity-0 group-hover:opacity-100">
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
