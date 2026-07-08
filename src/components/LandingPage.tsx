import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap, TrendingUp, ChevronRight, Shield, Globe, Play, BarChart2, BellRing, Rocket } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

export function LandingPage({ onLaunch }: LandingPageProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-charcoal flex flex-col font-sans text-gray-200 selection:bg-neon-purple/30 w-full">
      {/* Background Mesh & Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 z-0 pointer-events-none" />
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(127, 86, 255, 0.08), transparent 40%)`
        }}
      />
      {/* Background Glows (fixed to prevent layout shift) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-neon-purple rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse-glow"></div>
        <div className="absolute top-[80%] right-[-10%] w-[50vw] h-[50vw] bg-lime-green rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-float-delayed"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex justify-between items-center px-8 py-6 w-full max-w-7xl mx-auto border-b border-white/5 bg-charcoal/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-neon-purple to-lime-green flex items-center justify-center shadow-[0_0_30px_rgba(127,86,255,0.4)]">
            <Activity className="w-6 h-6 text-charcoal font-bold" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-mono">
            Sol<span className="text-lime-green">Pulse</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
          <a href="#demo" className="hover:text-white transition-colors">Demo</a>
          <a href="#komunitas" className="hover:text-white transition-colors">Komunitas</a>
        </div>
        <button 
          onClick={onLaunch}
          className="text-sm font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-full transition-all duration-300 flex items-center gap-2 group hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          Masuk <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-20 pb-32 mx-auto w-full">
        
        <div className="px-6 flex flex-col items-center text-center max-w-4xl mx-auto z-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-xs font-bold mb-8 animate-fade-in-up uppercase tracking-widest shadow-[0_0_20px_rgba(127,86,255,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-purple opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-purple"></span>
            </span>
            Platform Intelijen Dex v2.0
          </div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-white mb-8 animate-fade-in-up leading-[1.1]" style={{ animationDelay: '0.1s' }}>
            Dominasi Pasar <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-neon-purple via-purple-400 to-lime-green drop-shadow-[0_0_40px_rgba(127,86,255,0.5)]">
              Kecepatan Cahaya
            </span>
          </h1>
          
          <p className="max-w-2xl text-lg md:text-2xl text-gray-400 mb-10 animate-fade-in-up font-light" style={{ animationDelay: '0.2s' }}>
            Pantau pergerakan paus, lacak portofolio real-time, dan temukan gem Solana berikutnya sebelum yang lain. Antarmuka pro untuk trader pro.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={onLaunch}
              className="group relative px-10 py-5 bg-neon-purple text-white font-bold text-lg rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(127,86,255,0.6)] border border-white/20"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out z-0"></div>
              <div className="relative z-10 flex items-center gap-3">
                <Rocket className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                Luncurkan Terminal
              </div>
            </button>
            
            <button onClick={onLaunch} className="flex items-center gap-3 px-8 py-5 rounded-2xl font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10">
              <Play className="w-5 h-5 text-lime-green" />
              Lihat Cara Kerja
            </button>
          </div>
        </div>

        {/* Dashboard Preview / Mockup */}
        <div className="w-full max-w-6xl mx-auto px-6 mt-20 animate-fade-in-up relative z-10" style={{ animationDelay: '0.5s' }}>
          <div className="relative rounded-3xl border border-white/10 bg-charcoal/80 backdrop-blur-2xl shadow-[0_30px_100px_-20px_rgba(127,86,255,0.4)] overflow-hidden">
            {/* Window Header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-charcoal-light/50">
              <div className="w-3 h-3 rounded-full bg-danger"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-lime-green"></div>
              <div className="ml-4 px-3 py-1 bg-black/30 rounded-md text-xs font-mono text-gray-500 border border-white/5">app.solpulse.io/terminal</div>
            </div>
            
            {/* Fake Dashboard Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 h-[400px]">
              {/* Sidebar fake */}
              <div className="hidden md:block col-span-1 border-r border-white/5 p-4">
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-10 rounded-xl ${i === 0 ? 'bg-neon-purple/20 border border-neon-purple/30' : 'bg-white/5'} animate-pulse`} style={{ animationDelay: `${i * 0.1}s` }}></div>
                  ))}
                </div>
              </div>
              {/* Main content fake */}
              <div className="col-span-1 md:col-span-3 p-6 flex flex-col gap-4 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse"></div>
                  <div className="h-8 w-24 bg-neon-purple/30 rounded-lg animate-pulse"></div>
                </div>
                
                {/* Scrolling Rows */}
                <div className="flex-1 overflow-hidden relative rounded-xl border border-white/5 bg-black/20">
                  <div className="absolute inset-0 flex flex-col animate-dash-scroll">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-neon-purple to-lime-green opacity-80"></div>
                          <div>
                            <div className="w-20 h-4 bg-white/20 rounded mb-1"></div>
                            <div className="w-12 h-3 bg-white/10 rounded"></div>
                          </div>
                        </div>
                        <div className="w-24 h-4 bg-lime-green/20 rounded"></div>
                        <div className="w-32 h-4 bg-white/10 rounded hidden sm:block"></div>
                        <div className="w-16 h-8 bg-white/10 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Glossy Reflection overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* Bento Grid Features */}
        <div id="fitur" className="w-full max-w-7xl mx-auto px-6 mt-32 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Persenjatai Diri Anda</h2>
            <p className="text-gray-400">Teknologi institusional kini di tangan Anda.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Card */}
            <SpotlightCard className="md:col-span-2 p-10 flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-lime-green/10 flex items-center justify-center border border-lime-green/20 mb-6">
                  <Activity className="w-7 h-7 text-lime-green" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">Live Screener Tanpa Delay</h3>
                <p className="text-gray-400 text-lg max-w-md">Koneksi langsung ke jaringan Solana memastikan Anda menerima pembaruan harga dan likuiditas sebelum agregator lain memprosesnya.</p>
              </div>
              {/* Decorative chart lines */}
              <div className="absolute right-0 bottom-0 w-1/2 h-1/2 opacity-20 pointer-events-none">
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full text-lime-green stroke-current stroke-2 fill-none">
                  <path d="M0,50 L20,30 L40,40 L60,10 L80,20 L100,0" />
                </svg>
              </div>
            </SpotlightCard>

            {/* Small Card 1 */}
            <SpotlightCard className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-neon-purple/10 flex items-center justify-center border border-neon-purple/20 mb-6">
                <BellRing className="w-6 h-6 text-neon-purple" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Whale Alerts</h3>
              <p className="text-gray-400">Deteksi otomatis aliran dana masif. Ikuti pergerakan paus (*smart money*) dan posisikan diri Anda sebelum lonjakan harga terjadi.</p>
            </SpotlightCard>

            {/* Small Card 2 */}
            <SpotlightCard className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-6">
                <BarChart2 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Manajemen Portofolio</h3>
              <p className="text-gray-400">Pantau performa aset, analisis PnL riwayat transaksi, dan kelola dompet Anda dalam satu antarmuka yang sangat bersih.</p>
            </SpotlightCard>

            {/* Medium Card */}
            <SpotlightCard className="md:col-span-2 p-8 flex flex-col md:flex-row items-center gap-8 bg-linear-to-r from-neon-purple/5 to-transparent">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">Keamanan Eksekusi Maksimal</h3>
                <p className="text-gray-400 mb-6">Analisis audit token bawaan, mendeteksi honeypot, mint authority, dan rug-pull secara real-time sebelum Anda melakukan swap.</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-lime-green flex items-center gap-1"><Shield className="w-3 h-3"/> LP Locked</span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-lime-green flex items-center gap-1"><Shield className="w-3 h-3"/> Mint Revoked</span>
                </div>
              </div>
              <div className="w-full md:w-1/3 aspect-square rounded-full border border-neon-purple/30 bg-neon-purple/10 flex items-center justify-center relative animate-pulse-glow">
                <Shield className="w-16 h-16 text-neon-purple" />
                <div className="absolute inset-0 border border-neon-purple rounded-full animate-ping opacity-20"></div>
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* Demo Section */}
        <div id="demo" className="w-full max-w-7xl mx-auto px-6 mt-32 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Demo Langsung</h2>
            <p className="text-gray-400">Rasakan sensasi terminal tanpa perlu mendaftar.</p>
          </div>
          <div className="relative rounded-3xl border border-white/10 bg-charcoal/50 p-8 md:p-16 flex flex-col items-center text-center overflow-hidden">
            {/* Background effects for demo */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-neon-purple/20 via-transparent to-transparent opacity-50"></div>
            
            <div className="relative z-10 max-w-2xl">
              <Activity className="w-16 h-16 text-lime-green mx-auto mb-6 animate-pulse" />
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">Akses Data Real-Time Sekarang Juga</h3>
              <p className="text-gray-400 mb-8 text-lg">
                Klik tombol di bawah ini untuk langsung mencoba fitur Screener dan Live Scanner kami secara gratis. Uji coba langsung bagaimana kami memfilter token yang aman untuk Anda.
              </p>
              <button
                onClick={onLaunch}
                className="group relative px-8 py-4 bg-lime-green text-charcoal font-bold text-lg rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(128,255,86,0.5)]"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out"></div>
                Coba Demo Interaktif
              </button>
            </div>
          </div>
        </div>

        {/* Komunitas Section */}
        <div id="komunitas" className="w-full max-w-7xl mx-auto px-6 mt-32 relative z-10 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Bergabung dengan Elite</h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Ribuan trader pro dan pemburu gem telah menggunakan SolPulse untuk mendapatkan keunggulan di pasar Solana, Base, dan Ethereum. Bergabunglah dengan grup Discord dan Telegram eksklusif kami.
              </p>
              <div className="flex gap-4">
                <a href="#" className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#5865F2] text-white font-bold hover:bg-[#4752C4] transition-colors shadow-[0_0_20px_rgba(88,101,242,0.3)]">
                  Discord
                </a>
                <a href="#" className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0088cc] text-white font-bold hover:bg-[#0077b5] transition-colors shadow-[0_0_20px_rgba(0,136,204,0.3)]">
                  Telegram
                </a>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 relative">
              <div className="absolute inset-0 bg-neon-purple/20 blur-[100px] pointer-events-none"></div>
              <div className="bg-charcoal-light/50 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
                <div className="text-4xl font-black text-white mb-2">10k+</div>
                <div className="text-sm text-gray-400">Trader Aktif</div>
              </div>
              <div className="bg-charcoal-light/50 border border-white/5 p-6 rounded-2xl backdrop-blur-md translate-y-6">
                <div className="text-4xl font-black text-lime-green mb-2">$2M+</div>
                <div className="text-sm text-gray-400">Volume Terpantau Harian</div>
              </div>
              <div className="bg-charcoal-light/50 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
                <div className="text-4xl font-black text-neon-purple mb-2">24/7</div>
                <div className="text-sm text-gray-400">Pemindaian Keamanan</div>
              </div>
              <div className="bg-charcoal-light/50 border border-white/5 p-6 rounded-2xl backdrop-blur-md translate-y-6">
                <div className="text-4xl font-black text-white mb-2">99%</div>
                <div className="text-sm text-gray-400">Akurasi RugCheck</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10 py-12 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 font-mono">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Activity className="w-5 h-5 text-neon-purple" />
            <span className="text-white font-bold tracking-widest">SOLPULSE</span>
            <span>© 2026</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-lime-green transition-colors">Dokumentasi</a>
            <a href="#" className="hover:text-lime-green transition-colors">API</a>
            <a href="#" className="hover:text-lime-green transition-colors">Twitter</a>
            <div className="flex items-center gap-2 text-lime-green">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-green"></span>
              </span>
              Sistem Operasional
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Spotlight Component for Premium Hover Effects
function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-3xl border border-white/5 bg-charcoal-light/30 backdrop-blur-md transition-all duration-500 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, rgba(127, 86, 255, 0.15), transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}
