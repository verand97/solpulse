import { useState, useEffect } from 'react';

export interface RugCheckRisk {
  name: string;
  value: string;
  description: string;
  score: number;
  level: 'danger' | 'warn' | 'good';
}

export interface RugCheckSummary {
  mint: string;
  score: number;
  risks: RugCheckRisk[];
  tokenType: string;
  isSafe: boolean;
}

export const useRugCheck = (address: string | null) => {
  const [data, setData] = useState<RugCheckSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setData(null);
      setError(null);
      return;
    }

    const fetchRugCheck = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const baseUrl = import.meta.env.VITE_RUGCHECK_API_URL || 'https://api.rugcheck.xyz';
        const response = await fetch(`${baseUrl}/v1/tokens/${address}/report/summary`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch RugCheck data');
        }
        
        const result = await response.json();
        
        // RugCheck logic: lower score is generally safer. 
        // We'll consider it safe if there are no 'danger' level risks.
        const dangerRisks = result.risks?.filter((r: any) => r.level === 'danger') || [];
        
        setData({
          ...result,
          isSafe: dangerRisks.length === 0,
        });
      } catch (err) {
        console.error('RugCheck API Error:', err);
        setError('Could not verify token security.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRugCheck();
  }, [address]);

  return { data, isLoading, error };
};
