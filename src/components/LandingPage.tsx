// SolPulse Terminal - Landing Page Component
import React from 'react';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Wallet,
  Search,
  Radio,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

export function LandingPage({ onLaunch }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-bg text-txt flex flex-col font-sans selection:bg-blue-500/20 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-border bg-bg/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Activity size={18} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] tracking-tight text-txt">SolPulse</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-border text-txt-2">
                MAINNET
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-txt-3">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span>Solana RPC: Operational</span>
            </div>
            <button
              onClick={onLaunch}
              className="h-8 px-4 rounded bg-blue-500 hover:bg-blue-600 text-white text-[12.5px] font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              Launch Terminal <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border text-[11.5px] text-txt-2 mb-6 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span>Real-time Solana DEX Screener & Whale Tracker</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-txt max-w-3xl leading-[1.15] mb-5">
          High-performance intelligence for Solana DeFi traders.
        </h1>

        {/* Hero Description */}
        <p className="text-[14px] sm:text-[16px] text-txt-2 max-w-2xl leading-relaxed mb-8">
          Stream real-time pool updates via DexScreener, analyze token liquidity and safety with RugCheck, and monitor high-volume whale wallet balances directly on Solana Mainnet.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <button
            onClick={onLaunch}
            className="h-10 px-6 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-[13px] font-medium flex items-center gap-2 transition-colors"
          >
            Open Web Terminal <ChevronRight size={15} />
          </button>
          <a
            href="https://solscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-5 rounded-md bg-surface-2 hover:bg-border border border-border text-txt text-[13px] font-medium flex items-center gap-1.5 transition-colors"
          >
            Solana Explorer <ExternalLink size={13} />
          </a>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
          {/* Feature 1 */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="w-8 h-8 rounded bg-surface-2 border border-border flex items-center justify-center text-blue-400 mb-4">
              <Search size={16} />
            </div>
            <h2 className="text-[14px] font-bold text-txt mb-1.5">Live Coin Screener</h2>
            <p className="text-[12px] text-txt-3 leading-relaxed">
              Real-time prices, 24h volume, liquidity depth, and market caps powered by DexScreener API with contract address lookup and filters.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="w-8 h-8 rounded bg-surface-2 border border-border flex items-center justify-center text-blue-400 mb-4">
              <Wallet size={16} />
            </div>
            <h2 className="text-[14px] font-bold text-txt mb-1.5">Whale Wallet Tracking</h2>
            <p className="text-[12px] text-txt-3 leading-relaxed">
              Track major liquidity providers, exchanges, and smart money wallets. Query real balances and transaction records with multi-RPC fallback.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="w-8 h-8 rounded bg-surface-2 border border-border flex items-center justify-center text-blue-400 mb-4">
              <ShieldCheck size={16} />
            </div>
            <h2 className="text-[14px] font-bold text-txt mb-1.5">Automated Risk Audits</h2>
            <p className="text-[12px] text-txt-3 leading-relaxed">
              Instant contract audits using RugCheck to detect mint authority risks, freeze flags, and dangerous liquidity imbalances before trading.
            </p>
          </div>
        </div>

        {/* Network Metrics Footer Strip */}
        <div className="w-full mt-12 pt-8 border-t border-surface-2 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-[10px] text-txt-3 uppercase tracking-wider font-mono">Cluster</div>
            <div className="text-[14px] font-mono font-bold text-txt mt-0.5">Solana Mainnet</div>
          </div>
          <div>
            <div className="text-[10px] text-txt-3 uppercase tracking-wider font-mono">Avg TPS</div>
            <div className="text-[14px] font-mono font-bold text-green-400 mt-0.5">~2,800 TPS</div>
          </div>
          <div>
            <div className="text-[10px] text-txt-3 uppercase tracking-wider font-mono">DEX Data Source</div>
            <div className="text-[14px] font-mono font-bold text-txt mt-0.5">DexScreener API</div>
          </div>
          <div>
            <div className="text-[10px] text-txt-3 uppercase tracking-wider font-mono">Contract Verification</div>
            <div className="text-[14px] font-mono font-bold text-txt mt-0.5">RugCheck XYZ</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-5 px-6 bg-bg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-txt-3">
          <span>© SolPulse Terminal — Solana Analytics</span>
          <div className="flex items-center gap-4">
            <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="hover:text-txt-2 transition-colors">Solscan</a>
            <a href="https://dexscreener.com" target="_blank" rel="noopener noreferrer" className="hover:text-txt-2 transition-colors">DexScreener</a>
            <a href="https://rugcheck.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-txt-2 transition-colors">RugCheck</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
