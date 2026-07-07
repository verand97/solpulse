import { useState, useEffect } from 'react';
import { Token } from '../types';

export const useDexScreenerTokens = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        // 1. Fetch latest token profiles (newly created tokens)
        const profilesResponse = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
        const profilesData = await profilesResponse.json();
        const newAddresses = Array.isArray(profilesData) 
          ? profilesData.filter(p => p.chainId === 'solana').map(p => p.tokenAddress).slice(0, 50)
          : [];

        // 2. Fetch trending/boosted tokens (currently hot)
        const boostsResponse = await fetch('https://api.dexscreener.com/token-boosts/latest/v1');
        const boostsData = await boostsResponse.json();
        const trendingAddresses = Array.isArray(boostsData)
          ? boostsData.filter(p => p.chainId === 'solana').map(p => p.tokenAddress).slice(0, 50)
          : [];

        // 3. Established Solana tokens (Top Market Cap/Volume)
        const establishedAddresses = [
          'So11111111111111111111111111111111111111112', // SOL
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
          'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
          'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
          'JUPyiwrYPRn4aWe1w53xR6qF4X4H6CAtN6C65c7RzWJ', // JUP
          '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
          '7GCihgDB8fe6KNjn2TwD4X9n8x5gB8vWjCj3V93U6V5r', // POPCAT
          'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3AkTvww45bLwX', // PYTH
          'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', // BOME
          '7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzBsT4BgH8Vr', // SLERF
        ];

        // Combine unique addresses
        const allSet = new Set([...establishedAddresses, ...trendingAddresses, ...newAddresses]);
        const uniqueAddresses = Array.from(allSet);
        
        // DexScreener limit per request is 30 addresses. We split into chunks of 30.
        const chunks = [];
        for (let i = 0; i < uniqueAddresses.length; i += 30) {
          chunks.push(uniqueAddresses.slice(i, i + 30).join(','));
        }

        // 4. Fetch price and volume data for all chunks in parallel
        const tokenPromises = chunks.map(chunk => 
          fetch(`https://api.dexscreener.com/latest/dex/tokens/${chunk}`).then(res => res.json())
        );
        
        // 5. Fetch explicit Pump.fun tokens to guarantee high volume pump inclusion
        const pumpPromise = fetch('https://api.dexscreener.com/latest/dex/search?q=pump').then(res => res.json());

        const results = await Promise.all([...tokenPromises, pumpPromise]);

        let allPairs: any[] = [];
        results.forEach(result => {
          if (result && result.pairs) {
            allPairs = [...allPairs, ...result.pairs];
          }
        });
        
        if (allPairs.length > 0) {
          const parsedTokens: Token[] = allPairs
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
