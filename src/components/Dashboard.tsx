import React, { useMemo } from 'react';
import { MOCK_PORTFOLIO, generateMockChartData } from '../data';
import { formatCurrency, cn } from '../utils';
import { TokenChart } from './TokenChart';
import { PieChart, Wallet, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const chartData = useMemo(() => generateMockChartData(15234.50, 100), []);
  
  const totalValue = MOCK_PORTFOLIO.reduce((acc, item) => acc + (item.balance * item.token.price), 0);
  const totalCost = MOCK_PORTFOLIO.reduce((acc, item) => acc + (item.balance * item.avgBuyPrice), 0);
  const totalPnl = totalValue - totalCost;
  const pnlPercent = (totalPnl / totalCost) * 100;
  const isPositivePnl = totalPnl >= 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Portfolio Dashboard</h2>
          <p className="text-gray-400 text-sm">Track your connected wallet assets and performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-[#2B2D31] rounded-xl border border-[#383A40] p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total Balance</p>
              <h3 className="text-4xl font-bold text-white font-mono tracking-tight">
                {formatCurrency(totalValue)}
              </h3>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm",
              isPositivePnl ? "bg-[rgba(128,255,86,0.1)] text-[#80FF56]" : "bg-[rgba(255,86,86,0.1)] text-[#FF5656]"
            )}>
              {isPositivePnl ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(pnlPercent).toFixed(2)}% ({formatCurrency(Math.abs(totalPnl))})
            </div>
          </div>
          <div className="h-64 mt-4">
            <TokenChart data={chartData} color={isPositivePnl ? '#80FF56' : '#FF5656'} height={256} />
          </div>
        </div>

        <div className="bg-[#2B2D31] rounded-xl border border-[#383A40] p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-[#7F56FF]" /> Assets Allocation
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {MOCK_PORTFOLIO.map((item) => {
              const value = item.balance * item.token.price;
              const allocation = (value / totalValue) * 100;
              const pnl = value - (item.balance * item.avgBuyPrice);
              const isGain = pnl >= 0;

              return (
                <div key={item.token.id} className="p-4 rounded-lg bg-[#1E1F22] border border-[#383A40]">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2B2D31] flex items-center justify-center font-bold text-xs text-white">
                        {item.token.symbol[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{item.token.symbol}</div>
                        <div className="text-xs text-gray-400">{item.balance.toLocaleString()} tokens</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-white">{formatCurrency(value)}</div>
                      <div className={cn("text-xs font-medium", isGain ? "text-[#80FF56]" : "text-[#FF5656]")}>
                        {isGain ? '+' : ''}{formatCurrency(pnl)}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-[#383A40] rounded-full h-1.5 mt-3 overflow-hidden">
                    <div 
                      className="bg-[#7F56FF] h-1.5 rounded-full" 
                      style={{ width: `${allocation}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button className="mt-4 w-full bg-[#383A40] hover:bg-[#7F56FF] text-white py-2.5 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2">
            <Wallet size={16} /> Manage Assets
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#2B2D31] rounded-xl border border-[#383A40] p-6">
           <h3 className="text-gray-400 text-sm font-medium mb-1">Network Status</h3>
           <div className="flex items-center gap-3 mt-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#80FF56] shadow-[0_0_8px_#80FF56] animate-pulse"></div>
              <span className="text-white font-medium">Solana Mainnet</span>
           </div>
           <p className="text-xs text-gray-500 mt-2">TPS: 2,845 • Ping: 12ms</p>
        </div>
        <div className="bg-[#2B2D31] rounded-xl border border-[#383A40] p-6">
           <h3 className="text-gray-400 text-sm font-medium mb-1">Active Alerts</h3>
           <div className="flex items-center gap-3 mt-2">
              <Activity size={20} className="text-[#7F56FF]" />
              <span className="text-white font-medium">12 triggers set</span>
           </div>
           <p className="text-xs text-gray-500 mt-2">3 triggered in last 24h</p>
        </div>
        <div className="bg-[#2B2D31] rounded-xl border border-[#383A40] p-6">
           <h3 className="text-gray-400 text-sm font-medium mb-1">24h Volume Analyzed</h3>
           <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-bold text-white font-mono">$4.2B</span>
           </div>
           <p className="text-xs text-gray-500 mt-2 text-[#80FF56]">+15.2% vs yesterday</p>
        </div>
      </div>
    </div>
  );
};
