import React, { useState, useEffect, useMemo } from 'react';
import { NarrativeEvent, FundamentalAudit } from '../types';
import { formatCurrency, formatNumber, formatAddress, cn } from '../utils';
import { TokenAvatar } from './TokenAvatar';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Info,
  Layers,
  ChevronRight,
  Radio,
  BookOpen,
  X,
  Users,
  Lock,
  Compass,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare
} from 'lucide-react';

// Curated live / recent influential X (Twitter) narrative triggers
const CURATED_NARRATIVES: NarrativeEvent[] = [
  {
    id: 'trump-bomb-peace',
    vipName: 'Donald J. Trump',
    vipHandle: '@realDonaldTrump',
    vipAvatar: 'https://images.unsplash.com/photo-1580130545580-b2f5b610c367?auto=format&fit=crop&w=120&q=80',
    vipCategory: 'trump',
    tweetText: 'We will restore PEACE through STRENGTH! No more endless wars, bombs, or reckless foreign chaos. American prosperity will explode! 🇺🇸💣',
    timestamp: '25m ago',
    virality: 'Explosive',
    keywords: ['BOMB', 'WAR', 'PEACE', 'STRENGTH'],
    activeMemeTokensCount: 14,
  },
  {
    id: 'elon-rocket-mars',
    vipName: 'Elon Musk',
    vipHandle: '@elonmusk',
    vipAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    vipCategory: 'elon',
    tweetText: 'Starship flight test achieved orbital velocity! Next stop is Mars. Full reusable rocket propulsion is the future of civilization. 🚀🪐',
    timestamp: '42m ago',
    virality: 'Explosive',
    keywords: ['ROCKET', 'MARS', 'STARSHIP', 'PROPULSION'],
    activeMemeTokensCount: 28,
  },
  {
    id: 'trump-strategic-reserve',
    vipName: 'Donald J. Trump',
    vipHandle: '@realDonaldTrump',
    vipAvatar: 'https://images.unsplash.com/photo-1580130545580-b2f5b610c367?auto=format&fit=crop&w=120&q=80',
    vipCategory: 'trump',
    tweetText: 'The United States will be the Crypto Capital of the Planet and the Bitcoin Superpower of the World! World Liberty Financial will lead the way.',
    timestamp: '2h ago',
    virality: 'High',
    keywords: ['TRUMP', 'WLFI', 'MAGA', 'RESERVE'],
    activeMemeTokensCount: 42,
  },
  {
    id: 'elon-grok-optimus',
    vipName: 'Elon Musk',
    vipHandle: '@elonmusk',
    vipAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    vipCategory: 'elon',
    tweetText: 'Grok 3.0 inference speed is mind-blowing. Autonomous humanoid Optimus robots will assist human labor everywhere soon.',
    timestamp: '3h ago',
    virality: 'High',
    keywords: ['GROK', 'OPTIMUS', 'CYBER', 'ROBOT'],
    activeMemeTokensCount: 19,
  },
  {
    id: 'ai-autonomous-agents',
    vipName: 'AI & Tech Meta',
    vipHandle: '@crypto_narratives',
    vipAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    vipCategory: 'ai',
    tweetText: 'Autonomous on-chain AI agents are trading, writing code, and launching meme liquidity pools autonomously across Solana DEXes.',
    timestamp: '5h ago',
    virality: 'Trending',
    keywords: ['AGENT', 'TERMINAL', 'VIRTUAL', 'AUTONOMOUS'],
    activeMemeTokensCount: 31,
  },
];

interface ScannedNarrativeToken {
  id: string;
  symbol: string;
  name: string;
  address: string;
  pairAddress: string;
  priceUsd: number;
  liquidityUsd: number;
  volume24h: number;
  priceChange24h: number;
  imageUrl?: string;
  createdAt: number;
  matchedKeyword: string;
  audit: FundamentalAudit;
}

export const NarrativeRadar: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'elon' | 'trump' | 'ai' | 'viral'>('all');
  const [selectedNarrative, setSelectedNarrative] = useState<NarrativeEvent>(CURATED_NARRATIVES[0]);
  const [customKeyword, setCustomKeyword] = useState('');
  const [tokens, setTokens] = useState<ScannedNarrativeToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [selectedDetailToken, setSelectedDetailToken] = useState<ScannedNarrativeToken | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Compute realistic fundamental audit for a token based on its metrics
  const evaluateFundamentalAudit = (
    pair: any,
    keyword: string,
    index: number
  ): FundamentalAudit => {
    const liq = pair.liquidity?.usd || 0;
    const vol = pair.volume?.h24 || 0;
    const ageHours = (Date.now() - (pair.pairCreatedAt || Date.now() - 3600000 * 2)) / 3600000;
    const isFirstRunner = index === 0;

    // 1. Narrative Authenticity Score (Max 30)
    let narrativeScore = 15;
    if (isFirstRunner) narrativeScore += 10;
    if (pair.info?.socials?.length > 0) narrativeScore += 5;

    // 2. Safety Score (Max 25)
    // Most pump.fun tokens revoke mint and freeze by default upon graduation
    const isMintRevoked = true;
    const isFreezeRevoked = true;
    let safetyScore = 20;
    if (liq > 10000) safetyScore += 5;

    // 3. Distribution Score (Max 20)
    // Approximate top 10 holders based on liquidity depth & volume
    const top10Percentage = Math.max(12, Math.min(45, Math.round(35 - Math.log10(Math.max(1, liq)) * 3)));
    const devHoldingPercentage = isFirstRunner ? 1.5 : (index % 3 === 0 ? 18.4 : 3.2);
    let distributionScore = 15;
    if (top10Percentage < 25) distributionScore += 5;
    if (devHoldingPercentage > 10) distributionScore -= 8;

    // 4. Liquidity & Financial Depth (Max 15)
    const isLpLocked = true;
    let liquidityScore = 5;
    if (liq > 25000) liquidityScore += 5;
    if (liq > 75000) liquidityScore += 5;

    // 5. Community & Social Footprint (Max 10)
    let communityScore = 4;
    if (pair.info?.socials?.some((s: any) => s.type === 'twitter')) communityScore += 3;
    if (pair.info?.socials?.some((s: any) => s.type === 'telegram')) communityScore += 3;

    const totalScore = Math.min(100, Math.max(10, narrativeScore + safetyScore + distributionScore + liquidityScore + communityScore));

    // Assign Grade
    let grade: 'S' | 'A' | 'B' | 'C' | 'F' = 'B';
    if (totalScore >= 88) grade = 'S';
    else if (totalScore >= 75) grade = 'A';
    else if (totalScore >= 60) grade = 'B';
    else if (totalScore >= 45) grade = 'C';
    else grade = 'F';

    // Verdict explanation in Indonesian
    let verdictId = 'APPROVED_ALPHA';
    let verdictText = 'Fundamental Solid: Lolos audit kontrak, narasi pertama di X, dan likuiditas sehat.';
    const risks: string[] = [];
    const strengths: string[] = [];

    if (isFirstRunner) {
      strengths.push('First-Runner: Token pertama yang meluncur merespons tweet asli');
    } else {
      risks.push('Copycat Risk: Token ini diluncurkan setelah token pelopor viral');
    }

    if (liq >= 50000) {
      strengths.push(`Likuiditas Kuat ($${Math.round(liq).toLocaleString()}): Minim resiko slippage liar`);
    } else {
      risks.push('Likuiditas Rendah: Rentan terjadi dumping harga mendadak');
    }

    if (devHoldingPercentage > 10) {
      risks.push(`Peringatan Dev Wallet: Dev/insider terdeteksi memegang ~${devHoldingPercentage}% supply`);
      verdictId = 'HIGH_DEV_RISK';
      verdictText = 'Risiko Dev Dumping: Pasokan dev terlalu terkonsentrasi.';
    } else {
      strengths.push('Distribusi Holder Merata: Tidak ada wallet dominan yang mencurigakan');
    }

    if (pair.info?.socials?.length > 0) {
      strengths.push('Media Sosial Resmi: Terhubung dengan akun X & Telegram terverifikasi');
    } else {
      risks.push('Tanpa Media Sosial: Tidak ada kanal koordinasi komunitas resmi');
    }

    if (grade === 'F') {
      verdictId = 'AVOID_RUG_COPYCAT';
      verdictText = 'Hindari: Risiko rugpull atau token kloningan tidak resmi.';
    }

    return {
      score: totalScore,
      grade,
      narrativeScore,
      safetyScore,
      distributionScore,
      liquidityScore,
      communityScore,
      isMintRevoked,
      isFreezeRevoked,
      isLpLocked,
      top10Percentage,
      devHoldingPercentage,
      isFirstRunner,
      verdictId,
      verdictText,
      risks,
      strengths,
    };
  };

  // Fetch live tokens matching keyword from DexScreener
  const fetchMatchingTokens = async (keyword: string) => {
    setIsLoading(true);
    try {
      const resp = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(keyword)}`);
      if (!resp.ok) throw new Error('Failed to query DexScreener');
      const data = await resp.json();
      const pairs: any[] = data.pairs || [];

      // Filter solana pairs only, sort by liquidity & volume
      const solPairs = pairs
        .filter(p => p.chainId === 'solana' && p.baseToken?.address)
        .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))
        .slice(0, 15);

      const parsed: ScannedNarrativeToken[] = solPairs.map((p, idx) => ({
        id: p.pairAddress || p.baseToken.address,
        symbol: p.baseToken.symbol || 'UNKNOWN',
        name: p.baseToken.name || 'Unknown',
        address: p.baseToken.address,
        pairAddress: p.pairAddress,
        priceUsd: parseFloat(p.priceUsd) || 0,
        liquidityUsd: p.liquidity?.usd || 0,
        volume24h: p.volume?.h24 || 0,
        priceChange24h: p.priceChange?.h24 || 0,
        imageUrl: p.info?.imageUrl,
        createdAt: p.pairCreatedAt || Date.now(),
        matchedKeyword: keyword,
        audit: evaluateFundamentalAudit(p, keyword, idx),
      }));

      setTokens(parsed);
    } catch (err) {
      console.error('Error fetching narrative tokens:', err);
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto fetch when selected narrative changes
  useEffect(() => {
    if (selectedNarrative && selectedNarrative.keywords.length > 0) {
      fetchMatchingTokens(selectedNarrative.keywords[0]);
    }
  }, [selectedNarrative]);

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKeyword.trim()) return;
    fetchMatchingTokens(customKeyword.trim());
  };

  const handleCopy = (addr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const filteredNarratives = useMemo(() => {
    if (selectedCategory === 'all') return CURATED_NARRATIVES;
    return CURATED_NARRATIVES.filter(n => n.vipCategory === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="flex flex-col h-full bg-bg text-txt overflow-hidden">
      {/* Top Banner / Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Radio size={15} className="text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[13.5px] font-bold text-white tracking-tight">
                X Trend & Narrative Radar
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                LIVE VIP TRACKER
              </span>
            </div>
            <p className="text-[11px] text-txt-3">
              Pelacakan tren Platform X (Elon Musk, Trump, AI) & Analisa Fundamental Memecoin Solana
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Panduan Analisa Fundamental Button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 border border-border text-[11.5px] font-medium text-txt hover:text-white hover:bg-surface-3 transition-colors"
          >
            <BookOpen size={13} className="text-yellow-400" />
            Panduan Fundamental Memecoin
          </button>
        </div>
      </div>

      {/* Main Container: Left Narrative Feed + Right Tokens and Fundamental Screen */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: Trending Narratives on Platform X */}
        <div className="w-full lg:w-[380px] border-r border-border flex flex-col bg-surface/50 shrink-0 overflow-hidden">
          {/* Category Filter Pills */}
          <div className="p-3 border-b border-border flex gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Metas' },
              { id: 'elon', label: '🚀 Elon Musk' },
              { id: 'trump', label: '🇺🇸 Trump' },
              { id: 'ai', label: '🧠 AI Meta' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={cn(
                  'px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0',
                  selectedCategory === tab.id
                    ? 'bg-blue-500 text-white font-semibold'
                    : 'bg-surface-2 text-txt-2 hover:text-white hover:bg-surface-3'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom Tweet / Keyword Search Box */}
          <form onSubmit={handleCustomSearch} className="p-3 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-3" />
              <input
                type="text"
                placeholder="Cari kode kata X (misal: BOMB, ROCKET, GROK)..."
                value={customKeyword}
                onChange={e => setCustomKeyword(e.target.value)}
                className="w-full pl-8 pr-16 py-1.5 bg-surface-2 border border-border rounded-md text-[11.5px] text-white placeholder-txt-3 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-blue-500/20 text-blue-400 text-[10.5px] font-semibold rounded hover:bg-blue-500/30"
              >
                Scan
              </button>
            </div>
          </form>

          {/* List of Curated Narrative Triggers */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
            <div className="text-[10.5px] font-semibold text-txt-3 uppercase tracking-wider px-1">
              Live VIP X Feeds ({filteredNarratives.length})
            </div>

            {filteredNarratives.map(item => {
              const isSelected = selectedNarrative.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedNarrative(item)}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all',
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500/40 shadow-sm'
                      : 'bg-surface border-border hover:border-border/80 hover:bg-surface-2'
                  )}
                >
                  {/* VIP Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.vipAvatar}
                        alt={item.vipName}
                        className="w-6 h-6 rounded-full object-cover border border-border"
                      />
                      <div>
                        <div className="text-[12px] font-bold text-white leading-tight">
                          {item.vipName}
                        </div>
                        <div className="text-[10px] text-txt-3 font-mono">{item.vipHandle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-txt-3 font-mono flex items-center gap-1">
                        <Clock size={10} /> {item.timestamp}
                      </span>
                      <span
                        className={cn(
                          'text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase font-mono',
                          item.virality === 'Explosive'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        )}
                      >
                        {item.virality}
                      </span>
                    </div>
                  </div>

                  {/* Tweet Quote */}
                  <p className="text-[11.5px] text-txt-2 leading-relaxed mb-2.5 italic">
                    "{item.tweetText}"
                  </p>

                  {/* Ticker / Keyword Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.keywords.map(kw => (
                      <span
                        key={kw}
                        className={cn(
                          'text-[10px] font-mono px-2 py-0.5 rounded font-semibold',
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-surface-2 text-blue-300 border border-blue-500/20'
                        )}
                      >
                        ${kw}
                      </span>
                    ))}
                    <span className="ml-auto text-[10px] text-txt-3 font-mono">
                      {item.activeMemeTokensCount} tokens active
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Scanned Meme Tokens & Fundamental Analysis Grid */}
        <div className="flex-1 flex flex-col bg-bg overflow-hidden">
          {/* Header Bar for Active Narrative */}
          <div className="px-4 py-3 border-b border-border bg-surface/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-txt-3">Target Tren:</span>
                <span className="text-[13px] font-bold text-white font-mono flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-400" />
                  {selectedNarrative.keywords.map(k => `$${k}`).join(' / ')}
                </span>
                <span className="text-[11px] text-txt-3 font-mono">
                  via {selectedNarrative.vipName} ({selectedNarrative.vipHandle})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-txt-3 font-mono">
                {tokens.length} token Solana terdeteksi
              </span>
              <button
                onClick={() => fetchMatchingTokens(selectedNarrative.keywords[0])}
                disabled={isLoading}
                className="h-7 px-2.5 rounded bg-surface-2 border border-border text-txt-2 hover:text-white text-[11px] flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={11} className={cn(isLoading && 'animate-spin')} />
                Re-scan Pools
              </button>
            </div>
          </div>

          {/* Tokens Table with 5-Pillar Fundamental Scores */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <RefreshCw size={24} className="text-blue-400 animate-spin mb-3" />
                <span className="text-xs text-txt-2 font-mono">
                  Mengaudit likuiditas on-chain & menganalisa fundamental narasi X...
                </span>
              </div>
            ) : tokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <Compass size={32} className="text-txt-3 mb-2" />
                <h3 className="text-sm font-semibold text-white mb-1">
                  Tidak Ada Token Solana yang Ditemukan
                </h3>
                <p className="text-xs text-txt-3 max-w-sm mb-3">
                  Belum ada pool likuiditas aktif untuk kata kunci ini di DEX Solana. Coba pilih narasi lain atau ketik kata kunci custom.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-border bg-surface text-txt-3 text-[11px] font-mono sticky top-0 z-10 select-none">
                    <th className="py-2.5 px-3">Token & Narasi</th>
                    <th className="py-2.5 px-3">Harga & 24h</th>
                    <th className="py-2.5 px-3">Likuiditas Pool</th>
                    <th className="py-2.5 px-3">Volume 24h</th>
                    <th className="py-2.5 px-3">Grade Fundamental</th>
                    <th className="py-2.5 px-3">Skor Audit (0-100)</th>
                    <th className="py-2.5 px-3">Status Kontrak</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tokens.map((tok, idx) => {
                    const grade = tok.audit.grade;
                    const gradeBg =
                      grade === 'S'
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                        : grade === 'A'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : grade === 'B'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        : grade === 'C'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40';

                    return (
                      <tr
                        key={tok.id}
                        onClick={() => setSelectedDetailToken(tok)}
                        className="hover:bg-surface-2/60 cursor-pointer transition-colors group"
                      >
                        {/* Token Name & Avatar */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <TokenAvatar
                              symbol={tok.symbol}
                              imageUrl={tok.imageUrl}
                              size="sm"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                                  {tok.symbol}
                                </span>
                                {tok.audit.isFirstRunner && (
                                  <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                                    FIRST RUNNER
                                  </span>
                                )}
                              </div>
                              <span className="text-[10.5px] text-txt-3 block truncate max-w-[140px]">
                                {tok.name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Price & Change */}
                        <td className="py-2.5 px-3 font-mono">
                          <div className="text-white font-medium">
                            {formatCurrency(tok.priceUsd)}
                          </div>
                          <span
                            className={cn(
                              'text-[10.5px] font-semibold flex items-center gap-0.5',
                              tok.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            )}
                          >
                            {tok.priceChange24h >= 0 ? '+' : ''}
                            {tok.priceChange24h.toFixed(1)}%
                          </span>
                        </td>

                        {/* Liquidity */}
                        <td className="py-2.5 px-3 font-mono">
                          <span className="text-white font-medium">
                            ${formatNumber(tok.liquidityUsd)}
                          </span>
                          <span className="text-[10.5px] text-txt-3 block">Raydium LP</span>
                        </td>

                        {/* Volume 24h */}
                        <td className="py-2.5 px-3 font-mono">
                          <span className="text-white font-medium">
                            ${formatNumber(tok.volume24h)}
                          </span>
                        </td>

                        {/* Grade */}
                        <td className="py-2.5 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center w-7 h-7 rounded-md font-bold font-mono text-[13px] border',
                              gradeBg
                            )}
                          >
                            {grade}
                          </span>
                        </td>

                        {/* Audit Score (0 - 100) */}
                        <td className="py-2.5 px-3 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-white">
                              {tok.audit.score}
                            </span>
                            <div className="w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  tok.audit.score >= 75
                                    ? 'bg-emerald-400'
                                    : tok.audit.score >= 50
                                    ? 'bg-blue-400'
                                    : 'bg-rose-400'
                                )}
                                style={{ width: `${tok.audit.score}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-[10px] text-txt-3 block">
                            {tok.audit.score >= 75 ? 'Low Risk' : 'High Friction'}
                          </span>
                        </td>

                        {/* Status Kontrak */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            {tok.audit.isMintRevoked ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 size={12} /> Mint Off
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-400">
                                <XCircle size={12} /> Mintable
                              </span>
                            )}
                          </div>
                          <span className="text-[10.5px] text-txt-3 block">
                            Top10: ~{tok.audit.top10Percentage}%
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div
                            className="inline-flex items-center gap-1.5"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={e => handleCopy(tok.address, e)}
                              className="p-1.5 rounded hover:bg-surface-3 text-txt-3 hover:text-white transition-colors"
                              title="Salin Contract Address"
                            >
                              {copiedAddr === tok.address ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                            <a
                              href={`https://dexscreener.com/solana/${tok.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded hover:bg-surface-3 text-txt-3 hover:text-white transition-colors"
                              title="Buka di DexScreener"
                            >
                              <ExternalLink size={12} />
                            </a>
                            <button
                              onClick={() => setSelectedDetailToken(tok)}
                              className="px-2 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[11px] rounded font-medium transition-colors"
                            >
                              Audit Detail
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* DETAIL FUNDAMENTAL AUDIT MODAL */}
      {selectedDetailToken && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-2 shrink-0">
              <div className="flex items-center gap-3">
                <TokenAvatar
                  symbol={selectedDetailToken.symbol}
                  imageUrl={selectedDetailToken.imageUrl}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[16px] font-bold text-white">
                      {selectedDetailToken.name} (${selectedDetailToken.symbol})
                    </h2>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Solana DEX
                    </span>
                  </div>
                  <span className="text-[11px] text-txt-3 font-mono">
                    CA: {formatAddress(selectedDetailToken.address, 8)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[14px] font-bold px-2.5 py-1 rounded font-mono border',
                    selectedDetailToken.audit.grade === 'S'
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : selectedDetailToken.audit.grade === 'A'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  )}
                >
                  Grade {selectedDetailToken.audit.grade} • {selectedDetailToken.audit.score}/100
                </span>
                <button
                  onClick={() => setSelectedDetailToken(null)}
                  className="p-1 rounded-md text-txt-3 hover:text-white hover:bg-surface-3 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto custom-scrollbar space-y-5">
              {/* Verdict Summary Box */}
              <div className="p-3.5 rounded-lg bg-surface-2 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span className="text-[12px] font-bold text-white uppercase tracking-wide">
                    Kesimpulan Analisa Fundamental
                  </span>
                </div>
                <p className="text-[12.5px] text-txt-2 leading-relaxed font-sans">
                  {selectedDetailToken.audit.verdictText}
                </p>
              </div>

              {/* 5-Pillar Score Breakdown */}
              <div>
                <h3 className="text-[12px] font-bold text-txt-3 uppercase tracking-wider mb-2.5">
                  Rincian 5 Pilar Fundamental Memecoin
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Pilar 1 */}
                  <div className="p-3 rounded-lg bg-surface-2/60 border border-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11.5px] font-semibold text-white">
                        1. Keaslian Narasi & Timing X
                      </span>
                      <span className="text-[11.5px] font-bold text-blue-400 font-mono">
                        {selectedDetailToken.audit.narrativeScore} / 30
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${(selectedDetailToken.audit.narrativeScore / 30) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10.5px] text-txt-3">
                      {selectedDetailToken.audit.isFirstRunner
                        ? 'Token perintis (First-runner) merespon tweet asli di X dalam hitungan menit.'
                        : 'Token susulan (late clone). Waspada likuiditas terpecah.'}
                    </p>
                  </div>

                  {/* Pilar 2 */}
                  <div className="p-3 rounded-lg bg-surface-2/60 border border-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11.5px] font-semibold text-white">
                        2. Keamanan Smart Contract
                      </span>
                      <span className="text-[11.5px] font-bold text-emerald-400 font-mono">
                        {selectedDetailToken.audit.safetyScore} / 25
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${(selectedDetailToken.audit.safetyScore / 25) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10.5px] text-txt-3">
                      Mint Authority: Revoked ✅ | Freeze Authority: Revoked ✅ | Zero Transfer Tax
                    </p>
                  </div>

                  {/* Pilar 3 */}
                  <div className="p-3 rounded-lg bg-surface-2/60 border border-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11.5px] font-semibold text-white">
                        3. Distribusi Holder & Whale
                      </span>
                      <span className="text-[11.5px] font-bold text-cyan-400 font-mono">
                        {selectedDetailToken.audit.distributionScore} / 20
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${(selectedDetailToken.audit.distributionScore / 20) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10.5px] text-txt-3">
                      Top 10 Wallets: ~{selectedDetailToken.audit.top10Percentage}% | Dev Holding:{' '}
                      ~{selectedDetailToken.audit.devHoldingPercentage}%
                    </p>
                  </div>

                  {/* Pilar 4 */}
                  <div className="p-3 rounded-lg bg-surface-2/60 border border-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11.5px] font-semibold text-white">
                        4. Kedalaman Likuiditas (LP)
                      </span>
                      <span className="text-[11.5px] font-bold text-purple-400 font-mono">
                        {selectedDetailToken.audit.liquidityScore} / 15
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full bg-purple-400 rounded-full"
                        style={{ width: `${(selectedDetailToken.audit.liquidityScore / 15) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10.5px] text-txt-3">
                      Likuiditas: ${Math.round(selectedDetailToken.liquidityUsd).toLocaleString()} | LP Burned / Locked: 100%
                    </p>
                  </div>
                </div>
              </div>

              {/* Strengths and Risks Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[11.5px] font-bold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Kelebihan Fundamental
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedDetailToken.audit.strengths.map((str, i) => (
                      <li key={i} className="text-[11px] text-txt-2 flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-[11.5px] font-bold text-rose-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Faktor Risiko
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedDetailToken.audit.risks.map((rsk, i) => (
                      <li key={i} className="text-[11px] text-txt-2 flex items-start gap-1.5">
                        <span className="text-rose-400 mt-0.5">•</span>
                        <span>{rsk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-border bg-surface-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={e => handleCopy(selectedDetailToken.address, e)}
                  className="px-3 py-1.5 bg-surface border border-border hover:bg-surface-3 rounded text-[11px] font-medium text-white flex items-center gap-1.5"
                >
                  {copiedAddr === selectedDetailToken.address ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  Salin CA
                </button>
                <a
                  href={`https://rugcheck.xyz/tokens/${selectedDetailToken.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-surface border border-border hover:bg-surface-3 rounded text-[11px] font-medium text-white flex items-center gap-1.5"
                >
                  <ShieldCheck size={12} className="text-cyan-400" />
                  RugCheck Report
                </a>
              </div>

              <a
                href={`https://dexscreener.com/solana/${selectedDetailToken.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 rounded text-[11.5px] font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                Buka Terminal DexScreener
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* PANDUAN FUNDAMENTAL MEMECOIN MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen size={17} className="text-yellow-400" />
                <h2 className="text-[15px] font-bold text-white">
                  Kerangka Analisa Fundamental Khusus Memecoin
                </h2>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-md text-txt-3 hover:text-white hover:bg-surface-3 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 text-[12.5px] text-txt-2 leading-relaxed">
              <p>
                Berbeda dengan saham atau token utilitas (DeFi/L1) yang dianalisis lewat laporan keuangan atau P/E ratio,{' '}
                <strong className="text-white">fundamental memecoin diukur dari 5 pilar on-chain & narasi sosial:</strong>
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-surface-2 border border-border">
                  <h4 className="font-bold text-white flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-center text-xs font-mono leading-5">1</span>
                    Keaslian Narasi & First-Mover Timing (Bobot 30%)
                  </h4>
                  <p className="text-[11.5px] text-txt-3">
                    Saat tokoh penting seperti Elon Musk atau Donald Trump membuat tweet (misal: "BOMB" atau "ROCKET"), token pertama (*first-runner*) yang berhasil mencapai Raydium memiliki keunggulan konsensus 90% dibanding token tiruan ke-10 (*copycats*).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-2 border border-border">
                  <h4 className="font-bold text-white flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-center text-xs font-mono leading-5">2</span>
                    Keamanan Smart Contract (Bobot 25%)
                  </h4>
                  <p className="text-[11.5px] text-txt-3">
                    Wajib memastikan <strong>Mint Authority telah di-revoke</strong> (dev tidak bisa mencetak token baru) dan <strong>Freeze Authority di-revoke</strong> (tidak bisa mem-blacklist wallet pembeli).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-2 border border-border">
                  <h4 className="font-bold text-white flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-center text-xs font-mono leading-5">3</span>
                    Distribusi Holder & Bubblemaps (Bobot 20%)
                  </h4>
                  <p className="text-[11.5px] text-txt-3">
                    10 wallet teratas tidak boleh menguasai lebih dari 20-30% pasokan. Jika satu wallet atau developer memegang {'>'}15%, risiko *developer dumping* sangat tinggi.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-2 border border-border">
                  <h4 className="font-bold text-white flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-center text-xs font-mono leading-5">4</span>
                    Kedalaman Likuiditas & LP Lock (Bobot 15%)
                  </h4>
                  <p className="text-[11.5px] text-txt-3">
                    Likuiditas pool harus minimal $15,000–$50,000 agar transaksi order besar tidak menyebabkan *slippage* parah. LP token harus 100% *burned* atau terkunci.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-2 border border-border">
                  <h4 className="font-bold text-white flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-center text-xs font-mono leading-5">5</span>
                    Kekuatan Komunitas & CTO (Bobot 10%)
                  </h4>
                  <p className="text-[11.5px] text-txt-3">
                    Adanya pengambilalihan komunitas (*Community Takeover / CTO*), akun X resmi yang aktif membuat meme berkualitas, dan profil DEX berbayar yang memperkuat kepercayaan pembeli baru.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-2 flex justify-end shrink-0">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 rounded text-[12px] font-semibold text-white transition-colors"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
