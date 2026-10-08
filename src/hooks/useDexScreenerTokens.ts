import { useState, useEffect, useCallback, useRef } from 'react';
import { Token } from '../types';

const CACHE_KEY = 'solpulse_tokens_cache_v2';
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export const useDexScreenerTokens = () => {
  const [tokens, setTokens] = useState<Token[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.tokens) && parsed.tokens.length > 0) {
          return parsed.tokens;
        }
      }
    } catch {
      // fallback
    }
    return [];
  });
  
  const [isLoading, setIsLoading] = useState(tokens.length === 0);
  const [isSearching, setIsSearching] = useState(false);
  const isFetchingRef = useRef(false);

  const parsePairsToTokens = useCallback((pairs: any[]): Token[] => {
    if (!Array.isArray(pairs)) return [];

    const validPairs = pairs.filter((p: any) => p && p.baseToken && p.quoteToken);
    const parsed: Token[] = validPairs.map((p: any) => ({
      id: p.pairAddress || p.baseToken.address,
      pairAddress: p.pairAddress,
      symbol: p.baseToken.symbol || 'UNKNOWN',
      name: p.baseToken.name || 'Unknown Token',
      price: parseFloat(p.priceUsd) || 0,
      priceChange24h: p.priceChange?.h24 || 0,
      priceChange1h: p.priceChange?.h1 || 0,
      priceChange5m: p.priceChange?.m5 || 0,
      volume24h: p.volume?.h24 || 0,
      liquidity: p.liquidity?.usd || 0,
      marketCap: p.marketCap || p.fdv || 0,
      fdv: p.fdv || 0,
      address: p.baseToken.address,
      chainId: p.chainId || 'solana',
      dexId: p.dexId || 'dex',
      createdAt: p.pairCreatedAt || Date.now(),
      imageUrl: p.info?.imageUrl,
      buys24h: p.txns?.h24?.buys || 0,
      sells24h: p.txns?.h24?.sells || 0,
      websites: p.info?.websites || [],
      socials: p.info?.socials || [],
    }));

    return parsed;
  }, []);

  const fetchTokens = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (tokens.length === 0) setIsLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_DEXSCREENER_API_URL || 'https://api.dexscreener.com';

      // 1. Fetch boosted / trending tokens (currently hot)
      const boostsPromise = fetch(`${baseUrl}/token-boosts/latest/v1`)
        .then(res => res.ok ? res.json() : [])
        .catch(() => []);

      // 2. Fetch latest token profiles
      const profilesPromise = fetch(`${baseUrl}/token-profiles/latest/v1`)
        .then(res => res.ok ? res.json() : [])
        .catch(() => []);

      const [boostsData, profilesData] = await Promise.all([boostsPromise, profilesPromise]);

      const trendingAddresses = Array.isArray(boostsData)
        ? boostsData.map((p: any) => p.tokenAddress).filter(Boolean).slice(0, 50)
        : [];
      const newAddresses = Array.isArray(profilesData)
        ? profilesData.map((p: any) => p.tokenAddress).filter(Boolean).slice(0, 50)
        : [];

      // Top established Solana tokens
      const establishedSolana = [
        'So11111111111111111111111111111111111111112', // SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
        'JUPyiwrYPRn4aWe1w53xR6qF4X4H6CAtN6C65c7RzWJ', // JUP
        '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
        'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3AkTvww45bLwX', // PYTH
        'jtojtomepa8beP8AuQc6eLTr5dJtzjUpP513D1r2Mh2', // JTO
        'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
        '7GCihgDB8fe6KNjn2TwD4X9n8x5gB8vWjCj3V93U6V5r', // POPCAT
        'MEW1k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX', // MEW
        'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', // BOME
        '63LfUcswYbcL9XkR3T9T4Gg5L7q5LqE8t3Q6b5fXpump', // GIGA
        '3B5wuUrMEi5yATD7on46hKfej3pfmd7t1RKgrsN3pump', // MOTHER
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        '0x6982508145454Ce325dDbE47a25d4ec3d2311933', // PEPE
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
        '0x532f27101965dd16442E59d40670FaF5eBB142E4', // BRETT
      ];

      const combinedAddresses = Array.from(new Set([...establishedSolana, ...trendingAddresses, ...newAddresses]));

      // Query tokens in chunks of 30
      const chunks: string[] = [];
      for (let i = 0; i < Math.min(combinedAddresses.length, 120); i += 30) {
        chunks.push(combinedAddresses.slice(i, i + 30).join(','));
      }

      const tokenPromises = chunks.map(chunk =>
        fetch(`${baseUrl}/latest/dex/tokens/${chunk}`)
          .then(res => res.ok ? res.json() : { pairs: [] })
          .catch(() => ({ pairs: [] }))
      );

      // Search popular keywords for discovery
      const searchTerms = ['solana', 'meme', 'pump', 'raydium'];
      const searchPromises = searchTerms.map(term =>
        fetch(`${baseUrl}/latest/dex/search?q=${term}`)
          .then(res => res.ok ? res.json() : { pairs: [] })
          .catch(() => ({ pairs: [] }))
      );

      const [tokenResponses, searchResponses] = await Promise.all([
        Promise.all(tokenPromises),
        Promise.all(searchPromises)
      ]);

      let allPairs: any[] = [];
      [...tokenResponses, ...searchResponses].forEach(res => {
        if (res && Array.isArray(res.pairs)) {
          allPairs = [...allPairs, ...res.pairs];
        }
      });

      const parsedTokens = parsePairsToTokens(allPairs);

      // Deduplicate by symbol + chainId, prioritizing highest liquidity
      const map = new Map<string, Token>();
      parsedTokens.forEach(t => {
        const key = `${t.symbol.toUpperCase()}_${t.chainId}`;
        if (!map.has(key) || map.get(key)!.liquidity < t.liquidity) {
          map.set(key, t);
        }
      });

      const finalTokens = Array.from(map.values())
        .sort((a, b) => b.volume24h - a.volume24h);

      if (finalTokens.length > 0) {
        setTokens(finalTokens);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            tokens: finalTokens
          }));
        } catch {
          // ignore cache storage errors
        }
      }
    } catch (err) {
      console.error('DexScreener fetch error:', err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [parsePairsToTokens, tokens.length]);

  // Fetch a specific token on-demand if user searches an address
  const fetchTokenByAddress = useCallback(async (queryOrAddress: string): Promise<Token | null> => {
    const trimmed = queryOrAddress.trim();
    if (!trimmed) return null;

    setIsSearching(true);
    try {
      const baseUrl = import.meta.env.VITE_DEXSCREENER_API_URL || 'https://api.dexscreener.com';
      
      // If looks like an address (length > 25)
      const isAddress = trimmed.length >= 25;
      const url = isAddress 
        ? `${baseUrl}/latest/dex/tokens/${trimmed}`
        : `${baseUrl}/latest/dex/search?q=${encodeURIComponent(trimmed)}`;

      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      
      if (data && Array.isArray(data.pairs) && data.pairs.length > 0) {
        const parsed = parsePairsToTokens(data.pairs);
        // Sort pairs by liquidity to get best pool
        parsed.sort((a, b) => b.liquidity - a.liquidity);
        const topToken = parsed[0];

        // Add to tokens list if not already present
        setTokens(prev => {
          const exists = prev.some(t => t.address.toLowerCase() === topToken.address.toLowerCase());
          if (!exists) {
            return [topToken, ...prev];
          }
          return prev;
        });

        return topToken;
      }
    } catch (err) {
      console.error('Failed to fetch specific token:', err);
    } finally {
      setIsSearching(false);
    }
    return null;
  }, [parsePairsToTokens]);

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 60000);
    return () => clearInterval(interval);
  }, [fetchTokens]);

  return { 
    tokens, 
    isLoading, 
    isSearching,
    refreshTokens: fetchTokens,
    fetchTokenByAddress 
  };
};
