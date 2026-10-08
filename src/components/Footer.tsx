import React from 'react';
import { cn } from '../utils';

export const Footer: React.FC = () => {
  return (
    <footer className="h-8 shrink-0 flex items-center justify-between px-4 border-t border-[#222226] bg-[#0A0A0B]">
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-[#52525E]">SolPulse</span>
        <span className="text-[#1E1E22]">·</span>
        <a href="#" className="text-[11px] text-[#52525E] hover:text-[#8A8A96] transition-colors">Docs</a>
        <a href="#" className="text-[11px] text-[#52525E] hover:text-[#8A8A96] transition-colors">API</a>
        <a href="#" className="text-[11px] text-[#52525E] hover:text-[#8A8A96] transition-colors">Twitter</a>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span className="text-[11px] text-[#52525E]">Solana Mainnet</span>
      </div>
    </footer>
  );
};
