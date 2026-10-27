import React, { useState, useEffect, useMemo, useCallback } from 'react';

export interface TokenAvatarProps {
  symbol?: string;
  address?: string;
  imageUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

// Global In-Memory Caches across all component lifecycles to eliminate 404 network thrashing
const resolvedAvatarCache = new Map<string, string>();
const failedUrlCache = new Set<string>();
const permanentlyDeadAddresses = new Set<string>();

// Preload helper to opportunistically fetch avatars in background without blocking UI
export function preloadTokenAvatar(address: string, imageUrl?: string) {
  if (typeof window === 'undefined') return;
  if (permanentlyDeadAddresses.has(address)) return;
  if (resolvedAvatarCache.has(address)) return;

  const testUrls: string[] = [];
  if (imageUrl && !failedUrlCache.has(imageUrl.trim())) {
    testUrls.push(imageUrl.trim());
  }
  const cdnUrl = `https://dd.dexscreener.com/ds-data/tokens/solana/${address}.png`;
  if (!failedUrlCache.has(cdnUrl)) {
    testUrls.push(cdnUrl);
  }

  if (testUrls.length === 0) return;

  const img = new Image();
  img.src = testUrls[0];
  img.onload = () => resolvedAvatarCache.set(address, testUrls[0]);
  img.onerror = () => failedUrlCache.add(testUrls[0]);
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

// Fast deterministic string hash for color stability
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

export const TokenAvatar: React.FC<TokenAvatarProps> = React.memo(({
  symbol = 'TK',
  address,
  imageUrl,
  size = 'md',
  className = '',
  alt
}) => {
  // If this address is already confirmed dead, skip network calls completely
  const isDead = address ? permanentlyDeadAddresses.has(address) : false;

  // Build candidate URLs, pre-filtering any known dead/failed URLs
  const candidates = useMemo(() => {
    if (isDead) return [];

    // If we already resolved a working image for this address, use only that one
    if (address && resolvedAvatarCache.has(address)) {
      return [resolvedAvatarCache.get(address)!];
    }

    const list: string[] = [];
    if (imageUrl && imageUrl.trim()) {
      const clean = imageUrl.trim();
      if (!failedUrlCache.has(clean)) list.push(clean);
    }
    if (address && address.length > 20) {
      // 1. DexScreener official token icon CDN
      const dex = `https://dd.dexscreener.com/ds-data/tokens/solana/${address}.png`;
      if (!failedUrlCache.has(dex)) list.push(dex);

      // 2. Raydium token icons CDN
      const ray = `https://img.raydium.io/icon/${address}.png`;
      if (!failedUrlCache.has(ray)) list.push(ray);

      // 3. Solana Labs token list repository CDN
      const sol = `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${address}/logo.png`;
      if (!failedUrlCache.has(sol)) list.push(sol);
    }
    return list;
  }, [imageUrl, address, isDead]);

  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasExhausted, setHasExhausted] = useState(() => isDead || candidates.length === 0);
  const [isLoaded, setIsLoaded] = useState(() => {
    if (!address) return false;
    return resolvedAvatarCache.has(address);
  });

  // Keep state in sync if candidates change
  useEffect(() => {
    if (isDead || candidates.length === 0) {
      setHasExhausted(true);
      return;
    }
    setCandidateIdx(0);
    setHasExhausted(false);
  }, [candidates, isDead]);

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    const currentSrc = candidates[candidateIdx];
    if (currentSrc && address) {
      resolvedAvatarCache.set(address, currentSrc);
    }
  }, [candidates, candidateIdx, address]);

  const handleImageError = useCallback(() => {
    const failedSrc = candidates[candidateIdx];
    if (failedSrc) {
      failedUrlCache.add(failedSrc);
    }

    if (candidateIdx + 1 < candidates.length) {
      setCandidateIdx(prev => prev + 1);
    } else {
      setHasExhausted(true);
      if (address) {
        permanentlyDeadAddresses.add(address);
      }
    }
  }, [candidates, candidateIdx, address]);

  const sizeCfg = SIZE_MAP[size] || SIZE_MAP.md;
  const cleanSymbol = symbol ? symbol.toUpperCase().slice(0, 2) : 'TK';
  const gradient = getGradientForString(address || symbol || 'SOL');

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 relative flex items-center justify-center border border-border/80 shadow-sm transition-all select-none bg-surface-2 ${sizeCfg.container} ${className}`}
      title={alt || symbol}
    >
      {!hasExhausted && candidates[candidateIdx] ? (
        <img
          src={candidates[candidateIdx]}
          alt={alt || symbol}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
        />
      ) : null}

      {/* Instant graceful fallback while loading or when image is exhausted */}
      {(hasExhausted || !isLoaded) && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center font-bold font-sans tracking-tight`}
        >
          {cleanSymbol}
        </div>
      )}
    </div>
  );
});

TokenAvatar.displayName = 'TokenAvatar';
