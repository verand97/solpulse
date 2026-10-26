import React, { useState, useEffect } from 'react';

export interface TokenAvatarProps {
  symbol?: string;
  address?: string;
  imageUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

// Curated vibrant modern crypto gradient palettes
const GRADIENTS = [
  'from-violet-600 to-indigo-600 text-violet-100',
  'from-emerald-500 to-teal-600 text-emerald-100',
  'from-blue-600 to-cyan-500 text-blue-100',
  'from-amber-500 to-orange-600 text-amber-100',
  'from-rose-500 to-pink-600 text-rose-100',
  'from-purple-500 to-pink-500 text-purple-100',
  'from-teal-500 to-emerald-600 text-teal-100',
  'from-fuchsia-600 to-violet-600 text-fuchsia-100',
];

// Simple deterministic hash
function getGradientForString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[idx];
}

const SIZE_MAP = {
  xs: { container: 'w-5 h-5 text-[9px]', icon: 'w-5 h-5' },
  sm: { container: 'w-6 h-6 text-[10px]', icon: 'w-6 h-6' },
  md: { container: 'w-8 h-8 text-[12px]', icon: 'w-8 h-8' },
  lg: { container: 'w-10 h-10 text-[14px]', icon: 'w-10 h-10' },
  xl: { container: 'w-14 h-14 text-[18px]', icon: 'w-14 h-14' },
};

export const TokenAvatar: React.FC<TokenAvatarProps> = ({
  symbol = 'TK',
  address,
  imageUrl,
  size = 'md',
  className = '',
  alt
}) => {
  // Memoize candidates list to avoid re-allocating arrays on every table cell re-render
  const candidates = React.useMemo(() => {
    const list: string[] = [];
    if (imageUrl && imageUrl.trim()) {
      list.push(imageUrl.trim());
    }
    if (address && address.length > 20) {
      // 1. DexScreener official token icon CDN
      list.push(`https://dd.dexscreener.com/ds-data/tokens/solana/${address}.png`);
      // 2. Solana Labs token list repository CDN
      list.push(`https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${address}/logo.png`);
      // 3. Raydium token icons CDN
      list.push(`https://img.raydium.io/icon/${address}.png`);
    }
    return list;
  }, [imageUrl, address]);

  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasExhausted, setHasExhausted] = useState(() => candidates.length === 0);

  // Reset state when imageUrl or address changes
  useEffect(() => {
    setCandidateIdx(0);
    setHasExhausted(candidates.length === 0);
  }, [candidates]);

  const handleImageError = () => {
    if (candidateIdx + 1 < candidates.length) {
      setCandidateIdx(prev => prev + 1);
    } else {
      setHasExhausted(true);
    }
  };

  const sizeCfg = SIZE_MAP[size] || SIZE_MAP.md;
  const cleanSymbol = symbol ? symbol.toUpperCase().slice(0, 2) : 'TK';
  const gradient = getGradientForString(address || symbol || 'SOL');

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-border/80 shadow-sm transition-all select-none ${sizeCfg.container} ${className}`}
      title={alt || symbol}
    >
      {!hasExhausted && candidates[candidateIdx] ? (
        <img
          src={candidates[candidateIdx]}
          alt={alt || symbol}
          onError={handleImageError}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold font-sans tracking-tight`}
        >
          {cleanSymbol}
        </div>
      )}
    </div>
  );
};
