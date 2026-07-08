import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-charcoal-lighter bg-charcoal/90 backdrop-blur-md py-4 px-6 flex justify-center z-20">
      <div className="flex items-center gap-6 sm:gap-10 text-sm font-mono tracking-wide">
        <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
          Dokumentasi
        </a>
        <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
          API
        </a>
        <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
          Twitter
        </a>
        <div className="flex items-center gap-2 text-lime-green font-bold">
          <div className="w-2.5 h-2.5 rounded-full bg-lime-green shadow-[0_0_8px_rgba(128,255,86,0.8)] animate-pulse" />
          Sistem Operasional
        </div>
      </div>
    </footer>
  );
};
