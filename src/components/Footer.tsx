// SolPulse Terminal - Status Footer
import React from 'react';
import { cn } from '../utils';

export const Footer: React.FC = () => {
  return (
    <footer className="h-8 shrink-0 flex items-center justify-between px-4 border-t border-border bg-bg">
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-txt-3">SolPulse</span>
        <span className="text-surface-3">·</span>
        <a href="#" className="text-[11px] text-txt-3 hover:text-txt-2 transition-colors">Docs</a>
        <a href="#" className="text-[11px] text-txt-3 hover:text-txt-2 transition-colors">API</a>
        <a href="#" className="text-[11px] text-txt-3 hover:text-txt-2 transition-colors">Twitter</a>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span className="text-[11px] text-txt-3">Solana Mainnet</span>
      </div>
    </footer>
  );
};
