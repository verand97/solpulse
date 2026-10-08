// SolPulse Terminal - Dashboard Overview
import React, { useMemo, useState, useEffect } from 'react';
import { generateMockChartData } from '../data';
import { PortfolioAsset } from '../types';
import { formatCurrency, cn } from '../utils';
import { TokenChart } from './TokenChart';
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  TrendingUp,
  Loader2,
  PieChart,
  Wifi,
  Zap,
  BarChart2,
} from 'lucide-react';

interface DashboardProps {
  portfolio: PortfolioAsset[];
  isLoading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ portfolio, isLoading }) => {
  const [chartRange, setChartRange] = useState<'1h' | '4h' | '1d' | '7d'>('1d');
  const [tps, setTps] = useState(2845);
  const [ping, setPing] = useState(12);

  const totalValue  = portfolio.reduce((acc, item) => acc + (item.balance * item.token.price), 0);
  const totalCost   = portfolio.reduce((acc, item) => acc + (item.balance * item.avgBuyPrice), 0);
  const totalPnl    = totalValue - totalCost;
  const pnlPercent  = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const isPositive  = totalPnl >= 0;

  const pointsMap = { '1h': 12, '4h': 48, '1d': 100, '7d': 168 };
  const chartData = useMemo(
    () => generateMockChartData(totalValue, pnlPercent, pointsMap[chartRange]),
    [chartRange, totalValue, pnlPercent]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTps(prev => Math.max(1800, prev + Math.floor((Math.random() - 0.5) * 200)));
      setPing(prev => Math.max(5, Math.min(30, prev + Math.floor((Math.random() - 0.5) * 4))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-5">
      {/* Page heading */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-[16px] font-bold text-txt">Dashboard</h1>
          <p className="text-[11px] text-txt-3 mt-0.5">Connected wallet overview</p>
        </div>
      </div>

      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio chart */}
        <div className="col-span-1 lg:col-span-2 bg-surface border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div>
              <p className="text-[10px] text-txt-3 uppercase tracking-wide mb-1">Portfolio Value</p>
              <div className="flex items-baseline gap-2.5">
                <span className="text-[26px] font-bold font-mono text-txt tracking-tighter">
                  {formatCurrency(totalValue)}
                </span>
                <span className={cn(
                  'flex items-center gap-0.5 text-[12px] font-bold font-mono px-2 py-0.5 rounded border',
                  isPositive
                    ? 'text-green-400 bg-green-400/10 border-green-400/20'
                    : 'text-red-400 bg-red-400/10 border-red-400/20'
                )}>
                  {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(pnlPercent).toFixed(2)}%
                </span>
              </div>
              <p className="text-[11px] text-txt-3 font-mono mt-0.5">
                {isPositive ? '+' : ''}{formatCurrency(totalPnl)} all time
              </p>
            </div>
            {/* Range selector */}
            <div className="flex items-center gap-0.5 bg-surface-2 border border-border rounded-md p-0.5">
              {(['1h', '4h', '1d', '7d'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-bold transition-colors',
                    chartRange === r
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-txt-3 hover:text-txt-2'
                  )}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="px-0 pt-2 pb-0">
            <TokenChart data={chartData} color={isPositive ? '#22C55E' : '#F87171'} height={220} />
          </div>
        </div>

        {/* Asset allocation */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
            <PieChart size={13} className="text-txt-3" />
            <span className="text-[11px] font-semibold text-txt-2 uppercase tracking-wide">Allocation</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-surface-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full py-12">
                <Loader2 size={20} className="animate-spin text-blue-400" />
              </div>
            ) : portfolio.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-2 text-txt-3">
                <PieChart size={24} className="opacity-30" />
                <p className="text-[12px]">No assets</p>
                <p className="text-[11px] text-center max-w-45">Connect a wallet with SOL or SPL tokens</p>
              </div>
            ) : (
              portfolio.map((item) => {
                const value = item.balance * item.token.price;
                const alloc = totalValue > 0 ? (value / totalValue) * 100 : 0;
                const pnl   = value - (item.balance * item.avgBuyPrice);
                const isGain = pnl >= 0;

                return (
                  <div key={item.token.id} className="px-4 py-3 hover:bg-surface-2 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center overflow-hidden shrink-0">
                          {item.token.imageUrl
                            ? <img src={item.token.imageUrl} alt={item.token.symbol} className="w-full h-full object-cover" />
                            : <span className="text-[10px] font-bold text-txt-2">{item.token.symbol[0]}</span>
                          }
                        </div>
                        <div>
                          <div className="text-[12.5px] font-bold text-txt">{item.token.symbol}</div>
                          <div className="text-[10px] text-txt-3 font-mono">{item.balance.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[12.5px] font-bold font-mono text-txt">{formatCurrency(value)}</div>
                        <div className={cn('text-[10px] font-mono', isGain ? 'text-green-400' : 'text-red-400')}>
                          {isGain ? '+' : ''}{formatCurrency(pnl)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${alloc}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-txt-3 w-9 text-right">{alloc.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Network */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wifi size={13} className="text-txt-3" />
            <span className="text-[10px] font-semibold text-txt-3 uppercase tracking-wide">Network</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[13px] font-bold text-txt">Solana Mainnet</span>
          </div>
          <div className="flex gap-5 pt-3 border-t border-surface-3">
            <div>
              <p className="text-[10px] text-txt-3 uppercase tracking-wide mb-1">TPS</p>
              <p className="text-[13px] font-bold font-mono text-green-400">{tps.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-txt-3 uppercase tracking-wide mb-1">Latency</p>
              <p className="text-[13px] font-bold font-mono text-txt">{ping}ms</p>
            </div>
          </div>
        </div>

        {/* Whale Alerts */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={13} className="text-txt-3" />
            <span className="text-[10px] font-semibold text-txt-3 uppercase tracking-wide">Whale Alerts</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Activity size={15} className="text-blue-400" />
            </div>
            <div>
              <span className="text-[15px] font-bold text-txt">12</span>
              <span className="text-[11px] text-txt-3 ml-1.5">active monitors</span>
            </div>
          </div>
          <p className="text-[11px] text-txt-3 font-mono pt-3 border-t border-surface-3">
            <span className="text-blue-400 font-bold">3</span> triggers fired in last 24h
          </p>
        </div>

        {/* Volume */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={13} className="text-txt-3" />
            <span className="text-[10px] font-semibold text-txt-3 uppercase tracking-wide">Global DEX Volume</span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-[24px] font-bold font-mono text-txt tracking-tighter">$4.2B</span>
          </div>
          <p className="text-[11px] text-green-400 font-mono flex items-center gap-1 pt-3 border-t border-surface-3">
            <ArrowUpRight size={12} /> +15.2% vs 24h prior
          </p>
        </div>
      </div>
    </div>
  );
};
