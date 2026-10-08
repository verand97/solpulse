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
  Eye, 
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';

interface WhaleAlertsProps {
  tokens: Token[];
}

export const WhaleAlerts: React.FC<WhaleAlertsProps> = ({ tokens }) => {
  // Find current SOL price from tokens list for accurate conversions
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

  const [activeSubTab, setActiveSubTab] = useState<'tracker' | 'alerts'>('tracker');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<TrackedWhale['category']>('smart-money');
  const [newNotes, setNewNotes] = useState('');
  const [addError, setAddError] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const selectedWhale = trackedWhales.find(w => w.address === selectedWhaleAddress) || trackedWhales[0];

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleAddWhaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newAddress.trim()) {
      setAddError('Please enter a valid Solana address');
      return;
    }

    const success = addWhale(newAddress.trim(), newLabel, newCategory, newNotes);
    if (!success) {
      setAddError('Invalid Solana address format or wallet already tracked');
      return;
    }

    setNewAddress('');
    setNewLabel('');
    setNewNotes('');
    setShowAddModal(false);
  };

  const filteredAlerts = whaleAlerts.filter(a => {
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  const totalBuyVolume = whaleAlerts.filter(a => a.type === 'buy').reduce((sum, a) => sum + a.amountUsd, 0);
  const totalSellVolume = whaleAlerts.filter(a => a.type === 'sell').reduce((sum, a) => sum + a.amountUsd, 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-neon-purple text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-neon-purple animate-pulse" /> On-Chain Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Whale Radar &amp; Wallet Tracker
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time on-chain tracking for institutional wallets, smart money, and high-volume Solana DEX transactions.
          </p>
        </div>

        {/* View Switcher and Actions */}
        <div className="flex items-center gap-3">
          <div className="flex bg-charcoal/80 p-1 rounded-xl border border-white/10 shadow-inner">
            <button
              onClick={() => setActiveSubTab('tracker')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300",
                activeSubTab === 'tracker'
                  ? "bg-neon-purple text-white shadow-[0_0_15px_rgba(127,86,255,0.4)]"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Wallet size={14} /> Wallet Tracker
            </button>
            <button
              onClick={() => setActiveSubTab('alerts')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300",
                activeSubTab === 'alerts'
                  ? "bg-neon-purple text-white shadow-[0_0_15px_rgba(127,86,255,0.4)]"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Activity size={14} /> Live Alerts Feed
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-lime-green/10 hover:bg-lime-green/20 text-lime-green border border-lime-green/30 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Plus size={16} /> Track Wallet
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: WHALE WALLET TRACKER */}
      {activeSubTab === 'tracker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Tracked Whales List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                Tracked Wallets ({trackedWhales.length})
              </h2>
              <span className="text-xs text-neon-purple font-mono">SOL: ${solPrice.toFixed(2)}</span>
            </div>

            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1 custom-scrollbar">
              {trackedWhales.map((whale) => {
                const isSelected = whale.address === selectedWhaleAddress;
                return (
                  <div
                    key={whale.address}
                    onClick={() => setSelectedWhaleAddress(whale.address)}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group",
                      isSelected
                        ? "bg-charcoal-light/80 border-neon-purple/50 shadow-[0_0_20px_rgba(127,86,255,0.15)]"
                        : "bg-charcoal-light/30 border-white/5 hover:border-white/20 hover:bg-charcoal-light/50"
                    )}
                  >
                    {/* Active left indicator */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-purple shadow-[0_0_10px_#7F56FF]" />
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate group-hover:text-neon-purple transition-colors">
                            {whale.label}
                          </span>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border",
                            whale.category === 'exchange' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            whale.category === 'dex-mm' ? "bg-lime-green/10 text-lime-green border-lime-green/20" :
                            "bg-neon-purple/10 text-neon-purple border-neon-purple/20"
                          )}>
                            {whale.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono mt-1">
                          {formatAddress(whale.address, 6)}
                        </p>
                      </div>

                      {whale.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeWhale(whale.address);
                          }}
                          className="p-1.5 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          title="Stop tracking"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {whale.notes && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-1 italic">
                        {whale.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Whale Details & On-Chain Ledger */}
          <div className="lg:col-span-8 space-y-6">
            {/* Whale Header Card */}
            <div className="bg-charcoal-light/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none" />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {selectedWhale.label}
                    </h2>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                      {selectedWhale.category.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-mono text-gray-400">{selectedWhale.address}</span>
                    <button
                      onClick={() => handleCopy(selectedWhale.address)}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Copy full address"
                    >
                      {copiedAddress === selectedWhale.address ? <Check size={14} className="text-lime-green" /> : <Copy size={14} />}
                    </button>
                    <a
                      href={`https://solscan.io/account/${selectedWhale.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neon-purple hover:text-neon-purple-hover text-xs flex items-center gap-1 font-mono transition-colors ml-2"
                    >
                      Solscan <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => fetchSelectedWhaleDetails(selectedWhale.address)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium border border-white/10 transition-colors"
                >
                  <RefreshCw size={14} className={cn(whaleDetails.isLoading && "animate-spin text-neon-purple")} />
                  Refresh Ledger
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-charcoal/80 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">On-Chain SOL Balance</p>
                  <p className="text-2xl font-bold font-mono text-white">
                    {whaleDetails.isLoading ? (
                      <span className="text-gray-500 animate-pulse">Querying RPC...</span>
                    ) : (
                      `${whaleDetails.solBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SOL`
                    )}
                  </p>
                </div>

                <div className="bg-charcoal/80 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Estimated SOL Value</p>
                  <p className="text-2xl font-bold font-mono text-lime-green">
                    {whaleDetails.isLoading ? (
                      <span className="text-gray-500 animate-pulse">Calculating...</span>
                    ) : (
                      formatCurrency(whaleDetails.estimatedValueUsd)
                    )}
                  </p>
                </div>

                <div className="bg-charcoal/80 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recent Transactions</p>
                  <p className="text-2xl font-bold font-mono text-neon-purple">
                    {whaleDetails.transactions.length} Verified
                  </p>
                </div>
              </div>

              {selectedWhale.notes && (
                <div className="mt-4 p-3 rounded-lg bg-charcoal/40 border border-white/5 text-xs text-gray-400">
                  <span className="text-gray-500 font-bold uppercase tracking-wider mr-2">Intel Note:</span>
                  {selectedWhale.notes}
                </div>
              )}
            </div>

            {/* Recent On-Chain Transactions */}
            <div className="bg-charcoal-light/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Activity size={16} className="text-neon-purple" />
                  Live Blockchain Signatures (Solana Mainnet)
                </h3>
                <span className="text-xs text-gray-500 font-mono">
                  Direct RPC Queries ({whaleDetails.transactions.length} records)
                </span>
              </div>

              {whaleDetails.isLoading ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
                  <RefreshCw size={28} className="animate-spin text-neon-purple" />
                  <p className="text-sm">Querying Solana mainnet-beta for real transactions...</p>
                </div>
              ) : whaleDetails.transactions.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p className="text-sm">No recent transactions found on RPC for this wallet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-black/30 border-b border-white/5 text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Signature / TX</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Slot</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Explorer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {whaleDetails.transactions.map((tx) => (
                        <tr key={tx.signature} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">
                            <span className="text-neon-purple hover:underline cursor-pointer" onClick={() => window.open(tx.explorerUrl, '_blank')}>
                              {formatAddress(tx.signature, 8)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-400">
                            {formatRelativeTime(tx.timestamp)}
                          </td>
                          <td className="py-3.5 px-4 text-gray-500">
                            #{tx.slot?.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            {tx.status === 'success' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-lime-green bg-lime-green/10 px-2 py-0.5 rounded border border-lime-green/20">
                                <CheckCircle2 size={12} /> CONFIRMED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded border border-danger/20">
                                <XCircle size={12} /> FAILED
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <a
                              href={tx.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-neon-purple hover:text-white transition-colors inline-flex items-center gap-1"
                            >
                              Solscan <ExternalLink size={12} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LIVE WHALE ALERTS FEED */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-charcoal-light/50 border border-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tracked Transactions</p>
              <p className="text-2xl font-bold font-mono text-white">{whaleAlerts.length} Events</p>
            </div>
            <div className="bg-charcoal-light/50 border border-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Buy Volume Tracked</p>
              <p className="text-2xl font-bold font-mono text-lime-green">{formatCurrency(totalBuyVolume)}</p>
            </div>
            <div className="bg-charcoal-light/50 border border-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sell Volume Tracked</p>
              <p className="text-2xl font-bold font-mono text-danger">{formatCurrency(totalSellVolume)}</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-charcoal-light/40 p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Filter Type:</span>
              <button
                onClick={() => setFilterType('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all",
                  filterType === 'all' ? "bg-white/10 text-white border border-white/20" : "text-gray-400 hover:text-white"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('buy')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1",
                  filterType === 'buy' ? "bg-lime-green/20 text-lime-green border border-lime-green/30" : "text-gray-400 hover:text-lime-green"
                )}
              >
                <TrendingUp size={12} /> Buys
              </button>
              <button
                onClick={() => setFilterType('sell')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1",
                  filterType === 'sell' ? "bg-danger/20 text-danger border border-danger/30" : "text-gray-400 hover:text-danger"
                )}
              >
                <TrendingDown size={12} /> Sells
              </button>
            </div>

            <button
              onClick={refreshWhaleAlerts}
              className="flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white bg-charcoal px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
            >
              <RefreshCw size={14} className={cn(isAlertsLoading && "animate-spin text-neon-purple")} />
              Sync On-Chain Events
            </button>
          </div>

          {/* Alerts Cards List */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="bg-charcoal-light/30 border border-white/5 rounded-2xl p-12 text-center text-gray-400">
                <Activity size={32} className="mx-auto mb-3 text-neon-purple" />
                <p className="text-base font-bold text-white">No whale events matching current filter</p>
                <p className="text-xs text-gray-500 mt-1">Listening to live Solana DEX &amp; institutional wallet activity...</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isBuy = alert.type === 'buy';
                return (
                  <div
                    key={alert.id}
                    className="bg-charcoal-light/50 border border-white/5 rounded-xl p-5 hover:border-neon-purple/40 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                        isBuy ? "bg-lime-green/10 text-lime-green border-lime-green/20" : "bg-danger/10 text-danger border-danger/20"
                      )}>
                        <ArrowRightLeft size={20} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                            isBuy ? "bg-lime-green/10 text-lime-green border-lime-green/20" : "bg-danger/10 text-danger border-danger/20"
                          )}>
                            WHALE {isBuy ? 'BUY' : 'SELL'}
                          </span>
                          <span className="text-gray-400 text-xs font-mono">
                            • {formatRelativeTime(alert.timestamp)}
                          </span>
                          {alert.dex && (
                            <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded font-mono border border-white/5">
                              {alert.dex}
                            </span>
                          )}
                        </div>

                        <div className="text-base font-medium text-white flex items-center gap-2">
                          <span className="font-mono font-bold text-lg text-white">
                            {formatCurrency(alert.amountUsd)}
                          </span>
                          <span className="text-gray-400">in</span>
                          <span className="bg-charcoal px-2.5 py-0.5 rounded-full border border-white/10 text-sm font-bold text-neon-purple">
                            {alert.tokenSymbol}
                          </span>
                          {alert.walletLabel && (
                            <span className="text-xs text-gray-400 ml-2 hidden sm:inline">
                              by <strong className="text-gray-200">{alert.walletLabel}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Wallet Address</p>
                        <p className="text-xs font-mono text-gray-300">
                          {formatAddress(alert.walletAddress, 6)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://solscan.io/tx/${alert.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 text-neon-purple text-xs font-bold border border-neon-purple/30 flex items-center gap-1.5 transition-colors"
                        >
                          Verify TX <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ADD WHALE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-charcoal border border-white/15 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative animate-fade-in-up">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center text-neon-purple">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Track Custom Solana Whale</h3>
                <p className="text-xs text-gray-400">Monitor any address on-chain with real-time balance and transaction alerts.</p>
              </div>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddWhaleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Solana Wallet Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-charcoal-light border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-neon-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Wallet Label / Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Top Memecoin Insider, Whale #4"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-charcoal-light border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-charcoal-light border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon-purple cursor-pointer"
                >
                  <option value="smart-money">Smart Money / Alpha Trader</option>
                  <option value="whale">Megawhale Investor</option>
                  <option value="dex-mm">DEX Market Maker / Liquidity Pool</option>
                  <option value="kol">KOL / Influencer Wallet</option>
                  <option value="exchange">Exchange Cold/Hot Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bought 2M WIF before breakout, tracks pump.fun tokens"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-charcoal-light border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-neon-purple hover:bg-neon-purple-hover text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(127,86,255,0.3)]"
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
