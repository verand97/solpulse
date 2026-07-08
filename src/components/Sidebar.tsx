import React from 'react';
import { LayoutDashboard, LineChart, Bell, Wallet, Settings, ChevronLeft, ChevronRight, Zap, Star } from 'lucide-react';
import { cn } from '../utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'screener', label: 'Screener', icon: LineChart },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
  { id: 'alerts', label: 'Whale Alerts', icon: Bell },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, collapsed, onToggleCollapse }) => {
  return (
    <div className={cn(
      "bg-charcoal/90 backdrop-blur-xl flex flex-col h-full border-r border-white/5 relative z-10 transition-all duration-300 ease-in-out shrink-0 overflow-visible",
      collapsed ? "w-[72px]" : "w-64"
    )}>
      {/* Edge glow effect */}
      <div className="absolute right-0 top-0 w-px h-full bg-linear-to-b from-transparent via-neon-purple/50 to-transparent pointer-events-none" />

      <div className={cn("p-6 flex items-center relative", collapsed ? "justify-center" : "justify-between")}>
        <h1 className="text-xl font-bold font-sans text-white tracking-widest uppercase flex items-center gap-3 overflow-hidden">
          <div className="relative w-8 h-8 rounded-md bg-charcoal-light border border-white/10 flex items-center justify-center shrink-0 group shadow-[0_0_10px_rgba(127,86,255,0.2)]">
            <div className="absolute inset-0 bg-linear-to-br from-neon-purple to-lime-green opacity-20" />
            <Zap size={16} className="text-neon-purple drop-shadow-[0_0_5px_rgba(127,86,255,0.8)]" />
          </div>
          {!collapsed && (
            <span className="whitespace-nowrap relative">
              SOL<span className="text-lime-green drop-shadow-[0_0_5px_rgba(128,255,86,0.6)]">PULSE</span>
            </span>
          )}
        </h1>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-2 mt-4 relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 text-xs font-bold uppercase tracking-wider relative overflow-hidden group',
                collapsed && 'justify-center px-0'
              )}
            >
              {/* Active / Hover Backgrounds */}
              {isActive && (
                <div className="absolute inset-0 bg-neon-purple/10 border border-neon-purple/30 rounded-lg shadow-[inset_0_0_15px_rgba(127,86,255,0.15)]" />
              )}
              {!isActive && (
                <div className="absolute inset-0 bg-transparent group-hover:bg-white/5 border border-transparent group-hover:border-white/10 rounded-lg transition-all duration-300" />
              )}
              
              {/* Active left indicator bar */}
              <div className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-neon-purple transition-all duration-300 shadow-[0_0_10px_#7F56FF]",
                isActive ? "h-6 opacity-100" : "h-0 opacity-0 group-hover:h-3 group-hover:bg-white/50 group-hover:opacity-100 group-hover:shadow-none"
              )} />

              <Icon size={18} className={cn(
                "shrink-0 relative z-10 transition-colors duration-300", 
                isActive ? "text-neon-purple drop-shadow-[0_0_5px_rgba(127,86,255,0.5)]" : "text-gray-500 group-hover:text-gray-300"
              )} />
              
              {!collapsed && (
                <span className={cn(
                  "relative z-10 transition-colors duration-300 text-left w-full",
                  isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300"
                )}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5 space-y-2 relative z-10 bg-charcoal/50 backdrop-blur-md">
        <button 
          id="nav-settings"
          onClick={() => setActiveTab('settings')}
          className={cn(
            "w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 text-xs font-bold uppercase tracking-wider relative overflow-hidden group",
            collapsed ? 'justify-center px-0' : ''
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          {activeTab === 'settings' && (
            <div className="absolute inset-0 bg-neon-purple/10 border border-neon-purple/30 rounded-lg shadow-[inset_0_0_15px_rgba(127,86,255,0.15)]" />
          )}
          {activeTab !== 'settings' && (
            <div className="absolute inset-0 bg-transparent group-hover:bg-white/5 border border-transparent group-hover:border-white/10 rounded-lg transition-all duration-300" />
          )}

          <div className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-neon-purple transition-all duration-300 shadow-[0_0_10px_#7F56FF]",
            activeTab === 'settings' ? "h-6 opacity-100" : "h-0 opacity-0 group-hover:h-3 group-hover:bg-white/50 group-hover:opacity-100 group-hover:shadow-none"
          )} />

          <Settings size={18} className={cn(
            "shrink-0 relative z-10 transition-colors duration-300", 
            activeTab === 'settings' ? "text-neon-purple drop-shadow-[0_0_5px_rgba(127,86,255,0.5)]" : "text-gray-500 group-hover:text-gray-300"
          )} />
          
          {!collapsed && (
            <span className={cn(
              "relative z-10 transition-colors duration-300 text-left w-full",
              activeTab === 'settings' ? "text-white" : "text-gray-500 group-hover:text-gray-300"
            )}>
              Systems
            </span>
          )}
        </button>
        <button
          id="sidebar-toggle"
          onClick={onToggleCollapse}
          className={cn(
            "w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-white/5 hover:text-gray-400 group relative",
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} className="group-hover:text-white transition-colors" /> : <ChevronLeft size={18} className="group-hover:text-white transition-colors" />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </div>
  );
};
