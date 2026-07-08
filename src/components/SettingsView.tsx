import React from 'react';
import { Save, Wallet, Shield, Zap } from 'lucide-react';
import { cn } from '../utils';

export const SettingsView: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto w-full animate-[fadeIn_300ms_ease-out]">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400">Manage your SolPulse preferences and RPC connections.</p>
      </div>

      <div className="space-y-6">
        {/* RPC Settings */}
        <div className="bg-charcoal-light border border-charcoal-lighter rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-lime-green" size={20} />
            <h3 className="text-lg font-medium text-white">RPC Connection</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Solana RPC Endpoint</label>
              <input 
                type="text" 
                defaultValue={import.meta.env.VITE_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"}
                className="w-full bg-charcoal border border-charcoal-lighter rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-purple transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">WebSocket Endpoint</label>
              <input 
                type="text" 
                defaultValue={(import.meta.env.VITE_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com").replace('http', 'ws')}
                className="w-full bg-charcoal border border-charcoal-lighter rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-purple transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-charcoal-light border border-charcoal-lighter rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-neon-purple" size={20} />
            <h3 className="text-lg font-medium text-white">Security & Alerts</h3>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border border-charcoal-lighter rounded-lg cursor-pointer hover:bg-charcoal/50 transition-colors">
              <div>
                <div className="text-white font-medium text-sm">Whale Watcher Alerts</div>
                <div className="text-gray-500 text-xs mt-0.5">Receive push notifications for &gt;$1M transactions</div>
              </div>
              <input type="checkbox" className="accent-neon-purple w-4 h-4" defaultChecked />
            </label>

            <label className="flex items-center justify-between p-3 border border-charcoal-lighter rounded-lg cursor-pointer hover:bg-charcoal/50 transition-colors">
              <div>
                <div className="text-white font-medium text-sm">Auto-Disconnect Wallet</div>
                <div className="text-gray-500 text-xs mt-0.5">Disconnect wallet after 30 minutes of inactivity</div>
              </div>
              <input type="checkbox" className="accent-neon-purple w-4 h-4" />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button className="bg-neon-purple hover:bg-neon-purple-hover text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(127,86,255,0.2)] flex items-center gap-2">
            <Save size={16} />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
