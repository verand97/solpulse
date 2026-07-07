import React from 'react';
import { LayoutDashboard, LineChart, Bell, Wallet, Settings, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
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
  { id: 'alerts', label: 'Whale Alerts', icon: Bell },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, collapsed, onToggleCollapse }) => {
  return (
    <div className={cn(
      "bg-charcoal-light flex flex-col h-full border-r border-charcoal-lighter transition-all duration-300 ease-in-out shrink-0",
      collapsed ? "w-[72px]" : "w-64"
    )}>
      <div className={cn("p-6 flex items-center", collapsed ? "justify-center" : "justify-between")}>
        <h1 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-neon-purple to-lime-green flex items-center justify-center shrink-0">
            <Zap size={18} className="text-charcoal" />
          </div>
          {!collapsed && (
            <span className="whitespace-nowrap">
              Sol<span className="text-neon-purple">Pulse</span>
            </span>
          )}
        </h1>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
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
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium',
                collapsed && 'justify-center',
                isActive
                  ? 'bg-neon-purple-dim text-neon-purple shadow-[inset_0_0_0_1px_rgba(127,86,255,0.2)]'
                  : 'text-gray-400 hover:bg-charcoal-lighter hover:text-gray-200'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-charcoal-lighter space-y-1">
        <button 
          id="nav-settings"
          onClick={() => setActiveTab('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
            collapsed ? 'justify-center' : '',
            activeTab === 'settings' 
              ? 'bg-neon-purple-dim text-neon-purple shadow-[inset_0_0_0_1px_rgba(127,86,255,0.2)]'
              : 'text-gray-400 hover:bg-charcoal-lighter hover:text-gray-200'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && 'Settings'}
        </button>
        <button
          id="sidebar-toggle"
          onClick={onToggleCollapse}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-gray-500 hover:bg-charcoal-lighter hover:text-gray-200",
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </div>
  );
};
