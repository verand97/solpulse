import { useState, useEffect } from 'react';

export const useWatchlist = () => {
  const [watchlistAddresses, setWatchlistAddresses] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('solpulse_watchlist');
      if (stored) {
        setWatchlistAddresses(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to parse watchlist", err);
    }
  }, []);

  const toggleWatchlist = (address: string) => {
    setWatchlistAddresses(prev => {
      const updated = prev.includes(address)
        ? prev.filter(a => a !== address)
        : [...prev, address];
      
      localStorage.setItem('solpulse_watchlist', JSON.stringify(updated));
      return updated;
    });
  };

  const isInWatchlist = (address: string) => watchlistAddresses.includes(address);

  return { watchlistAddresses, toggleWatchlist, isInWatchlist };
};
