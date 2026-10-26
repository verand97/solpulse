import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'solpulse_watchlist';

const getInitialWatchlist = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Failed to parse watchlist", err);
  }
  return [];
};

export const useWatchlist = () => {
  const [watchlistAddresses, setWatchlistAddresses] = useState<string[]>(getInitialWatchlist);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setWatchlistAddresses(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleWatchlist = useCallback((address: string) => {
    setWatchlistAddresses(prev => {
      const cleanAddr = address.trim();
      const updated = prev.includes(cleanAddr)
        ? prev.filter(a => a !== cleanAddr)
        : [...prev, cleanAddr];
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save watchlist", err);
      }
      return updated;
    });
  }, []);

  const isInWatchlist = useCallback((address: string) => {
    return watchlistAddresses.includes(address.trim());
  }, [watchlistAddresses]);

  return { watchlistAddresses, toggleWatchlist, isInWatchlist };
};
