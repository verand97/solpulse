import React from 'react';
import { LayoutDashboard, LineChart, Bell, Wallet, Settings } from 'lucide-react';
import { cn } from '../utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'screener', label: 'Screener', icon: LineChart },
  { id: 'alerts', label: 'Whale Alerts', icon: Bell },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-64 bg-[#2B2D31] flex flex-col h-full border-r border-[#383A40]">
      <div className="p-6">
        <h1 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7F56FF] to-[#80FF56] flex items-center justify-center">
            <LineChart size={18} className="text-[#1E1F22]" />
          </div>
          SolDex<span className="text-[#7F56FF]">.ai</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium',
                isActive
                  ? 'bg-[rgba(127,86,255,0.15)] text-[#7F56FF]'
                  : 'text-gray-400 hover:bg-[#383A40] hover:text-gray-200'
              )}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-[#383A40]">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium text-gray-400 hover:bg-[#383A40] hover:text-gray-200">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </div>
  );
};
