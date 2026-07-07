import React, { useMemo, useState, useEffect } from 'react';
import { generateMockChartData } from '../data';
import { PortfolioAsset } from '../types';
import { formatCurrency, cn } from '../utils';
import { TokenChart } from './TokenChart';
import { PieChart, ArrowUpRight, ArrowDownRight, Activity, Wifi, TrendingUp, Loader2 } from 'lucide-react';

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Portfolio Dashboard</h2>
          <p className="text-gray-400 text-sm">Track your connected wallet assets and performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="col-span-1 md:col-span-2 bg-charcoal-light rounded-xl border border-charcoal-lighter p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total Balance</p>
              <h3 className="text-4xl font-bold text-white font-mono tracking-tight">
                {formatCurrency(totalValue)}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm",
                isPositivePnl ? "bg-[rgba(128,255,86,0.1)] text-lime-green" : "bg-[rgba(255,86,86,0.1)] text-danger"
              )}>
                {isPositivePnl ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {Math.abs(pnlPercent).toFixed(2)}% ({formatCurrency(Math.abs(totalPnl))})
              </div>
            </div>
          </div>

          {/* Chart Range Selector */}
          <div className="flex gap-1 mb-4 bg-charcoal p-1 rounded-lg w-fit border border-charcoal-lighter">
            {(['1h', '4h', '1d', '7d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setChartRange(range)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  chartRange === range ? "bg-neon-purple text-white" : "text-gray-400 hover:text-gray-200"
                )}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="h-64">
            <TokenChart data={chartData} color={isPositivePnl ? '#80FF56' : '#FF5656'} height={256} />
          </div>
        </div>

        {/* Assets Allocation */}
        <div className="bg-charcoal-light rounded-xl border border-charcoal-lighter p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-neon-purple" /> Assets Allocation
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                <Loader2 size={24} className="animate-spin text-neon-purple" />
                Fetching portfolio data...
              </div>
            ) : portfolio.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 gap-2 text-gray-500">
                <PieChart size={32} className="opacity-20" />
                <p className="text-sm">No assets found</p>
                <p className="text-xs">Connect a wallet with SOL or SPL tokens</p>
              </div>
            ) : portfolio.map((item) => {
              const value = item.balance * item.token.price;
              const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;
              const pnl = value - (item.balance * item.avgBuyPrice);
              const isGain = pnl >= 0;

              return (
                <div key={item.token.id} className="p-4 rounded-lg bg-charcoal border border-charcoal-lighter">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      {item.token.imageUrl ? (
                        <img src={item.token.imageUrl} alt={item.token.symbol} className="w-8 h-8 rounded-full bg-charcoal-light object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-charcoal-light flex items-center justify-center font-bold text-xs text-white">
                          {item.token.symbol[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white">{item.token.symbol}</div>
                        <div className="text-xs text-gray-400">{item.balance.toLocaleString()} tokens</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-white">{formatCurrency(value)}</div>
                      <div className={cn("text-xs font-medium", isGain ? "text-lime-green" : "text-danger")}>
                        {isGain ? '+' : ''}{formatCurrency(pnl)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-charcoal-lighter rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-neon-purple h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${allocation}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">{allocation.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-charcoal-light rounded-xl border border-charcoal-lighter p-6">
           <h3 className="text-gray-400 text-sm font-medium mb-1">Network Status</h3>
           <div className="flex items-center gap-3 mt-2">
              <div className="w-2.5 h-2.5 rounded-full bg-lime-green shadow-[0_0_8px_#80FF56] animate-pulse" />
              <span className="text-white font-medium">Solana Mainnet</span>
           </div>
           <p className="text-xs text-gray-500 mt-2 font-mono">
             TPS: <span className="text-gray-300">{tps.toLocaleString()}</span> • Ping: <span className="text-gray-300">{ping}ms</span>
           </p>
        </div>
        <div className="bg-charcoal-light rounded-xl border border-charcoal-lighter p-6">
           <h3 className="text-gray-400 text-sm font-medium mb-1">Active Alerts</h3>
           <div className="flex items-center gap-3 mt-2">
              <Activity size={20} className="text-neon-purple" />
              <span className="text-white font-medium">12 triggers set</span>
           </div>
           <p className="text-xs text-gray-500 mt-2">3 triggered in last 24h</p>
        </div>
        <div className="bg-charcoal-light rounded-xl border border-charcoal-lighter p-6">
           <h3 className="text-gray-400 text-sm font-medium mb-1">24h Volume Analyzed</h3>
           <div className="flex items-center gap-3 mt-2">
              <TrendingUp size={20} className="text-lime-green" />
              <span className="text-2xl font-bold text-white font-mono">$4.2B</span>
           </div>
           <p className="text-xs text-lime-green mt-2">+15.2% vs yesterday</p>
        </div>
      </div>
    </div>
  );
};
