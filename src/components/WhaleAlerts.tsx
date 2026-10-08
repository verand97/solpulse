import React, { useState } from 'react';
import { WhaleAlert, Token, TrackedWhale } from '../types';
import { formatCurrency, formatAddress, formatRelativeTime, cn } from '../utils';
import { useWhaleTracker } from '../hooks/useWhaleTracker';
import {
  ShieldAlert,
  ArrowRightLeft,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Activity,
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';

interface WhaleAlertsProps {
  tokens: Token[];
}

const CATEGORY_COLORS: Record<string, string> = {
  exchange:     'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'dex-mm':     'text-green-400 bg-green-400/10 border-green-400/20',
  'smart-money':'text-purple-400 bg-purple-400/10 border-purple-400/20',
  kol:          'text-amber-400 bg-amber-400/10 border-amber-400/20',
  whale:        'text-orange-400 bg-orange-400/10 border-orange-400/20',
};

export const WhaleAlerts: React.FC<WhaleAlertsProps> = ({ tokens }) => {
  const solToken = tokens.find(t => t.symbol === 'SOL');
  const solPrice = solToken?.price || 145;

  const {
    trackedWhales,
    selectedWhaleAddress,
    setSelectedWhaleAddress,
    whaleDetails,
    whaleAlerts,
    isAlertsLoading,
    refreshWhaleAlerts,
    fetchSelectedWhaleDetails,
    addWhale,
    removeWhale,
  } = useWhaleTracker(solPrice);

  const [activeTab,    setActiveTab]    = useState<'tracker' | 'alerts'>('tracker');
  const [filterType,   setFilterType]   = useState<'all' | 'buy' | 'sell'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress,   setNewAddress]   = useState('');
  const [newLabel,     setNewLabel]     = useState('');
  const [newCategory,  setNewCategory]  = useState<TrackedWhale['category']>('smart-money');
  const [newNotes,     setNewNotes]     = useState('');
  const [addError,     setAddError]     = useState('');
  const [copied,       setCopied]       = useState<string | null>(null);

  const selectedWhale = trackedWhales.find(w => w.address === selectedWhaleAddress) || trackedWhales[0];

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newAddress.trim()) { setAddError('Enter a valid Solana address'); return; }
    const ok = addWhale(newAddress.trim(), newLabel, newCategory, newNotes);
    if (!ok) { setAddError('Invalid address or already tracked'); return; }
    setNewAddress(''); setNewLabel(''); setNewNotes('');
    setShowAddModal(false);
  };

  const filteredAlerts = whaleAlerts.filter(a =>
    filterType === 'all' || a.type === filterType
  );

  const buyVol  = whaleAlerts.filter(a => a.type === 'buy' ).reduce((s, a) => s + a.amountUsd, 0);
  const sellVol = whaleAlerts.filter(a => a.type === 'sell').reduce((s, a) => s + a.amountUsd, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#222226] bg-[#0A0A0B]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-[#17171A] border border-[#222226] rounded-md p-0.5">
            <button
              onClick={() => setActiveTab('tracker')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-medium transition-colors',
                activeTab === 'tracker'
                  ? 'bg-[#1A1A2E] text-blue-400'
                  : 'text-[#52525E] hover:text-[#8A8A96]'
              )}
            >
              <Wallet size={12} /> Wallet Tracker
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-medium transition-colors',
                activeTab === 'alerts'
                  ? 'bg-[#1A1A2E] text-blue-400'
                  : 'text-[#52525E] hover:text-[#8A8A96]'
              )}
            >
              <Activity size={12} /> Live Alerts
            </button>
          </div>
          <span className="text-[11px] text-[#52525E] font-mono">SOL ${solPrice.toFixed(2)}</span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="h-7 flex items-center gap-1.5 px-3 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-medium transition-colors"
        >
          <Plus size={13} /> Track Wallet
        </button>
      </div>

      {/* === TRACKER TAB === */}
      {activeTab === 'tracker' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Wallet list */}
          <div className="w-64 shrink-0 border-r border-[#222226] overflow-y-auto custom-scrollbar bg-[#0A0A0B]">
            {trackedWhales.map(whale => {
              const isSelected = whale.address === selectedWhaleAddress;
              const catStyle = CATEGORY_COLORS[whale.category] || CATEGORY_COLORS.whale;
              return (
                <div
                  key={whale.address}
                  onClick={() => setSelectedWhaleAddress(whale.address)}
                  className={cn(
                    'px-3 py-3 border-b border-[#17171A] cursor-pointer transition-colors',
                    isSelected ? 'bg-[#111113]' : 'hover:bg-[#111113]'
                  )}
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className={cn(
                      'text-[12.5px] font-semibold leading-tight flex-1',
                      isSelected ? 'text-[#EEEFF2]' : 'text-[#8A8A96]'
                    )}>
                      {whale.label}
                    </span>
                    {whale.isCustom && (
                      <button
                        onClick={e => { e.stopPropagation(); removeWhale(whale.address); }}
                        className="text-[#2A2A30] hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase', catStyle)}>
                      {whale.category}
                    </span>
                    <span className="text-[10px] text-[#52525E] font-mono">{formatAddress(whale.address, 5)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Wallet detail */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedWhale && (
              <>
                {/* Wallet header */}
                <div className="px-5 py-4 border-b border-[#222226] bg-[#111113]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-[15px] font-bold text-[#EEEFF2]">{selectedWhale.label}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#52525E] font-mono">{selectedWhale.address}</span>
                        <button onClick={() => handleCopy(selectedWhale.address)} className="text-[#52525E] hover:text-[#8A8A96] transition-colors">
                          {copied === selectedWhale.address ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        </button>
                        <a href={`https://solscan.io/account/${selectedWhale.address}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center gap-0.5 transition-colors">
                          Solscan <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => fetchSelectedWhaleDetails(selectedWhale.address)}
                      className="h-7 flex items-center gap-1.5 px-2.5 rounded-md bg-[#17171A] border border-[#222226] text-[11.5px] text-[#52525E] hover:text-[#8A8A96] transition-colors"
                    >
                      <RefreshCw size={12} className={cn(whaleDetails.isLoading && 'animate-spin text-blue-400')} />
                      Refresh
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'SOL Balance', value: whaleDetails.isLoading ? '...' : `${whaleDetails.solBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SOL` },
                      { label: 'Est. Value',  value: whaleDetails.isLoading ? '...' : formatCurrency(whaleDetails.estimatedValueUsd) },
                      { label: 'Tx Records',  value: `${whaleDetails.transactions.length}` },
                    ].map(s => (
                      <div key={s.label} className="bg-[#17171A] rounded-md px-3 py-2.5 border border-[#222226]">
                        <p className="text-[10px] text-[#52525E] uppercase tracking-wide mb-1">{s.label}</p>
                        <p className={cn('text-[14px] font-bold font-mono', whaleDetails.isLoading ? 'text-[#52525E] animate-pulse' : 'text-[#EEEFF2]')}>
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {selectedWhale.notes && (
                    <p className="mt-2.5 text-[11px] text-[#52525E] bg-[#17171A] border border-[#222226] rounded px-3 py-2">
                      {selectedWhale.notes}
                    </p>
                  )}
                </div>

                {/* Transaction ledger */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#222226] bg-[#0A0A0B]">
                    <span className="text-[11px] font-semibold text-[#52525E] uppercase tracking-wide">Blockchain Signatures (Mainnet-beta)</span>
                    <span className="text-[10px] text-[#52525E] font-mono">{whaleDetails.transactions.length} records</span>
                  </div>

                  {whaleDetails.isLoading ? (
                    <div className="py-16 text-center text-[#52525E]">
                      <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-blue-400" />
                      <p className="text-[12px]">Querying Solana RPC...</p>
                    </div>
                  ) : whaleDetails.transactions.length === 0 ? (
                    <div className="py-16 text-center text-[#52525E] text-[12px]">No recent transactions found</div>
                  ) : (
                    <table className="w-full text-left border-collapse text-[12px] font-mono">
                      <thead>
                        <tr className="border-b border-[#17171A]">
                          <th className="px-5 py-2 text-[10px] font-medium text-[#52525E] uppercase tracking-wide">Signature</th>
                          <th className="px-5 py-2 text-[10px] font-medium text-[#52525E] uppercase tracking-wide">Time</th>
                          <th className="px-5 py-2 text-[10px] font-medium text-[#52525E] uppercase tracking-wide">Slot</th>
                          <th className="px-5 py-2 text-[10px] font-medium text-[#52525E] uppercase tracking-wide">Status</th>
                          <th className="px-5 py-2 text-right text-[10px] font-medium text-[#52525E] uppercase tracking-wide">Explorer</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#8A8A96] divide-y divide-[#17171A]">
                        {whaleDetails.transactions.map(tx => (
                          <tr key={tx.signature} className="hover:bg-[#111113] transition-colors">
                            <td className="px-5 py-3">
                              <button onClick={() => window.open(tx.explorerUrl, '_blank')} className="text-blue-400 hover:underline">
                                {formatAddress(tx.signature, 8)}
                              </button>
                            </td>
                            <td className="px-5 py-3 text-[#52525E]">{formatRelativeTime(tx.timestamp)}</td>
                            <td className="px-5 py-3 text-[#52525E]">#{tx.slot?.toLocaleString()}</td>
                            <td className="px-5 py-3">
                              {tx.status === 'success'
                                ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded border border-green-400/20"><CheckCircle2 size={10} /> OK</span>
                                : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20"><XCircle size={10} /> FAIL</span>
                              }
                            </td>
                            <td className="px-5 py-3 text-right">
                              <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition-colors">
                                Solscan <ExternalLink size={10} />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* === ALERTS TAB === */}
      {activeTab === 'alerts' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Stats + Filter bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#222226] bg-[#111113]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#52525E] uppercase tracking-wide">Buy Vol</span>
                <span className="text-[13px] font-bold font-mono text-green-400">{formatCurrency(buyVol)}</span>
              </div>
              <div className="h-3 w-px bg-[#222226]" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#52525E] uppercase tracking-wide">Sell Vol</span>
                <span className="text-[13px] font-bold font-mono text-red-400">{formatCurrency(sellVol)}</span>
              </div>
              <div className="h-3 w-px bg-[#222226]" />
              <span className="text-[11px] text-[#52525E]">{whaleAlerts.length} events</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-[#17171A] border border-[#222226] rounded-md p-0.5">
                {(['all', 'buy', 'sell'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={cn(
                      'px-2.5 py-1 rounded text-[11.5px] font-medium transition-colors capitalize',
                      filterType === t ? 'bg-[#1A1A2E] text-blue-400' : 'text-[#52525E] hover:text-[#8A8A96]'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                onClick={refreshWhaleAlerts}
                className="h-7 w-7 flex items-center justify-center rounded-md bg-[#17171A] border border-[#222226] text-[#52525E] hover:text-[#8A8A96] transition-colors"
              >
                <RefreshCw size={12} className={cn(isAlertsLoading && 'animate-spin text-blue-400')} />
              </button>
            </div>
          </div>

          {/* Alert feed */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredAlerts.length === 0 ? (
              <div className="py-20 text-center text-[#52525E] text-[12px]">
                <Activity size={20} className="mx-auto mb-2 text-blue-400 opacity-40" />
                <p>No whale events</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-[12px]">
                <thead className="sticky top-0 bg-[#0A0A0B]">
                  <tr className="border-b border-[#222226]">
                    <th className="px-4 py-2.5 text-[10px] font-medium text-[#52525E] uppercase tracking-wide">Type</th>
                    <th className="px-4 py-2.5 text-[10px] font-medium text-[#52525E] uppercase tracking-wide">Token</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-medium text-[#52525E] uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-2.5 text-[10px] font-medium text-[#52525E] uppercase tracking-wide">Wallet</th>
                    <th className="px-4 py-2.5 text-[10px] font-medium text-[#52525E] uppercase tracking-wide">Source</th>
                    <th className="px-4 py-2.5 text-[10px] font-medium text-[#52525E] uppercase tracking-wide">Time</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-medium text-[#52525E] uppercase tracking-wide">Verify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17171A]">
                  {filteredAlerts.map(alert => {
                    const isBuy = alert.type === 'buy';
                    return (
                      <tr key={alert.id} className="hover:bg-[#111113] transition-colors">
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded border',
                            isBuy
                              ? 'text-green-400 bg-green-400/10 border-green-400/20'
                              : 'text-red-400 bg-red-400/10 border-red-400/20'
                          )}>
                            {isBuy ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {isBuy ? 'BUY' : 'SELL'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-[#EEEFF2] font-mono">{alert.tokenSymbol}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-[#EEEFF2]">
                          {formatCurrency(alert.amountUsd)}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            {alert.walletLabel && (
                              <p className="text-[11px] font-medium text-[#8A8A96]">{alert.walletLabel}</p>
                            )}
                            <p className="text-[10.5px] font-mono text-[#52525E]">{formatAddress(alert.walletAddress, 5)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[#52525E]">{alert.dex || '—'}</td>
                        <td className="px-4 py-3 text-[11px] text-[#52525E] font-mono">{formatRelativeTime(alert.timestamp)}</td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`https://solscan.io/tx/${alert.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center gap-1 justify-end transition-colors font-mono"
                          >
                            {formatAddress(alert.txHash, 4)} <ExternalLink size={10} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ADD WHALE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#222226] rounded-lg w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222226]">
              <h3 className="text-[13px] font-semibold text-[#EEEFF2]">Track Wallet</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#52525E] hover:text-[#8A8A96] transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-4 space-y-3">
              {addError && (
                <div className="p-2.5 rounded bg-red-400/10 border border-red-400/20 text-red-400 text-[12px]">
                  {addError}
                </div>
              )}
              <div>
                <label className="block text-[11px] text-[#52525E] mb-1.5 uppercase tracking-wide">Solana Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 39azUYFWPz3VHgKCf..."
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  className="w-full h-8 px-3 bg-[#17171A] border border-[#222226] rounded-md text-[12px] font-mono text-[#EEEFF2] placeholder-[#52525E] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#52525E] mb-1.5 uppercase tracking-wide">Label</label>
                <input
                  type="text"
                  placeholder="e.g. Alpha Trader #1"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="w-full h-8 px-3 bg-[#17171A] border border-[#222226] rounded-md text-[12px] text-[#EEEFF2] placeholder-[#52525E] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#52525E] mb-1.5 uppercase tracking-wide">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full h-8 px-3 bg-[#17171A] border border-[#222226] rounded-md text-[12px] text-[#EEEFF2] focus:outline-none focus:border-blue-500"
                >
                  <option value="smart-money">Smart Money</option>
                  <option value="whale">Whale</option>
                  <option value="dex-mm">DEX Market Maker</option>
                  <option value="kol">KOL / Influencer</option>
                  <option value="exchange">Exchange</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#52525E] mb-1.5 uppercase tracking-wide">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Intel about this wallet..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#17171A] border border-[#222226] rounded-md text-[12px] text-[#EEEFF2] placeholder-[#52525E] focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-8 px-4 rounded-md text-[12px] text-[#52525E] hover:text-[#8A8A96] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-medium transition-colors"
                >
                  Start Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
