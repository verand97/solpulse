import React, { useMemo } from 'react';
import { Token } from '../types';
import { cn } from '../utils';

interface BubbleMapProps {
  tokens: Token[];
  onSelectToken: (token: Token) => void;
}

export const BubbleMap: React.FC<BubbleMapProps> = ({ tokens, onSelectToken }) => {
  // We only show top 50 tokens to prevent the screen from getting too chaotic
  const displayTokens = useMemo(() => {
    return [...tokens]
      .sort((a, b) => b.liquidity - a.liquidity)
      .slice(0, 50);
  }, [tokens]);

  const maxLiquidity = useMemo(() => Math.max(...displayTokens.map(t => t.liquidity), 1), [displayTokens]);
  const minLiquidity = useMemo(() => Math.min(...displayTokens.map(t => t.liquidity), 0), [displayTokens]);

  const getBubbleSize = (liquidity: number) => {
    // Map liquidity to a pixel size between 60px and 220px
    const minSize = 60;
    const maxSize = 220;
    if (maxLiquidity === minLiquidity) return (minSize + maxSize) / 2;
    
    // Use Math.sqrt for a more balanced area scaling rather than linear scaling
    const normalized = Math.sqrt(liquidity) / Math.sqrt(maxLiquidity);
    return minSize + (normalized * (maxSize - minSize));
  };

  const getBubbleColor = (change: number) => {
    if (change > 20) return 'bg-[rgba(128,255,86,0.9)] shadow-[0_0_20px_rgba(128,255,86,0.4)]';
    if (change > 5) return 'bg-[rgba(128,255,86,0.6)] shadow-[0_0_10px_rgba(128,255,86,0.2)]';
    if (change > 0) return 'bg-[rgba(128,255,86,0.3)] shadow-[0_0_5px_rgba(128,255,86,0.1)]';
    if (change === 0) return 'bg-gray-600/50';
    if (change > -5) return 'bg-[rgba(255,86,86,0.3)] shadow-[0_0_5px_rgba(255,86,86,0.1)]';
    if (change > -20) return 'bg-[rgba(255,86,86,0.6)] shadow-[0_0_10px_rgba(255,86,86,0.2)]';
    return 'bg-[rgba(255,86,86,0.9)] shadow-[0_0_20px_rgba(255,86,86,0.4)]';
  };

  return (
    <div className="w-full h-full min-h-[600px] flex flex-wrap items-center justify-center content-center gap-2 p-8 overflow-hidden relative bg-charcoal-light rounded-xl border border-charcoal-lighter">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
      
      {displayTokens.map((token, i) => {
        const size = getBubbleSize(token.liquidity);
        const colorClass = getBubbleColor(token.priceChange24h);
        
        // Add random floating animation delays
        const floatDelay = `${(i * 0.2) % 2}s`;
        const floatDuration = `${3 + (i % 3)}s`;

        return (
          <button
            key={token.id}
            onClick={() => onSelectToken(token)}
            style={{
              width: size,
              height: size,
              animation: `float ${floatDuration} ease-in-out ${floatDelay} infinite alternate`,
            }}
            className={cn(
              "relative rounded-full flex flex-col items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 active:scale-95 group",
              colorClass,
              "backdrop-blur-md border border-white/10"
            )}
          >
            {/* Dark overlay on hover for better readability if needed, but we keep it clean */}
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col items-center justify-center px-2 text-center">
              {size > 90 && token.imageUrl && (
                <img 
                  src={token.imageUrl} 
                  alt={token.symbol} 
                  className={cn(
                    "rounded-full bg-charcoal-light object-cover mb-1 border border-white/20",
                    size > 150 ? "w-12 h-12" : "w-8 h-8"
                  )} 
                />
              )}
              <span className={cn(
                "font-bold truncate w-full",
                size > 120 ? "text-lg" : size > 80 ? "text-sm" : "text-xs"
              )}>
                {token.symbol}
              </span>
              {size > 80 && (
                <span className={cn(
                  "font-mono font-medium drop-shadow-md",
                  size > 120 ? "text-base" : "text-xs"
                )}>
                  {token.priceChange24h > 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                </span>
              )}
            </div>
          </button>
        );
      })}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-10px) scale(1.02); }
        }
      `}} />
    </div>
  );
};
