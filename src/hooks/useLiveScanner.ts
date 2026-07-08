import { useState, useEffect, useRef } from 'react';
import { Token } from '../types';

export interface LiveToken extends Token {
  rugCheckScore: number;
  detectedAt: Date;
}

export const useLiveScanner = () => {
  const [liveTokens, setLiveTokens] = useState<LiveToken[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [minLiquidity, setMinLiquidity] = useState(1000);
  const scannedAddresses = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isScanning) return;

    let timeoutId: number;
    let isActive = true;

    const scanRoutine = async () => {
      try {
        // 1. Fetch newly created token profiles
        const profileRes = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
        if (!profileRes.ok) throw new Error('Failed to fetch new profiles');
        
        const data = await profileRes.json();
        const solanaTokens = (data || []).filter((t: any) => t.chainId === 'solana');

        for (const token of solanaTokens) {
          if (!isActive) break;
          const address = token.tokenAddress;
          
          if (scannedAddresses.current.has(address)) continue;
          scannedAddresses.current.add(address);

          // Prevent memory leak
          if (scannedAddresses.current.size > 2000) {
            scannedAddresses.current.clear();
          }

          // 2. Fetch Liquidity
          const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
          if (!dexRes.ok) continue;
          
          const dexData = await dexRes.json();
          const pairs = dexData.pairs || [];
          const solPairs = pairs.filter((p: any) => p.chainId === 'solana');
          
          if (solPairs.length === 0) continue;
          
          const bestPair = solPairs.reduce((prev: any, current: any) => 
            (prev.liquidity?.usd || 0) > (current.liquidity?.usd || 0) ? prev : current
          );
          
          const liquidity = bestPair.liquidity?.usd || 0;
          if (liquidity < minLiquidity) continue;

          // 3. Fetch RugCheck
          const rugCheckUrl = import.meta.env.VITE_RUGCHECK_API_URL || 'https://api.rugcheck.xyz';
          const rcRes = await fetch(`${rugCheckUrl}/v1/tokens/${address}/report/summary`);
          if (!rcRes.ok) continue;
          
          const rcData = await rcRes.json();
          const dangerRisks = rcData.risks?.filter((r: any) => r.level === 'danger') || [];
          
          if (dangerRisks.length === 0) {
            // It's safe!
            const newLiveToken: LiveToken = {
              id: address,
              address,
              symbol: bestPair.baseToken?.symbol || 'UNKNOWN',
              name: bestPair.baseToken?.name || 'Unknown Token',
              price: parseFloat(bestPair.priceUsd || '0'),
              priceChange24h: bestPair.priceChange?.h24 || 0,
              volume24h: bestPair.volume?.h24 || 0,
              liquidity,
              marketCap: bestPair.marketCap || bestPair.fdv || 0,
              imageUrl: token.icon || bestPair.info?.imageUrl,
              createdAt: Date.now(),
              rugCheckScore: rcData.score || 0,
              detectedAt: new Date(),
            };

            setLiveTokens(prev => [newLiveToken, ...prev].slice(0, 50)); // Keep last 50
          }
          
          // Sleep a bit to avoid hitting rate limits too hard
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        console.error("Live scanner error:", err);
      }

      if (isActive) {
        timeoutId = window.setTimeout(scanRoutine, 60000); // Re-run every minute
      }
    };

    scanRoutine();

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [isScanning, minLiquidity]);

  return {
    liveTokens,
    isScanning,
    setIsScanning,
    minLiquidity,
    setMinLiquidity,
    clearTokens: () => setLiveTokens([])
  };
};
