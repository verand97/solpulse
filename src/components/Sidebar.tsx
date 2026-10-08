import React from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  Wallet, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Radar, 
  ShieldAlert,
  Globe,
  Zap
} from 'lucide-react';
import { cn } from '../utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenLanding?: () => void;
}

const navItems = [
  { id: 'dashboard',   label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'screener',    label: 'Screener',       icon: LineChart },
  { id: 'alerts',      label: 'Whale Tracker',  icon: ShieldAlert },
  { id: 'livescanner', label: 'Live Scanner',   icon: Radar },
  { id: 'watchlist',   label: 'Watchlist',      icon: Star },
  { id: 'wallet',      label: 'Wallet',         icon: Wallet },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  collapsed, 
  onToggleCollapse,
  onOpenLanding
}) => {
  return (
    <div
      className={cn(
        'flex flex-col h-full shrink-0 transition-all duration-200 ease-in-out',
        'border-r border-[#222226] bg-[#0A0A0B]',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'h-12 flex items-center border-b border-[#222226] px-4 gap-2.5 cursor-pointer select-none shrink-0',
          collapsed && 'justify-center px-0'
        )}
        onClick={() => setActiveTab('dashboard')}
      >
        <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center shrink-0">
          <Zap size={13} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-[13px] font-semibold text-white tracking-tight">
            SolPulse
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 px-1.5 space-y-0.5">
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
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-[12.5px] font-medium',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-[#1A1A2E] text-blue-400'
                  : 'text-[#8A8A96] hover:text-[#EEEFF2] hover:bg-[#17171A]'
              )}
            >
              <Icon
                size={15}
                className={cn(
                  'shrink-0',
                  isActive ? 'text-blue-400' : ''
                )}
              />
              {!collapsed && (
                <span>{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="py-2 px-1.5 border-t border-[#222226] space-y-0.5">
        {onOpenLanding && (
          <button
            onClick={onOpenLanding}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-[12.5px] font-medium text-[#52525E] hover:text-[#8A8A96] hover:bg-[#17171A]',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? 'Portal Page' : undefined}
          >
            <Globe size={15} className="shrink-0" />
            {!collapsed && <span>Portal Page</span>}
          </button>
        )}
        <button 
          id="nav-settings"
          onClick={() => setActiveTab('settings')}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-[12.5px] font-medium',
            collapsed && 'justify-center px-0',
            activeTab === 'settings'
              ? 'bg-[#1A1A2E] text-blue-400'
              : 'text-[#52525E] hover:text-[#8A8A96] hover:bg-[#17171A]'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={15} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>

        <button
          id="sidebar-toggle"
          onClick={onToggleCollapse}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-[12.5px] font-medium text-[#52525E] hover:text-[#8A8A96] hover:bg-[#17171A]',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed
            ? <ChevronRight size={14} />
            : <><ChevronLeft size={14} /><span>Collapse</span></>
          }
        </button>
      </div>
    </div>
  );
};
