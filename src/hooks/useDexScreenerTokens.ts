import { useState, useEffect } from 'react';
import { Token } from '../types';

export const useDexScreenerTokens = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        // 1. Fetch latest token profiles (newly created tokens)
        const profilesResponse = await fetch(`${import.meta.env.VITE_DEXSCREENER_API_URL || 'https://api.dexscreener.com'}/token-profiles/latest/v1`);
        const profilesData = await profilesResponse.json();
        const newAddresses = Array.isArray(profilesData) 
          ? profilesData.filter(p => p.chainId === 'solana').map(p => p.tokenAddress).slice(0, 200)
          : [];

        // 2. Fetch trending/boosted tokens (currently hot)
        const boostsResponse = await fetch(`${import.meta.env.VITE_DEXSCREENER_API_URL || 'https://api.dexscreener.com'}/token-boosts/latest/v1`);
        const boostsData = await boostsResponse.json();
        const trendingAddresses = Array.isArray(boostsData)
          ? boostsData.filter(p => p.chainId === 'solana').map(p => p.tokenAddress).slice(0, 200)
          : [];

        // 3. Established Solana tokens (Top Market Cap/Volume)
        const establishedAddresses = [
          'So11111111111111111111111111111111111111112', // SOL
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
          'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
          'JUPyiwrYPRn4aWe1w53xR6qF4X4H6CAtN6C65c7RzWJ', // JUP
          '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
          'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3AkTvww45bLwX', // PYTH
          'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', // HNT
          'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', // RNDR
          'jtojtomepa8beP8AuQc6eLTr5dJtzjUpP513D1r2Mh2', // JTO
          'mb1eu7TzEc71KxDpsmsKoucZ59GcgH1TGU1qU75K5f3', // MOBILE
          'nosXBqR5b7vH1hA8BwU54z5A1B3rK4jT6n1yJ1b7X8B', // NOS
          'TNSRxcUdpb9s4Xdbq6tVzUZbS1mS2X3G2Y4C7W68181', // TNSR
          'ZEUS1aA15aV3U9c1U2wG5V72K4K8G8k3Y1tJ8E9J1jQ', // ZEUS
          'PRCL1pM9GZ44zN1wUu7Lq5YJ9C1p1oP2eP6FvG2j9zX', // PRCL
          'DriFtup97tHkPjFhG33P135XfKjG7W3a5t2iU75vT89L', // DRIFT
          'MNDEFzGvMt87ueuXtcNK333F2o7iEnT7YdYw24Qj6Nn', // MNDE
          
          // Memes / Culture
          'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
          'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
          'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', // BOME
          '7GCihgDB8fe6KNjn2TwD4X9n8x5gB8vWjCj3V93U6V5r', // POPCAT
          'MEW1k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX', // MEW
          'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk',   // WEN
          '7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzBsT4BgH8Vr', // SLERF
          '5mbK36SZ7J19L8jFcyy8B8mC2K7h8r6X6aQ1a5z1v2wX', // MYRO
          'SAMo1k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3Qr', // SAMO
          'DUKook1k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3', // DUKO
          '5mbK36SZ7J19L8jFcyy8B8mC2K7h8r6X6aQ1a5z1v2wX', // MICHI
          '3B5wuUrMEi5yATD7on46hKfej3pfmd7t1RKgrsN3pump', // MOTHER
          'FU1q8vJpZNUrmqsciSjp8bAKKidGsL6VEMRkC9aPpump', // TREMP
          '3psH1Mj1f7yUfaD5gh6Zj7epE8hhrMkMETgv5TshQA4o', // BODEN
          '5mbK36SZ7J19L8jFcyy8B8mC2K7h8r6X6aQ1a5z1v2wX', // PONKE
          '63LfUcswYbcL9XkR3T9T4Gg5L7q5LqE8t3Q6b5fXpump', // GIGA
          '2x3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // HARAMBE
          '6x3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'  // SC
        ];

        // Combine unique addresses
        const allSet = new Set([...establishedAddresses, ...trendingAddresses, ...newAddresses]);
        const uniqueAddresses = Array.from(allSet);
        
        // DexScreener limit per request is 30 addresses. We split into chunks of 30.
        // To avoid hitting rate limits too hard, we limit to max 10 chunks (300 tokens)
        const chunks = [];
        for (let i = 0; i < Math.min(uniqueAddresses.length, 300); i += 30) {
          chunks.push(uniqueAddresses.slice(i, i + 30).join(','));
        }

        // 4. Fetch price and volume data for all chunks in parallel
        const tokenPromises = chunks.map(chunk => 
          fetch(`${import.meta.env.VITE_DEXSCREENER_API_URL || 'https://api.dexscreener.com'}/latest/dex/tokens/${chunk}`)
            .then(res => res.json())
            .catch(() => ({ pairs: [] }))
        );
        
        // 5. Fetch multiple pages of diverse metas to get a wide variety of tokens
        const searchTerms = ['solana', 'meme', 'pump', 'ai', 'dog', 'cat', 'wif', 'moon'];
        const searchPromises = searchTerms.map(term => 
          fetch(`${import.meta.env.VITE_DEXSCREENER_API_URL || 'https://api.dexscreener.com'}/latest/dex/search?q=${term}`)
            .then(res => res.json())
            .catch(() => ({ pairs: [] }))
        );

        // Execute token requests first, then search requests to avoid burst rate limits
        const tokenResults = await Promise.all(tokenPromises);
        // Small delay to prevent 429
        await new Promise(resolve => setTimeout(resolve, 500));
        const searchResults = await Promise.all(searchPromises);

        const results = [...tokenResults, ...searchResults];

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
            
          // Deduplicate by symbol and take highest liquidity
          const uniqueTokens = new Map<string, Token>();
          parsedTokens.forEach(token => {
            const sym = token.symbol.toUpperCase();
            if (!uniqueTokens.has(sym) || uniqueTokens.get(sym)!.liquidity < token.liquidity) {
              // Only filter if liquidity < 100, we want to allow new meme coins
              if (token.liquidity > 100) {
                uniqueTokens.set(sym, token);
              }
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
