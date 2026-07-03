import React from 'react';
import { Wallet as WalletIcon, Copy, ExternalLink, QrCode } from 'lucide-react';
import { formatCurrency, formatAddress } from '../utils';
import { MOCK_PORTFOLIO } from '../data';

export const WalletView: React.FC = () => {
  const address = "7aV...9Kp";
  const totalValue = MOCK_PORTFOLIO.reduce((acc, item) => acc + (item.balance * item.token.price), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Wallet</h2>
        <p className="text-gray-400 text-sm">Manage your connected digital assets and execute instant transactions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#7F56FF] to-[#9675FF] rounded-2xl p-8 text-white relative overflow-hidden shadow-[0_0_30px_rgba(127,86,255,0.2)]">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <WalletIcon size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <span className="font-medium text-white/80">Total Balance</span>
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
                {formatAddress(address)} <Copy size={14} />
              </div>
            </div>
            <h3 className="text-5xl font-bold font-mono tracking-tight mb-2">
              {formatCurrency(totalValue)}
            </h3>
            <p className="text-white/80 text-sm">≈ 42.5 SOL</p>
            
            <div className="flex gap-4 mt-8">
              <button className="flex-1 bg-white text-[#7F56FF] font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">
                Send
              </button>
              <button className="flex-1 bg-[#1E1F22]/20 backdrop-blur-sm border border-white/20 text-white font-bold py-3 rounded-xl hover:bg-[#1E1F22]/30 transition-colors flex items-center justify-center gap-2">
                <QrCode size={18} /> Receive
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#2B2D31] rounded-2xl border border-[#383A40] p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Swap</h3>
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="bg-[#1E1F22] p-4 rounded-xl border border-[#383A40]">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">You pay</span>
                <span className="text-gray-400">Balance: 42.5 SOL</span>
              </div>
              <div className="flex items-center justify-between">
                <input type="text" placeholder="0.00" className="bg-transparent text-2xl font-mono text-white outline-none w-1/2" />
                <button className="flex items-center gap-2 bg-[#2B2D31] px-3 py-1.5 rounded-lg text-white font-medium hover:bg-[#383A40] transition-colors">
                  <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-xs">S</div>
                  SOL
                </button>
              </div>
            </div>
            
            <div className="flex justify-center -my-2 relative z-10">
              <button className="bg-[#383A40] p-2 rounded-full border-4 border-[#2B2D31] text-gray-400 hover:text-white transition-colors">
                <ArrowRightLeft size={16} className="rotate-90" />
              </button>
            </div>

            <div className="bg-[#1E1F22] p-4 rounded-xl border border-[#383A40]">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">You receive</span>
                <span className="text-gray-400">Balance: 0 USDC</span>
              </div>
              <div className="flex items-center justify-between">
                <input type="text" placeholder="0.00" className="bg-transparent text-2xl font-mono text-white outline-none w-1/2" />
                <button className="flex items-center gap-2 bg-[#7F56FF] px-3 py-1.5 rounded-lg text-white font-medium hover:bg-[#9675FF] transition-colors">
                  USDC
                </button>
              </div>
            </div>
            
            <button className="w-full bg-[#7F56FF] hover:bg-[#9675FF] text-white font-bold py-4 rounded-xl transition-colors mt-2 shadow-[0_0_15px_rgba(127,86,255,0.3)]">
              Swap Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Needed missing import
import { ArrowRightLeft } from 'lucide-react';
