import React, { useState, useEffect, useRef } from 'react';
import { Activity, ChevronRight, Shield, Play, BarChart2, BellRing, Terminal, Cpu, Database, Crosshair, Zap } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

export function LandingPage({ onLaunch }: LandingPageProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrambleText, setScrambleText] = useState("INITIALIZING_CORE_SYSTEMS...");

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const texts = [
      "ESTABLISHING_SECURE_CONNECTION...",
      "SYNCING_WITH_SOLANA_MAINNET...",
      "LOADING_LIQUIDITY_POOLS...",
      "SYSTEM_READY_V_2.0.4"
    ];
    let i = 0;
    const interval = setInterval(() => {
      setScrambleText(texts[i]);
      i = (i + 1) % texts.length;
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] flex flex-col font-sans text-gray-300 selection:bg-neon-purple/30 w-full overflow-x-hidden selection:text-white">
      {/* Scanlines & Grain */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      <div className="pointer-events-none fixed inset-0 z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>

      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 z-0 pointer-events-none" />
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(127, 86, 255, 0.05), transparent 40%)`
        }}
      />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
        <div className="w-[80vw] h-[80vw] bg-neon-purple rounded-full mix-blend-screen filter blur-[200px] opacity-[0.07] animate-pulse-glow"></div>
      </div>

      {/* Navbar: HUD Style */}
      <nav className="relative z-20 flex justify-between items-center px-6 py-4 w-full border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-10 h-10 border border-white/10 bg-black">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-lime-green"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-lime-green"></div>
            <Activity className="w-5 h-5 text-lime-green" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-widest text-white font-mono uppercase">
              Sol<span className="text-lime-green">Pulse</span>
            </span>
            <span className="text-[10px] text-neon-purple font-mono uppercase tracking-[0.2em]">{scrambleText}</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-xs font-mono text-gray-500 uppercase tracking-widest">
          <a href="#intel" className="hover:text-lime-green transition-colors relative group">
            <span className="opacity-0 group-hover:opacity-100 absolute -left-3 text-lime-green transition-opacity">{'>'}</span> Intel
          </a>
          <a href="#terminal" className="hover:text-lime-green transition-colors relative group">
            <span className="opacity-0 group-hover:opacity-100 absolute -left-3 text-lime-green transition-opacity">{'>'}</span> Terminal
          </a>
          <a href="#network" className="hover:text-lime-green transition-colors relative group">
            <span className="opacity-0 group-hover:opacity-100 absolute -left-3 text-lime-green transition-opacity">{'>'}</span> Network
          </a>
        </div>
        
        <button 
          onClick={onLaunch}
          className="relative px-6 py-2 text-xs font-mono font-bold text-black bg-lime-green hover:bg-lime-green/90 transition-all duration-300 flex items-center gap-2 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          <span className="relative z-10 flex items-center gap-2">
            ACCESS_TERMINAL <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </nav>

      {/* Main Hero - Asymmetric Data Layout */}
      <main className="relative z-10 flex-1 w-full max-w-[1400px] mx-auto px-6 py-12 md:py-24 flex flex-col md:flex-row gap-12 items-center">
        
        {/* Left Column: Typography */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <div className="inline-flex items-center gap-3 px-3 py-1.5 border border-white/10 bg-black/50 text-xs font-mono text-gray-400 uppercase tracking-wider w-fit">
            <span className="w-2 h-2 bg-lime-green animate-pulse"></span>
            Live Mainnet Data Stream
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-[0.9] font-mono">
            Unfair <br/>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-neon-purple to-lime-green">
              Advantage.
            </span>
          </h1>
          
          <p className="max-w-xl text-sm md:text-base text-gray-400 font-mono leading-relaxed border-l-2 border-neon-purple/50 pl-4 py-2 bg-gradient-to-r from-neon-purple/5 to-transparent">
            Execute trades with institutional precision. SolPulse delivers raw, unfiltered Solana network data directly to your terminal. Track whale wallets, intercept liquidity pools, and bypass aggregator latency.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4 font-mono text-sm">
            <button
              onClick={onLaunch}
              className="relative px-8 py-4 bg-neon-purple text-white font-bold tracking-widest hover:bg-neon-purple/80 transition-all border border-neon-purple shadow-[0_0_20px_rgba(127,86,255,0.3)] group"
            >
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white opacity-50"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white opacity-50"></div>
              [ INITIALIZE_SYSTEM ]
            </button>
            
            <button className="px-8 py-4 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center gap-2 group">
              <Play className="w-4 h-4 text-lime-green group-hover:scale-110 transition-transform" />
              VIEW_TELEMETRY
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 border-t border-white/10 pt-8">
            <div>
              <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase">Latency</div>
              <div className="text-lg font-mono text-lime-green">{"<"} 400ms</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase">RPC Nodes</div>
              <div className="text-lg font-mono text-white">Tier 1</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase">Pairs Tracked</div>
              <div className="text-lg font-mono text-white">45,291</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase">Uptime</div>
              <div className="text-lg font-mono text-lime-green">99.99%</div>
            </div>
          </div>
        </div>

        {/* Right Column: Terminal Mockup (Non-Generic) */}
        <div className="flex-1 w-full relative">
          {/* Decorative frame */}
          <div className="absolute -inset-4 border border-white/5 bg-white/[0.01] backdrop-blur-sm z-0 hidden md:block">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20"></div>
          </div>

          <div className="relative z-10 bg-[#0a0a0c] border border-white/10 shadow-2xl flex flex-col font-mono text-xs overflow-hidden h-[500px]">
            {/* Terminal Header */}
            <div className="flex justify-between items-center px-4 py-2 bg-black/60 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500">solpulse/sys/monitor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-lime-green rounded-full animate-pulse"></div>
                <span className="text-lime-green text-[10px]">LIVE</span>
              </div>
            </div>

            {/* Terminal Grid Content */}
            <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-[1px] bg-white/10 p-[1px]">
              {/* Main Chart Area */}
              <div className="col-span-2 row-span-2 bg-[#0a0a0c] p-4 relative overflow-hidden flex flex-col justify-end group">
                <div className="absolute top-4 left-4 z-10">
                  <div className="text-white text-lg font-bold">SOL/USDC</div>
                  <div className="text-lime-green">142.58 <span className="text-[10px]">+2.4%</span></div>
                </div>
                {/* Fake Chart Bars */}
                <div className="flex items-end gap-1 h-32 opacity-50 group-hover:opacity-100 transition-opacity">
                  {[...Array(30)].map((_, i) => {
                    const h = 20 + Math.random() * 80;
                    const isUp = Math.random() > 0.5;
                    return (
                      <div 
                        key={i} 
                        className={`w-full ${isUp ? 'bg-lime-green' : 'bg-red-500'}`} 
                        style={{ height: `${h}%` }}
                      ></div>
                    )
                  })}
                </div>
                {/* Crosshair effect */}
                <div className="absolute inset-0 border border-transparent group-hover:border-white/10 transition-colors pointer-events-none">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-lime-green/20"></div>
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-lime-green/20"></div>
                </div>
              </div>

              {/* Order Book */}
              <div className="col-span-1 row-span-3 bg-[#0a0a0c] p-2 flex flex-col text-[10px] leading-relaxed">
                <div className="text-gray-500 border-b border-white/10 pb-1 mb-2">ORDER_BOOK</div>
                <div className="flex-1 flex flex-col justify-end text-red-400 gap-1 overflow-hidden">
                  {[...Array(8)].map((_, i) => (
                    <div key={`ask-${i}`} className="flex justify-between relative z-10">
                      <span>142.{60 + i}</span>
                      <span>{(Math.random() * 100).toFixed(2)}</span>
                      <div className="absolute right-0 top-0 bottom-0 bg-red-900/20 z-[-1]" style={{width: `${20 + Math.random() * 80}%`}}></div>
                    </div>
                  ))}
                </div>
                <div className="py-2 text-white text-center font-bold text-sm">142.58</div>
                <div className="flex-1 flex flex-col text-lime-green gap-1 overflow-hidden">
                  {[...Array(8)].map((_, i) => (
                    <div key={`bid-${i}`} className="flex justify-between relative z-10">
                      <span>142.{57 - i}</span>
                      <span>{(Math.random() * 100).toFixed(2)}</span>
                      <div className="absolute right-0 top-0 bottom-0 bg-green-900/20 z-[-1]" style={{width: `${20 + Math.random() * 80}%`}}></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Trades / Event Log */}
              <div className="col-span-2 row-span-1 bg-[#0a0a0c] p-2 overflow-hidden flex flex-col">
                <div className="text-gray-500 border-b border-white/10 pb-1 mb-2">EVENT_LOG</div>
                <div className="flex-1 flex flex-col gap-1 text-[10px] font-mono animate-dash-scroll">
                  {[...Array(15)].map((_, i) => {
                    const isBuy = Math.random() > 0.5;
                    const amount = (Math.random() * 50).toFixed(2);
                    const hash = Math.random().toString(36).substring(2, 10);
                    return (
                      <div key={i} className="flex justify-between border-b border-white/5 py-1">
                        <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                        <span className={isBuy ? 'text-lime-green' : 'text-red-500'}>{isBuy ? 'BUY' : 'SELL'} {amount} SOL</span>
                        <span className="text-neon-purple opacity-70">Tx:{hash}...</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Data Modules */}
      <section id="intel" className="relative z-10 w-full max-w-[1400px] mx-auto px-6 py-24 border-t border-white/5">
        <div className="mb-16">
          <h2 className="text-sm font-mono text-lime-green mb-2 uppercase">/ Modules / Capabilities</h2>
          <p className="text-3xl md:text-4xl font-bold text-white font-mono uppercase tracking-tight">System Architecture</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          {/* Feature 1 */}
          <div className="border border-white/10 bg-black/40 p-6 hover:bg-black/80 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-neon-purple/10 rounded-bl-full -z-10 group-hover:scale-150 transition-transform"></div>
            <Cpu className="w-8 h-8 text-neon-purple mb-6" />
            <div className="text-white text-lg font-bold mb-2 uppercase">Sub-second Sync</div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Bypass conventional nodes. Direct RPC connection processes block data instantly, delivering liquidity pool updates before they render on commercial dashboards.
            </p>
            <div className="w-full h-1 bg-white/5 mt-auto relative">
              <div className="absolute top-0 left-0 h-full bg-neon-purple w-0 group-hover:w-full transition-all duration-1000"></div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="border border-white/10 bg-black/40 p-6 hover:bg-black/80 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-lime-green/10 rounded-bl-full -z-10 group-hover:scale-150 transition-transform"></div>
            <Crosshair className="w-8 h-8 text-lime-green mb-6" />
            <div className="text-white text-lg font-bold mb-2 uppercase">Whale Telemetry</div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Track massive capital flows autonomously. The system parses wallet transactions in real-time, tagging smart money movements and potential market manipulation.
            </p>
            <div className="w-full h-1 bg-white/5 mt-auto relative">
              <div className="absolute top-0 left-0 h-full bg-lime-green w-0 group-hover:w-full transition-all duration-1000"></div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="border border-white/10 bg-black/40 p-6 hover:bg-black/80 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform"></div>
            <Shield className="w-8 h-8 text-gray-300 mb-6" />
            <div className="text-white text-lg font-bold mb-2 uppercase">Contract Audit Log</div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Instantmatic threat detection. Evaluates token contracts for mint privileges, freeze authorities, and rug-pull vulnerabilities before you expose capital.
            </p>
            <div className="w-full h-1 bg-white/5 mt-auto relative">
              <div className="absolute top-0 left-0 h-full bg-white w-0 group-hover:w-full transition-all duration-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Access Footer */}
      <footer id="network" className="relative z-20 border-t border-white/10 bg-black py-12 mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div className="font-mono">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-lime-green" />
              <span className="text-white font-bold tracking-widest text-xl uppercase">SOLPULSE</span>
            </div>
            <p className="text-gray-500 text-xs">
              CORE_SYSTEM_VERSION: 2.0.4<br/>
              STATUS: <span className="text-lime-green">OPERATIONAL</span><br/>
              ENCRYPTION: AES-256
            </p>
          </div>
          
          <div className="flex flex-col md:items-end gap-4 font-mono text-xs text-gray-500">
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">[ DOCUMENTATION ]</a>
              <a href="#" className="hover:text-white transition-colors">[ API_ACCESS ]</a>
              <a href="#" className="hover:text-white transition-colors">[ DISCORD_RELAY ]</a>
            </div>
            <div>© 2026 SOLPULSE NETWORK. ALL RIGHTS RESERVED.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
