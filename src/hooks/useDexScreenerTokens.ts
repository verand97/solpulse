import { useState, useEffect } from 'react';
import { Token } from '../types';

export const useDexScreenerTokens = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=solana');
        const data = await response.json();
        
        if (data && data.pairs) {
          const parsedTokens: Token[] = data.pairs
            .filter((p: any) => p.chainId === 'solana' && p.baseToken && p.quoteToken)
            .map((p: any) => ({
              id: p.pairAddress,
              symbol: p.baseToken.symbol,
              name: p.baseToken.name,
              price: parseFloat(p.priceUsd) || 0,
              priceChange24h: p.priceChange?.h24 || 0,
              volume24h: p.volume?.h24 || 0,
              liquidity: p.liquidity?.usd || 0,
              marketCap: p.marketCap || p.fdv || 0,
              address: p.baseToken.address,
              createdAt: p.pairCreatedAt || Date.now(),
              imageUrl: p.info?.imageUrl,
            }));
            
          // Deduplicate by base token address (take highest liquidity pair)
          const uniqueTokens = new Map<string, Token>();
          parsedTokens.forEach(token => {
            if (!uniqueTokens.has(token.address) || uniqueTokens.get(token.address)!.liquidity < token.liquidity) {
              uniqueTokens.set(token.address, token);
            }
          });
          
          setTokens(Array.from(uniqueTokens.values()));
        }
      } catch (error) {
        console.error("Error fetching tokens from DexScreener:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
    const interval = setInterval(fetchTokens, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return { tokens, isLoading };
};
