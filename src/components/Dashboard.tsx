import React, { useMemo, useState, useEffect } from 'react';
import { generateMockChartData } from '../data';
import { PortfolioAsset } from '../types';
import { formatCurrency, cn } from '../utils';
import { TokenChart } from './TokenChart';
import { PieChart, ArrowUpRight, ArrowDownRight, Activity, TrendingUp, Loader2, Sparkles, Hexagon } from 'lucide-react';

interface DashboardProps {
  portfolio: PortfolioAsset[];
  isLoading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ portfolio, isLoading }) => {
  const [chartRange, setChartRange] = useState<'1h' | '4h' | '1d' | '7d'>('1d');
  const [tps, setTps] = useState(2845);
  const [ping, setPing] = useState(12);

  const totalValue = portfolio.reduce((acc, item) => acc + (item.balance * item.token.price), 0);
  const totalCost = portfolio.reduce((acc, item) => acc + (item.balance * item.avgBuyPrice), 0);
  const totalPnl = totalValue - totalCost;
  const pnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const isPositivePnl = totalPnl >= 0;

  const pointsMap = { '1h': 12, '4h': 48, '1d': 100, '7d': 168 };
  const chartData = useMemo(() => generateMockChartData(totalValue, pnlPercent, pointsMap[chartRange]), [chartRange, totalValue, pnlPercent]);

  // Simulate live TPS + Ping
  useEffect(() => {
    const interval = setInterval(() => {
      setTps(prev => Math.max(1800, prev + Math.floor((Math.random() - 0.5) * 200)));
      setPing(prev => Math.max(5, Math.min(30, prev + Math.floor((Math.random() - 0.5) * 4))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-8 relative animate-fade-in-up">
      {/* Ambient glowing orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-lime-green/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-neon-purple animate-pulse" />
            <span className="text-neon-purple text-xs font-bold tracking-widest uppercase">Overview</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Portfolio Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">Track your connected wallet assets and real-time performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card */}
        <div className="col-span-1 lg:col-span-2 bg-charcoal-light/40 backdrop-blur-xl rounded-2xl border border-white/5 p-1 relative overflow-hidden group">
          {/* Animated top border glow on hover */}
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-neon-purple to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="bg-charcoal-light/60 rounded-xl p-6 h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Total Balance</p>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-4xl md:text-5xl font-bold text-white font-mono tracking-tighter drop-shadow-lg">
                    {formatCurrency(totalValue)}
                  </h3>
                  <div className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-sm font-semibold shadow-inner",
                    isPositivePnl ? "bg-lime-green/10 text-lime-green border border-lime-green/20" : "bg-danger/10 text-danger border border-danger/20"
                  )}>
                    {isPositivePnl ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(pnlPercent).toFixed(2)}%
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2 font-mono">
                  {isPositivePnl ? '+' : '-'}{formatCurrency(Math.abs(totalPnl))} all time
                </p>
              </div>

              {/* Chart Range Selector */}
              <div className="flex gap-1 bg-charcoal/80 p-1.5 rounded-lg border border-white/5 shadow-inner">
                {(['1h', '4h', '1d', '7d'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setChartRange(range)}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-300",
                      chartRange === range 
                        ? "bg-neon-purple text-white shadow-[0_0_15px_rgba(127,86,255,0.4)]" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[280px] w-full mt-4">
              <TokenChart data={chartData} color={isPositivePnl ? '#80FF56' : '#FF5656'} height={280} />
            </div>
          </div>
        </div>

        {/* Assets Allocation */}
        <div className="bg-charcoal-light/40 backdrop-blur-xl rounded-2xl border border-white/5 p-1 relative overflow-hidden group flex flex-col h-[420px] lg:h-auto">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-lime-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="bg-charcoal-light/60 rounded-xl p-6 flex flex-col h-full">
            <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-widest border-b border-white/5 pb-4">
              <PieChart size={16} className="text-neon-purple" /> 
              Allocation Matrix
            </h3>
            
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-neon-purple animate-pulse">
                  <Hexagon size={32} className="animate-spin-slow" />
                  <span className="text-xs font-mono tracking-widest uppercase">Decrypting Assets...</span>
                </div>
              ) : portfolio.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 gap-3 text-gray-500">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 border-dashed">
                    <PieChart size={24} className="opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No assets found</p>
                  <p className="text-xs text-center max-w-[200px]">Connect a wallet with SOL or SPL tokens to view allocation</p>
                </div>
              ) : portfolio.map((item, i) => {
                const value = item.balance * item.token.price;
                const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;
                const pnl = value - (item.balance * item.avgBuyPrice);
                const isGain = pnl >= 0;

                return (
                  <div 
                    key={item.token.id} 
                    className="p-3.5 rounded-xl bg-charcoal/50 border border-white/5 hover:border-white/10 transition-colors group/item relative overflow-hidden"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-neon-purple to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        {item.token.imageUrl ? (
                          <img src={item.token.imageUrl} alt={item.token.symbol} className="w-9 h-9 rounded-full bg-charcoal object-cover border border-white/10 shadow-lg" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-charcoal-lighter to-charcoal flex items-center justify-center font-bold text-xs text-white border border-white/10">
                            {item.token.symbol[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white text-sm">{item.token.symbol}</div>
                          <div className="text-xs text-gray-500 font-mono">{item.balance.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-sm">{formatCurrency(value)}</div>
                        <div className={cn("text-xs font-mono mt-0.5", isGain ? "text-lime-green" : "text-danger")}>
                          {isGain ? '+' : ''}{formatCurrency(pnl)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-black/40 rounded-full h-1 overflow-hidden shadow-inner">
                        <div 
                          className="bg-linear-to-r from-neon-purple to-[#a385ff] h-full rounded-full relative" 
                          style={{ width: `${allocation}%` }}
                        >
                          <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px]" />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-gray-400 w-12 text-right">{allocation.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Cyberpunk Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-charcoal-light/80 to-charcoal/80 backdrop-blur-md rounded-xl border border-white/5 p-5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
             <Activity size={64} />
           </div>
           <h3 className="text-neon-purple text-xs font-bold uppercase tracking-widest mb-3">Network Link</h3>
           <div className="flex items-center gap-3 mt-1">
              <div className="relative flex items-center justify-center w-3 h-3">
                <div className="absolute w-full h-full rounded-full bg-lime-green animate-ping opacity-75" />
                <div className="relative w-2 h-2 rounded-full bg-lime-green" />
              </div>
              <span className="text-white font-bold text-lg">Solana Mainnet</span>
           </div>
           <div className="mt-4 flex gap-4 border-t border-white/5 pt-4">
             <div>
               <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">TPS</p>
               <p className="text-lime-green font-mono font-bold text-sm">{tps.toLocaleString()}</p>
             </div>
             <div>
               <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Latency</p>
               <p className="text-white font-mono font-bold text-sm">{ping}ms</p>
             </div>
           </div>
        </div>
        
        <div className="bg-linear-to-br from-charcoal-light/80 to-charcoal/80 backdrop-blur-md rounded-xl border border-white/5 p-5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
             <Hexagon size={64} />
           </div>
           <h3 className="text-neon-purple text-xs font-bold uppercase tracking-widest mb-3">Sentinel Alerts</h3>
           <div className="flex items-center gap-3 mt-1">
              <div className="w-10 h-10 rounded-lg bg-neon-purple/10 flex items-center justify-center border border-neon-purple/20">
                <Activity size={20} className="text-neon-purple" />
              </div>
              <div>
                <span className="block text-white font-bold text-lg">12 Active</span>
                <span className="block text-xs text-gray-400">Monitoring conditions</span>
              </div>
           </div>
           <div className="mt-4 border-t border-white/5 pt-4">
              <p className="text-xs text-gray-400 font-mono"><span className="text-neon-purple font-bold">3</span> triggers executed in last 24h</p>
           </div>
        </div>

        <div className="bg-linear-to-br from-charcoal-light/80 to-charcoal/80 backdrop-blur-md rounded-xl border border-white/5 p-5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
             <TrendingUp size={64} />
           </div>
           <h3 className="text-neon-purple text-xs font-bold uppercase tracking-widest mb-3">Global Volume</h3>
           <div className="flex items-center gap-3 mt-1">
              <div className="w-10 h-10 rounded-lg bg-lime-green/10 flex items-center justify-center border border-lime-green/20">
                <TrendingUp size={20} className="text-lime-green" />
              </div>
              <div>
                <span className="block text-2xl font-bold text-white font-mono tracking-tighter">$4.2B</span>
              </div>
           </div>
           <div className="mt-4 border-t border-white/5 pt-4">
              <p className="text-xs text-lime-green font-mono flex items-center gap-1">
                <ArrowUpRight size={14} /> +15.2% vs 24h prior
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

