import React, { useState } from 'react';
import { Save, Shield, Zap, Server, Bell, Check } from 'lucide-react';
import { cn } from '../utils';

export const SettingsView: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [selectedRpc, setSelectedRpc] = useState(
    import.meta.env.VITE_SOLANA_RPC_URL || 'https://solana-rpc.publicnode.com'
  );
  const [wsUrl, setWsUrl] = useState(
    (import.meta.env.VITE_SOLANA_RPC_URL || 'https://solana-rpc.publicnode.com').replace('http', 'ws')
  );
  const [whaleAlertsEnabled, setWhaleAlertsEnabled] = useState(true);
  const [autoDisconnect, setAutoDisconnect] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-bg overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-bg">
        <div>
          <h1 className="text-[14px] font-bold text-txt uppercase tracking-wide">System Settings</h1>
          <p className="text-[11px] text-txt-3">Network endpoints, node configuration and notification thresholds</p>
        </div>
      </div>

      <div className="p-6 max-w-3xl mx-auto w-full space-y-5">
        {/* RPC Settings */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-blue-400" />
            <h2 className="text-[13px] font-bold text-txt uppercase tracking-wide">Solana RPC Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-txt-2 mb-1.5 uppercase font-mono">
                Primary RPC Endpoint
              </label>
              <input
                type="text"
                value={selectedRpc}
                onChange={(e) => setSelectedRpc(e.target.value)}
                className="w-full h-8 px-3 bg-surface-2 border border-border rounded text-[12px] font-mono text-txt focus:outline-none focus:border-blue-500 transition-colors"
              />
              <div className="flex gap-2 mt-2">
                {[
                  { name: 'Publicnode (Default)', url: 'https://solana-rpc.publicnode.com' },
                  { name: 'Official Mainnet', url: 'https://api.mainnet-beta.solana.com' },
                ].map(item => (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => { setSelectedRpc(item.url); setWsUrl(item.url.replace('http', 'ws')); }}
                    className={cn(
                      'text-[10px] font-mono px-2 py-0.5 rounded border transition-colors',
                      selectedRpc === item.url
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-surface-2 border-border text-txt-3 hover:text-txt-2'
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-txt-2 mb-1.5 uppercase font-mono">
                WebSocket Endpoint
              </label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                className="w-full h-8 px-3 bg-surface-2 border border-border rounded text-[12px] font-mono text-txt focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Security & Alerts */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} className="text-blue-400" />
            <h2 className="text-[13px] font-bold text-txt uppercase tracking-wide">Security & Subscriptions</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-surface-2 border border-border rounded cursor-pointer hover:border-border-2 transition-colors">
              <div>
                <div className="text-[12.5px] font-medium text-txt">Whale Movement Push Alerts</div>
                <div className="text-[11px] text-txt-3">Notify in UI when monitored whales execute orders &gt; $50,000</div>
              </div>
              <input
                type="checkbox"
                checked={whaleAlertsEnabled}
                onChange={(e) => setWhaleAlertsEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-surface border-border text-blue-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-surface-2 border border-border rounded cursor-pointer hover:border-border-2 transition-colors">
              <div>
                <div className="text-[12.5px] font-medium text-txt">Automatic Wallet Timeout</div>
                <div className="text-[11px] text-txt-3">Safely disconnect hardware/extension wallet after 30m idle</div>
              </div>
              <input
                type="checkbox"
                checked={autoDisconnect}
                onChange={(e) => setAutoDisconnect(e.target.checked)}
                className="w-4 h-4 rounded bg-surface border-border text-blue-500 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="h-8 px-4 rounded bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors"
          >
            {saved ? (
              <>
                <Check size={13} className="text-white" /> Settings Saved
              </>
            ) : (
              <>
                <Save size={13} /> Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
