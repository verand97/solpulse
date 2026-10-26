import { useState, useEffect, useRef } from 'react';
import { Token } from '../types';

export interface LiveToken extends Token {
  rugCheckScore: number;
  detectedAt: Date;
  mlPotential?: number;
  mlRisk?: number;
  mlRecommendation?: string;
  shapReasons?: Array<{ factor: string; detail: string; impact: string }>;
}

export const useLiveScanner = () => {
  const [liveTokens, setLiveTokens] = useState<LiveToken[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [minLiquidity, setMinLiquidity] = useState(1000);
  const scannedAddresses = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isScanning) return;

    let timeoutId: number;
    const controller = new AbortController();

    const scanRoutine = async () => {
      try {
        if (controller.signal.aborted) return;
        const dexBaseUrl = import.meta.env.VITE_DEXSCREENER_API_URL || 'https://api.dexscreener.com';
        const profileRes = await fetch(`${dexBaseUrl}/token-profiles/latest/v1`, {
          signal: controller.signal
        });
        if (!profileRes.ok) throw new Error('Failed to fetch new profiles');
        
        const data = await profileRes.json();
        const solanaTokens = (data || []).filter((t: any) => t.chainId === 'solana');

        for (const token of solanaTokens) {
          if (controller.signal.aborted) break;
          const address = token.tokenAddress;
          if (!address) continue;
          
          if (scannedAddresses.current.has(address)) continue;

          // 2. Fetch Liquidity
          const dexRes = await fetch(`${dexBaseUrl}/latest/dex/tokens/${address}`, {
            signal: controller.signal
          });
          if (!dexRes.ok) continue;
          
          const dexData = await dexRes.json();
          const pairs = dexData.pairs || [];
          const solPairs = pairs.filter((p: any) => p.chainId === 'solana');
          
          if (solPairs.length === 0) continue;
          
          const bestPair = solPairs.reduce((prev: any, current: any) => 
            (prev.liquidity?.usd || 0) > (current.liquidity?.usd || 0) ? prev : current
          );
          
          const liquidity = bestPair.liquidity?.usd || 0;
          if (liquidity < minLiquidity) {
            // Do not permanently blacklist: token might gain liquidity later
            continue;
          }

          // Mark as processed
          scannedAddresses.current.add(address);
          if (scannedAddresses.current.size > 1500) {
            const arr = Array.from(scannedAddresses.current);
            scannedAddresses.current = new Set(arr.slice(arr.length - 800));
          }

          // 3. Fetch RugCheck
          const rugCheckUrl = import.meta.env.VITE_RUGCHECK_API_URL || 'https://api.rugcheck.xyz';
          const rcRes = await fetch(`${rugCheckUrl}/v1/tokens/${address}/report/summary`, {
            signal: controller.signal
          }).catch(() => null);

          if (!rcRes || !rcRes.ok) continue;
          
          const rcData = await rcRes.json();
          const dangerRisks = rcData.risks?.filter((r: any) => r.level === 'danger') || [];
          
          if (dangerRisks.length === 0) {
            // It's safe! Attempt real-time ML inference
            let mlData: any = null;
            const mlBaseUrl = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8000';
            try {
              const mlRes = await fetch(`${mlBaseUrl}/tokens/${address}/score`, { 
                signal: AbortSignal.timeout(2500) 
              });
              if (mlRes.ok) {
                mlData = await mlRes.json();
              }
            } catch {
              // Graceful fallback
            }

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
              chainId: bestPair.chainId || 'solana',
              pairAddress: bestPair.pairAddress,
              imageUrl: token.icon || bestPair.info?.imageUrl,
              createdAt: Date.now(),
              rugCheckScore: rcData.score || 0,
              detectedAt: new Date(),
              mlPotential: mlData?.potential_score,
              mlRisk: mlData?.risk_score,
              mlRecommendation: mlData?.recommendation,
              shapReasons: mlData?.top_shap_reasons,
            };

            setLiveTokens(prev => {
              const withoutDup = prev.filter(t => t.address !== address);
              return [newLiveToken, ...withoutDup].slice(0, 50);
            });
          }
          
          // Polite delay between pairs to respect rate limits
          await new Promise(r => setTimeout(r, 800));
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Live scanner error:", err);
        }
      }

      if (!controller.signal.aborted) {
        timeoutId = window.setTimeout(scanRoutine, 45000); // Re-run routine
      }
    };

    scanRoutine();

    return () => {
      controller.abort();
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
