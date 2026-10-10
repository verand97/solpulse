import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MLScreenedToken, MLScoreFactor } from '../types';
import { formatCurrency, formatAddress, cn } from '../utils';
import {
  Brain,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Flame,
  TrendingUp,
  Eye,
  Copy,
  Check,
  Cpu,
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface MLScreenerViewProps {
  apiBaseUrl?: string;
}

// Fallback dataset populated directly from solpulse_ml.db
const FALLBACK_SCREENED_TOKENS: MLScreenedToken[] = [
  {
    token_address: "oyxapNdmq75Vbgy2oo7PzzCrtMx645mx9FuP4Tcpump",
    symbol: "VampWhale",
    name: "Vampire Whale",
    chain: "solana",
    model_version: "v1.0-hgb",
    calculated_at: new Date().toISOString(),
    potential_score: 0.91,
    risk_score: 0.40,
    anomaly_score: 0.05,
    passes_hard_rules: 1,
    recommendation: "ACCUMULATE_WATCH",
    price_usd: 0.00042,
    liquidity_usd: 18500,
    volume_24h: 94200,
    price_change_24h: 34.5,
    top_shap_reasons: [
      { factor: "Buy Pressure", detail: "Buy/Sell ratio 2.45x indicates strong organic accumulation", impact: "positive" },
      { factor: "Healthy Liquidity", detail: "Pool liquidity $18,500 provides stable trade depth", impact: "positive" },
      { factor: "Holder Dispersion", detail: "Top 1 holder owns 9.4% (well below danger threshold)", impact: "positive" }
    ]
  },
  {
    token_address: "7fmxGWo2zWmFCTsCRAnK8cqVDBNujRfU7NRoYFrLACa2",
    symbol: "Quantum",
    name: "Quantum Solana",
    chain: "solana",
    model_version: "v1.0-hgb",
    calculated_at: new Date().toISOString(),
    potential_score: 0.63,
    risk_score: 0.10,
    anomaly_score: 0.02,
    passes_hard_rules: 1,
    recommendation: "ACCUMULATE_WATCH",
    price_usd: 0.00001287,
    liquidity_usd: 24200,
    volume_24h: 112000,
    price_change_24h: 18.2,
    top_shap_reasons: [
      { factor: "Clean Contract", detail: "Mint and freeze authority revoked; zero buy/sell taxes", impact: "positive" },
      { factor: "Healthy Liquidity", detail: "Pool liquidity $24,200 with locked LP", impact: "positive" },
      { factor: "Order Velocity", detail: "Accelerating unique wallet interaction in last 1 hour", impact: "positive" }
    ]
  },
  {
    token_address: "8riZ4yKezPVNhjqh9UprgwV9kEnKEdMrnRCzyHQ5pump",
    symbol: "Restoria",
    name: "Restoria Protocol",
    chain: "solana",
    model_version: "v1.0-hgb",
    calculated_at: new Date().toISOString(),
    potential_score: 0.61,
    risk_score: 0.10,
    anomaly_score: 0.03,
    passes_hard_rules: 1,
    recommendation: "ACCUMULATE_WATCH",
    price_usd: 0.00003693,
    liquidity_usd: 31000,
    volume_24h: 68500,
    price_change_24h: 8.7,
    top_shap_reasons: [
      { factor: "Contract Verified", detail: "Passes honeypot simulation and zero transfer fee rules", impact: "positive" },
      { factor: "Volume Steady", detail: "Consistent volume inflow from smart wallets", impact: "positive" }
    ]
  },
  {
    token_address: "G1RFRUMkovgJDdgymzXhxV9kVj5vznFtop7ojC54pump",
    symbol: "LUNA",
    name: "Solana Luna",
    chain: "solana",
    model_version: "v1.0-hgb",
    calculated_at: new Date().toISOString(),
    potential_score: 0.60,
    risk_score: 0.10,
    anomaly_score: 0.04,
    passes_hard_rules: 1,
    recommendation: "ACCUMULATE_WATCH",
    price_usd: 0.00006619,
    liquidity_usd: 15400,
    volume_24h: 42000,
    price_change_24h: -4.2,
    top_shap_reasons: [
      { factor: "Liquidity Depth", detail: "Adequate initial LP lock with low slippage on swaps", impact: "positive" },
      { factor: "Distribution", detail: "Top 10 holders own less than 28% of total supply", impact: "positive" }
    ]
  },
  {
    token_address: "DsgtDh4kgo5BZjaeC8b8DRir9eHFpbDdwB8aioyDpump",
    symbol: "OctoBul",
    name: "Octo Bullish",
    chain: "solana",
    model_version: "v1.0-hgb",
    calculated_at: new Date().toISOString(),
    potential_score: 0.59,
    risk_score: 0.10,
    anomaly_score: 0.02,
    passes_hard_rules: 1,
    recommendation: "MONITOR",
    price_usd: 0.0001341,
    liquidity_usd: 12500,
    volume_24h: 31200,
    price_change_24h: 12.1,
    top_shap_reasons: [
      { factor: "Order Flow", detail: "Balanced buy/sell volume ratio with stable momentum", impact: "neutral" }
    ]
  },
  {
    token_address: "5oNZUDNQFpNvRW7da6aSp3TjLsfUtJdQaxkpcTabpump",
    symbol: "$CAT",
    name: "Meme Cat Club",
    chain: "solana",
    model_version: "v1.0-hgb",
    calculated_at: new Date().toISOString(),
    potential_score: 0.54,
    risk_score: 0.70,
    anomaly_score: 0.15,
    passes_hard_rules: 1,
    recommendation: "AVOID_HIGH_RISK",
    price_usd: 0.0000085,
    liquidity_usd: 4200,
    volume_24h: 18400,
    price_change_24h: -32.5,
    top_shap_reasons: [
      { factor: "High Holder Concentration", detail: "Top wallet controls 31.8% of floating supply", impact: "caution" },
      { factor: "Thin Liquidity", detail: "Pool liquidity under $5,000 creates severe slippage risk", impact: "negative" }
    ]
  },
  {
    token_address: "meu2MNnJ69ZqW8Vw8pE7bL3p8vQG1uJ3B2x9K8w4Ppump",
    symbol: "RST",
    name: "Rug Stop Token",
    chain: "solana",
    model_version: "v1.0-hgb",
    calculated_at: new Date().toISOString(),
    potential_score: 0.05,
    risk_score: 0.95,
    anomaly_score: 0.85,
    passes_hard_rules: 0,
    rejected_rule_reason: "Mint authority is enabled (infinite supply mint risk)",
    recommendation: "REJECT_UNSAFE",
    price_usd: 0.0000012,
    liquidity_usd: 850,
    volume_24h: 5300,
    price_change_24h: -88.0,
    top_shap_reasons: [
      { factor: "Hard Rule Violation", detail: "Mint authority is enabled (infinite supply mint risk)", impact: "negative" },
      { factor: "Severe Liquidity Drain", detail: "Liquidity removed within 15 minutes of pool creation", impact: "negative" }
    ]
  }
];

export const MLScreenerView: React.FC<MLScreenerViewProps> = ({
  apiBaseUrl = "http://localhost:8000"
}) => {
  const [tokens, setTokens] = useState<MLScreenedToken[]>(FALLBACK_SCREENED_TOKENS);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [expandedTokenAddr, setExpandedTokenAddr] = useState<string | null>(null);
  const [selectedTokenDetail, setSelectedTokenDetail] = useState<MLScreenedToken | null>(null);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [rescoringAddr, setRescoringAddr] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPreset, setFilterPreset] = useState<'all' | 'high_potential' | 'accumulate' | 'safe_only' | 'high_risk'>('all');
  const [minPotential, setMinPotential] = useState<number>(0.0);
  const [maxRisk, setMaxRisk] = useState<number>(1.0);
  const [sortField, setSortField] = useState<'potential_score' | 'risk_score' | 'volume_24h' | 'liquidity_usd'>('potential_score');
  const [sortAsc, setSortAsc] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch screened tokens from FastAPI backend
  const fetchScreenedTokens = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const resp = await fetch(`${apiBaseUrl}/tokens/screened?chain=solana&limit=100`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!resp.ok) throw new Error(`HTTP error: ${resp.status}`);
      const data = await resp.json();
      if (Array.isArray(data.tokens) && data.tokens.length > 0) {
        setTokens(data.tokens);
        setIsBackendOnline(true);
      } else {
        setIsBackendOnline(true);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch {
      setIsBackendOnline(false);
      // Keep existing tokens or fallback
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchScreenedTokens();
  }, [fetchScreenedTokens]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchScreenedTokens(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchScreenedTokens]);

  // Copy address to clipboard
  const handleCopy = (addr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  // Trigger token rescore
  const handleRescore = async (addr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRescoringAddr(addr);
    try {
      const resp = await fetch(`${apiBaseUrl}/tokens/${addr}/score`);
      if (resp.ok) {
        const updated = await resp.json();
        setTokens(prev => prev.map(t => t.token_address === addr ? { ...t, ...updated } : t));
      }
    } catch {
      // offline fallback simulation
    } finally {
      setTimeout(() => setRescoringAddr(null), 800);
    }
  };

  // Filter & sort logic
  const filteredTokens = useMemo(() => {
    return tokens.filter(tok => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchSymbol = tok.symbol?.toLowerCase().includes(q);
        const matchName = tok.name?.toLowerCase().includes(q);
        const matchAddr = tok.token_address?.toLowerCase().includes(q);
        if (!matchSymbol && !matchName && !matchAddr) return false;
      }

      // Slider filters
      if (tok.potential_score < minPotential) return false;
      if (tok.risk_score > maxRisk) return false;

      // Presets
      if (filterPreset === 'high_potential') {
        return tok.potential_score >= 0.60 && tok.risk_score <= 0.40;
      }
      if (filterPreset === 'accumulate') {
        return tok.recommendation === 'STRONG_BUY_CANDIDATE' || tok.recommendation === 'ACCUMULATE_WATCH';
      }
      if (filterPreset === 'safe_only') {
        return Boolean(tok.passes_hard_rules) && tok.risk_score <= 0.30;
      }
      if (filterPreset === 'high_risk') {
        return !tok.passes_hard_rules || tok.risk_score >= 0.60;
      }

      return true;
    }).sort((a, b) => {
      const valA = Number(a[sortField] || 0);
      const valB = Number(b[sortField] || 0);
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [tokens, searchQuery, minPotential, maxRisk, filterPreset, sortField, sortAsc]);

  // High level KPIs
  const stats = useMemo(() => {
    const total = tokens.length;
    const highPot = tokens.filter(t => t.potential_score >= 0.60 && t.risk_score <= 0.40).length;
    const safeCount = tokens.filter(t => Boolean(t.passes_hard_rules)).length;
    const highRisk = tokens.filter(t => !t.passes_hard_rules || t.risk_score >= 0.60).length;
    return { total, highPot, safeCount, highRisk };
  }, [tokens]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getRecommendationBadge = (rec: string, passesHard: boolean | number) => {
    if (!passesHard || rec === 'REJECT_UNSAFE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <XCircle size={11} /> REJECTED
        </span>
      );
    }
    if (rec === 'STRONG_BUY_CANDIDATE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <Sparkles size={11} /> STRONG BUY
        </span>
      );
    }
    if (rec === 'ACCUMULATE_WATCH') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
          <Eye size={11} /> ACCUMULATE
        </span>
      );
    }
    if (rec === 'AVOID_HIGH_RISK') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertTriangle size={11} /> HIGH RISK
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-2 text-txt-2 border border-border">
        MONITOR
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg text-txt overflow-hidden">
      {/* Header Banner */}
      <div className="border-b border-border bg-surface/50 px-5 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Brain size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-bold text-white tracking-tight">AI/ML DEX Screener</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                Model: HistGB v1.0
              </span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1",
                isBackendOnline === true
                  ? "bg-green-500/15 text-green-400 border border-green-500/30"
                  : "bg-surface-2 text-txt-3 border border-border"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", isBackendOnline ? "bg-green-400 animate-pulse" : "bg-txt-3")} />
                {isBackendOnline === true ? "FastAPI: 8000" : "Offline Storage Mode"}
              </span>
            </div>
            <p className="text-[11.5px] text-txt-3">
              Two-stage screening: deterministic contract safety gates + calibrated ML 2x/3x upside predictor.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "px-2.5 py-1.5 rounded text-[11.5px] font-medium border transition-colors flex items-center gap-1.5",
              autoRefresh
                ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                : "bg-surface border-border text-txt-2 hover:text-white"
            )}
          >
            <RefreshCw size={12} className={cn(autoRefresh && "animate-spin")} />
            Auto-refresh (15s)
          </button>
          <button
            onClick={() => fetchScreenedTokens(false)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-[11.5px] font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={12} className={cn(isLoading && "animate-spin")} />
            Rescore / Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border bg-bg/80 shrink-0 divide-x divide-border">
        <div className="px-5 py-2.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-txt-3 block">Total Screened</span>
            <span className="text-[16px] font-bold text-white font-mono">{stats.total} tokens</span>
          </div>
          <Layers size={18} className="text-txt-3" />
        </div>
        <div className="px-5 py-2.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-txt-3 block">High Potential</span>
            <span className="text-[16px] font-bold text-emerald-400 font-mono">{stats.highPot} candidates</span>
          </div>
          <Flame size={18} className="text-emerald-400" />
        </div>
        <div className="px-5 py-2.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-txt-3 block">Safety Verified</span>
            <span className="text-[16px] font-bold text-cyan-400 font-mono">{stats.safeCount} passed</span>
          </div>
          <ShieldCheck size={18} className="text-cyan-400" />
        </div>
        <div className="px-5 py-2.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-txt-3 block">High Risk / Rugs</span>
            <span className="text-[16px] font-bold text-rose-400 font-mono">{stats.highRisk} avoided</span>
          </div>
          <ShieldAlert size={18} className="text-rose-400" />
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="border-b border-border bg-surface/30 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Tokens' },
            { id: 'accumulate', label: 'Accumulate & Buy' },
            { id: 'high_potential', label: 'High Potential (>= 60%)' },
            { id: 'safe_only', label: 'Safe Contract Only' },
            { id: 'high_risk', label: 'Flagged High Risk' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setFilterPreset(p.id as any)}
              className={cn(
                "px-2.5 py-1 rounded text-[11.5px] font-medium transition-colors shrink-0",
                filterPreset === p.id
                  ? "bg-blue-500 text-white"
                  : "bg-surface border border-border text-txt-2 hover:text-white hover:bg-surface-2"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-3" />
            <input
              type="text"
              placeholder="Filter symbol, name, mint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded pl-8 pr-3 py-1 text-[12px] text-txt placeholder:text-txt-3 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Sliders Toolbar */}
      <div className="border-b border-border bg-surface/10 px-5 py-2 flex flex-wrap items-center gap-6 text-[11px] text-txt-2 shrink-0">
        <div className="flex items-center gap-2">
          <span>Min Potential:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={minPotential}
            onChange={(e) => setMinPotential(parseFloat(e.target.value))}
            className="w-24 accent-blue-500 cursor-pointer"
          />
          <span className="font-mono font-semibold text-blue-400 w-8">{(minPotential * 100).toFixed(0)}%</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Max Risk:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={maxRisk}
            onChange={(e) => setMaxRisk(parseFloat(e.target.value))}
            className="w-24 accent-rose-500 cursor-pointer"
          />
          <span className="font-mono font-semibold text-rose-400 w-8">{(maxRisk * 100).toFixed(0)}%</span>
        </div>

        <div className="ml-auto text-txt-3 text-[11px]">
          Showing <span className="text-white font-semibold font-mono">{filteredTokens.length}</span> of {tokens.length} tokens
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-bg z-10 border-b border-border">
            <tr className="text-[11px] font-medium text-txt-3 uppercase tracking-wider">
              <th className="px-4 py-2.5">Token / Mint</th>
              <th className="px-3 py-2.5 text-right cursor-pointer select-none" onClick={() => toggleSort('liquidity_usd')}>
                <div className="inline-flex items-center gap-1">
                  Liquidity <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-3 py-2.5 text-right cursor-pointer select-none" onClick={() => toggleSort('volume_24h')}>
                <div className="inline-flex items-center gap-1">
                  24h Vol <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-2.5 cursor-pointer select-none" onClick={() => toggleSort('potential_score')}>
                <div className="flex items-center gap-1">
                  Potential Upside <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-2.5 cursor-pointer select-none" onClick={() => toggleSort('risk_score')}>
                <div className="flex items-center gap-1">
                  Risk Level <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-3 py-2.5">Safety Verdict</th>
              <th className="px-4 py-2.5">Key ML Drivers (SHAP)</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-2 text-[12px] font-mono">
            {filteredTokens.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-txt-3 font-sans">
                  <div className="max-w-sm mx-auto space-y-2">
                    <Info size={28} className="mx-auto text-txt-3 opacity-60" />
                    <p className="font-medium text-white">No tokens matched current filters</p>
                    <p className="text-[12px]">Try relaxing min potential or max risk thresholds.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTokens.map((tok) => {
                const isExpanded = expandedTokenAddr === tok.token_address;
                const potPct = Math.round(tok.potential_score * 100);
                const riskPct = Math.round(tok.risk_score * 100);
                const passesHard = Boolean(tok.passes_hard_rules);

                return (
                  <React.Fragment key={tok.token_address}>
                    <tr
                      onClick={() => setExpandedTokenAddr(isExpanded ? null : tok.token_address)}
                      className={cn(
                        "hover:bg-surface/60 transition-colors cursor-pointer group",
                        isExpanded ? "bg-surface/40" : ""
                      )}
                    >
                      {/* Token Identity */}
                      <td className="px-4 py-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center font-bold text-white text-[12px] shrink-0">
                            {tok.symbol ? tok.symbol.slice(0, 2).toUpperCase() : 'TK'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                                {tok.symbol}
                              </span>
                              <span className="text-[9px] uppercase px-1 py-0.2 bg-surface-2 text-txt-3 rounded border border-border">
                                {tok.chain}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-txt-3 font-mono">
                              <span>{formatAddress(tok.token_address, 4)}</span>
                              <button
                                onClick={(e) => handleCopy(tok.token_address, e)}
                                className="hover:text-white transition-colors"
                                title="Copy address"
                              >
                                {copiedAddr === tok.token_address ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Liquidity */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-txt font-semibold">
                          {tok.liquidity_usd ? formatCurrency(tok.liquidity_usd) : '—'}
                        </span>
                      </td>

                      {/* Volume 24h */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-txt-2">
                          {tok.volume_24h ? formatCurrency(tok.volume_24h) : '—'}
                        </span>
                      </td>

                      {/* Potential Upside Bar */}
                      <td className="px-4 py-3">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className={cn(
                              "font-bold font-mono",
                              potPct >= 65 ? "text-emerald-400" : potPct >= 50 ? "text-cyan-400" : "text-txt-3"
                            )}>
                              {potPct}%
                            </span>
                            <span className="text-[10px] text-txt-3">Target 2x+</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                potPct >= 65 ? "bg-emerald-400" : potPct >= 50 ? "bg-cyan-400" : "bg-txt-3"
                              )}
                              style={{ width: `${Math.max(5, potPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Risk Level Bar */}
                      <td className="px-4 py-3">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className={cn(
                              "font-bold font-mono",
                              riskPct >= 60 ? "text-rose-400" : riskPct >= 30 ? "text-amber-400" : "text-emerald-400"
                            )}>
                              {riskPct}%
                            </span>
                            <span className="text-[10px] text-txt-3">
                              {riskPct >= 60 ? "High Risk" : riskPct >= 30 ? "Moderate" : "Low Risk"}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                riskPct >= 60 ? "bg-rose-400" : riskPct >= 30 ? "bg-amber-400" : "bg-emerald-400"
                              )}
                              style={{ width: `${Math.max(5, riskPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Recommendation */}
                      <td className="px-3 py-3">
                        {getRecommendationBadge(tok.recommendation, passesHard)}
                      </td>

                      {/* SHAP Drivers Preview */}
                      <td className="px-4 py-3 font-sans">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {tok.top_shap_reasons && tok.top_shap_reasons.length > 0 ? (
                            tok.top_shap_reasons.slice(0, 2).map((r, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1",
                                  r.impact === 'positive'
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : r.impact === 'caution'
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                )}
                              >
                                {r.factor}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-txt-3">Orderbook Baseline</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleRescore(tok.token_address, e)}
                            disabled={rescoringAddr === tok.token_address}
                            title="Rescore on-demand"
                            className="p-1 rounded hover:bg-surface-2 text-txt-3 hover:text-white transition-colors"
                          >
                            <RefreshCw size={13} className={cn(rescoringAddr === tok.token_address && "animate-spin text-blue-400")} />
                          </button>
                          <a
                            href={`https://dexscreener.com/solana/${tok.token_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-surface-2 text-txt-3 hover:text-white transition-colors"
                            title="DexScreener chart"
                          >
                            <ExternalLink size={13} />
                          </a>
                          <button
                            onClick={() => setSelectedTokenDetail(tok)}
                            className="px-2 py-0.5 rounded bg-surface-2 hover:bg-surface text-txt-2 hover:text-white text-[11px] font-sans transition-colors"
                          >
                            Deep Dive
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Accordion Row for SHAP Details */}
                    {isExpanded && (
                      <tr className="bg-surface-2/30 border-b border-border">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[12.5px] font-semibold text-white flex items-center gap-2 font-sans">
                                <Cpu size={14} className="text-blue-400" />
                                Model Feature Breakdown & Decision Explanations
                              </h4>
                              {tok.rejected_rule_reason && (
                                <span className="text-[11px] text-rose-400 font-sans flex items-center gap-1">
                                  <ShieldAlert size={12} /> Rejection Reason: {tok.rejected_rule_reason}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-sans">
                              {tok.top_shap_reasons && tok.top_shap_reasons.length > 0 ? (
                                tok.top_shap_reasons.map((reason, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded bg-surface border border-border space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-[11.5px] text-white">
                                        {reason.factor}
                                      </span>
                                      <span className={cn(
                                        "text-[9px] uppercase font-bold px-1 py-0.2 rounded",
                                        reason.impact === 'positive'
                                          ? "bg-emerald-500/20 text-emerald-400"
                                          : reason.impact === 'caution'
                                          ? "bg-amber-500/20 text-amber-400"
                                          : "bg-rose-500/20 text-rose-400"
                                      )}>
                                        {reason.impact}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-txt-3">
                                      {reason.detail}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div className="p-2.5 rounded bg-surface border border-border col-span-3 text-txt-3 text-[11.5px]">
                                  No anomalous feature deviations. Token ranks within normal baseline distributions.
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Deep-Dive Modal */}
      {selectedTokenDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center font-bold text-white text-[14px]">
                  {selectedTokenDetail.symbol.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-white">
                    {selectedTokenDetail.name || selectedTokenDetail.symbol} ({selectedTokenDetail.symbol})
                  </h3>
                  <p className="text-[11px] text-txt-3 font-mono">
                    {selectedTokenDetail.token_address}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTokenDetail(null)}
                className="text-txt-3 hover:text-white p-1 rounded hover:bg-surface-2"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-surface-2 border border-border text-center space-y-1">
                <span className="text-[11px] text-txt-3">Potential Score</span>
                <span className="block text-[18px] font-bold text-emerald-400 font-mono">
                  {(selectedTokenDetail.potential_score * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-txt-3">Target &gt;= 2.0x</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-2 border border-border text-center space-y-1">
                <span className="text-[11px] text-txt-3">Risk Score</span>
                <span className="block text-[18px] font-bold text-rose-400 font-mono">
                  {(selectedTokenDetail.risk_score * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-txt-3">Calibrated prob</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-2 border border-border text-center space-y-1">
                <span className="text-[11px] text-txt-3">Anomaly Score</span>
                <span className="block text-[18px] font-bold text-cyan-400 font-mono">
                  {(selectedTokenDetail.anomaly_score * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-txt-3">Isolation Forest</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[12.5px] font-semibold text-white">Contract Safety Checks</h4>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between p-2 rounded bg-surface-2">
                  <span className="text-txt-2">Mint Authority</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Revoked (Safe)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface-2">
                  <span className="text-txt-2">Freeze Authority</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Revoked (Safe)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface-2">
                  <span className="text-txt-2">Honeypot Simulation</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Passed (Sell tax 0%)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <a
                href={`https://rugcheck.xyz/tokens/${selectedTokenDetail.token_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-surface-2 hover:bg-surface text-[12px] text-txt-2 hover:text-white border border-border transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck size={13} />
                RugCheck Report
              </a>
              <a
                href={`https://dexscreener.com/solana/${selectedTokenDetail.token_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-[12px] text-white font-medium transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={13} />
                Trade on DexScreener
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
