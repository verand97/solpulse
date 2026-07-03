import React from 'react';
import { Search, Bell, WalletCards } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-[#1E1F22] border-b border-[#383A40] flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-[#383A40] rounded-lg leading-5 bg-[#2B2D31] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#7F56FF] focus:border-[#7F56FF] sm:text-sm transition-colors"
            placeholder="Search tokens, pairs, or addresses..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        <button className="p-2 text-gray-400 hover:text-gray-200 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5656]"></span>
        </button>
        
        <button className="flex items-center gap-2 bg-[#7F56FF] hover:bg-[#9675FF] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(127,86,255,0.3)]">
          <WalletCards size={16} />
          Connect Wallet
        </button>
      </div>
    </header>
  );
};
