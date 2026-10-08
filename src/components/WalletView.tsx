import React, { useState, useMemo } from 'react';
import {
  Wallet as WalletIcon,
  Copy,
  ExternalLink,
  ArrowRightLeft,
  Check,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { formatCurrency, formatAddress, cn } from '../utils';
import { SwapToken, PortfolioAsset } from '../types';

interface WalletViewProps {
  swapTokens: SwapToken[];
  portfolio: PortfolioAsset[];
}

export const WalletView: React.FC<WalletViewProps> = ({ swapTokens, portfolio }) => {
  const { connected: walletConnected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const address = publicKey?.toBase58() || '7aVkR9pQm3nV2bZ8wT4jFgHsAcDrEf6YuN1oXi9Kp';
  const totalValue = portfolio.reduce((acc, item) => acc + (item.balance * item.token.price), 0);

  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [payToken, setPayToken] = useState<SwapToken>(swapTokens[0] || { symbol: 'SOL', name: 'Solana', balance: 14.5, price: 145, icon: 'S' });
  const [receiveToken, setReceiveToken] = useState<SwapToken>(swapTokens[1] || { symbol: 'USDC', name: 'USD Coin', balance: 2500, price: 1.0, icon: 'U' });
  const [showPaySelect, setShowPaySelect] = useState(false);
  const [showReceiveSelect, setShowReceiveSelect] = useState(false);
  const [copied, setCopied] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);

  const handlePayChange = (val: string) => {
    if (val && !/^\d*\.?\d*$/.test(val)) return;
    setPayAmount(val);
    if (val && !isNaN(Number(val))) {
      const usdValue = Number(val) * payToken.price;
      const received = usdValue / receiveToken.price;
      setReceiveAmount(received < 0.01 ? received.toFixed(6) : received.toFixed(4));
    } else {
      setReceiveAmount('');
    }
  };

  const handleReceiveChange = (val: string) => {
    if (val && !/^\d*\.?\d*$/.test(val)) return;
    setReceiveAmount(val);
    if (val && !isNaN(Number(val))) {
      const usdValue = Number(val) * receiveToken.price;
      const needed = usdValue / payToken.price;
      setPayAmount(needed < 0.01 ? needed.toFixed(6) : needed.toFixed(4));
    } else {
      setPayAmount('');
    }
  };

  const handleSwapTokens = () => {
    const tempToken = payToken;
    const tempAmount = payAmount;
    setPayToken(receiveToken);
    setReceiveToken(tempToken);
    setPayAmount(receiveAmount);
    setReceiveAmount(tempAmount);
  };

  const selectPayToken = (token: SwapToken) => {
    if (token.symbol === receiveToken.symbol) {
      handleSwapTokens();
    } else {
      setPayToken(token);
      handlePayChange(payAmount);
    }
    setShowPaySelect(false);
  };

  const selectReceiveToken = (token: SwapToken) => {
    if (token.symbol === payToken.symbol) {
      handleSwapTokens();
    } else {
      setReceiveToken(token);
      if (payAmount && !isNaN(Number(payAmount))) {
        const usdValue = Number(payAmount) * payToken.price;
        const received = usdValue / token.price;
        setReceiveAmount(received < 0.01 ? received.toFixed(6) : received.toFixed(4));
      }
    }
    setShowReceiveSelect(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    if (!payAmount || Number(payAmount) <= 0) return;
    setSwapSuccess(true);
    setTimeout(() => {
      setSwapSuccess(false);
      setPayAmount('');
      setReceiveAmount('');
    }, 2500);
  };

  const insufficientBalance = Number(payAmount) > payToken.balance;
  const canSwap = payAmount && Number(payAmount) > 0 && !insufficientBalance;

  const exchangeRate = useMemo(() => {
    if (!payToken || !receiveToken) return '';
    const rate = payToken.price / receiveToken.price;
    return `1 ${payToken.symbol} ≈ ${rate < 0.01 ? rate.toFixed(6) : rate.toFixed(4)} ${receiveToken.symbol}`;
  }, [payToken, receiveToken]);

  // Disconnected state
  if (!walletConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-[#0A0A0B]">
        <div className="max-w-md w-full bg-[#111113] border border-[#222226] rounded-lg p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#17171A] border border-[#222226] flex items-center justify-center mx-auto mb-4 text-[#8A8A96]">
            <WalletIcon size={20} />
          </div>
          <h2 className="text-[16px] font-bold text-[#EEEFF2] mb-1.5">Connect Solana Wallet</h2>
          <p className="text-[12px] text-[#52525E] mb-6 leading-relaxed">
            Connect your Phantom, Solflare, or Backpack wallet to inspect portfolio balances and execute zero-fee DEX swaps directly on mainnet.
          </p>
          <button
            onClick={() => setVisible(true)}
            className="w-full h-9 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium text-[13px] transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B] overflow-y-auto custom-scrollbar">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#222226] bg-[#0A0A0B]">
        <div>
          <h1 className="text-[14px] font-bold text-[#EEEFF2] uppercase tracking-wide">Wallet & DEX Swap</h1>
          <p className="text-[11px] text-[#52525E]">Direct on-chain custody and liquidity execution</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[11px] text-[#8A8A96] font-mono">Connected</span>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Top Grid: Overview Card & Swap Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Account Overview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#111113] border border-[#222226] rounded-lg p-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-[#52525E] uppercase font-mono tracking-wider">Account Overview</span>
                <div className="flex items-center gap-1.5 bg-[#17171A] border border-[#222226] rounded px-2 py-0.5">
                  <span className="text-[11px] text-[#8A8A96] font-mono">{formatAddress(address, 5)}</span>
                  <button onClick={handleCopy} className="text-[#52525E] hover:text-[#EEEFF2] transition-colors">
                    {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[11px] text-[#52525E] uppercase mb-1">Total Net Worth</p>
                <div className="text-[32px] font-bold font-mono text-[#EEEFF2] tracking-tight">
                  {formatCurrency(totalValue)}
                </div>
                <p className="text-[12px] font-mono text-[#52525E] mt-0.5">
                  ≈ {(totalValue / 145.23).toFixed(3)} SOL
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[#17171A]">
              <a
                href={`${import.meta.env.VITE_SOLSCAN_URL || 'https://solscan.io'}/account/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-3 rounded bg-[#17171A] hover:bg-[#222226] text-[#8A8A96] hover:text-[#EEEFF2] border border-[#222226] text-[11.5px] font-medium flex items-center gap-1.5 transition-colors"
              >
                Solscan Explorer <ExternalLink size={11} />
              </a>
              <button
                onClick={handleCopy}
                className="h-8 px-3 rounded bg-[#17171A] hover:bg-[#222226] text-[#8A8A96] hover:text-[#EEEFF2] border border-[#222226] text-[11.5px] font-medium flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                Copy Public Key
              </button>
            </div>
          </div>

          {/* Quick Swap Panel (5 cols) */}
          <div className="lg:col-span-5 bg-[#111113] border border-[#222226] rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-[#EEEFF2] uppercase tracking-wide flex items-center gap-1.5">
                <Zap size={13} className="text-blue-400" /> Instant Swap
              </span>
              <span className="text-[10px] text-[#52525E] font-mono">Slippage: 0.5%</span>
            </div>

            <div className="space-y-2">
              {/* Pay Input */}
              <div className="bg-[#17171A] border border-[#222226] rounded-md p-3">
                <div className="flex justify-between text-[11px] text-[#52525E] mb-1.5 font-mono">
                  <span>You Pay</span>
                  <div className="flex items-center gap-1">
                    <span>Bal: {payToken.balance.toLocaleString()}</span>
                    <button
                      onClick={() => handlePayChange(payToken.balance.toString())}
                      className="text-blue-400 hover:text-blue-300 uppercase text-[9px] font-bold ml-1"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={payAmount}
                    onChange={(e) => handlePayChange(e.target.value)}
                    className={cn(
                      'bg-transparent text-[20px] font-mono text-[#EEEFF2] outline-none w-full min-w-0 font-bold',
                      insufficientBalance && payAmount && 'text-red-400'
                    )}
                  />

                  {/* Token select */}
                  <div className="relative">
                    <button
                      onClick={() => { setShowPaySelect(!showPaySelect); setShowReceiveSelect(false); }}
                      className="flex items-center gap-1.5 bg-[#222226] hover:bg-[#2A2A30] px-2.5 py-1 rounded text-[#EEEFF2] text-[12px] font-semibold transition-colors"
                    >
                      <span>{payToken.symbol}</span>
                      <ChevronDown size={12} className="text-[#52525E]" />
                    </button>

                    {showPaySelect && (
                      <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#17171A] border border-[#222226] rounded-md shadow-xl z-50 overflow-hidden divide-y divide-[#222226]">
                        {swapTokens.map(token => (
                          <button
                            key={token.symbol}
                            onClick={() => selectPayToken(token)}
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#222226] transition-colors',
                              token.symbol === payToken.symbol && 'bg-[#222226]'
                            )}
                          >
                            <span className="text-[12px] font-semibold text-[#EEEFF2]">{token.symbol}</span>
                            <span className="text-[11px] font-mono text-[#52525E]">{token.balance}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Swap Switcher */}
              <div className="flex justify-center -my-1 relative z-10">
                <button
                  onClick={handleSwapTokens}
                  className="w-7 h-7 rounded-full bg-[#222226] hover:bg-[#2A2A30] text-[#8A8A96] hover:text-[#EEEFF2] border border-[#2A2A30] flex items-center justify-center transition-colors shadow-sm"
                >
                  <ArrowRightLeft size={11} className="rotate-90" />
                </button>
              </div>

              {/* Receive Input */}
              <div className="bg-[#17171A] border border-[#222226] rounded-md p-3">
                <div className="flex justify-between text-[11px] text-[#52525E] mb-1.5 font-mono">
                  <span>You Receive</span>
                  <span>Bal: {receiveToken.balance.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={receiveAmount}
                    onChange={(e) => handleReceiveChange(e.target.value)}
                    className="bg-transparent text-[20px] font-mono text-[#EEEFF2] outline-none w-full min-w-0 font-bold"
                  />

                  {/* Token select */}
                  <div className="relative">
                    <button
                      onClick={() => { setShowReceiveSelect(!showReceiveSelect); setShowPaySelect(false); }}
                      className="flex items-center gap-1.5 bg-[#222226] hover:bg-[#2A2A30] px-2.5 py-1 rounded text-[#EEEFF2] text-[12px] font-semibold transition-colors"
                    >
                      <span>{receiveToken.symbol}</span>
                      <ChevronDown size={12} className="text-[#52525E]" />
                    </button>

                    {showReceiveSelect && (
                      <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#17171A] border border-[#222226] rounded-md shadow-xl z-50 overflow-hidden divide-y divide-[#222226]">
                        {swapTokens.map(token => (
                          <button
                            key={token.symbol}
                            onClick={() => selectReceiveToken(token)}
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#222226] transition-colors',
                              token.symbol === receiveToken.symbol && 'bg-[#222226]'
                            )}
                          >
                            <span className="text-[12px] font-semibold text-[#EEEFF2]">{token.symbol}</span>
                            <span className="text-[11px] font-mono text-[#52525E]">{token.balance}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {exchangeRate && (
              <div className="text-[11px] font-mono text-[#52525E] text-center my-2">
                {exchangeRate}
              </div>
            )}

            {insufficientBalance && payAmount && (
              <p className="text-[11px] text-red-400 flex items-center gap-1 my-1.5">
                <AlertTriangle size={11} /> Insufficient {payToken.symbol} balance
              </p>
            )}

            <button
              onClick={handleSwap}
              disabled={!canSwap}
              className={cn(
                'w-full h-9 rounded font-medium text-[12.5px] transition-colors mt-2',
                swapSuccess
                  ? 'bg-green-500 text-white'
                  : canSwap
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-[#17171A] text-[#52525E] cursor-not-allowed border border-[#222226]'
              )}
            >
              {swapSuccess ? '✓ Order Confirmed on Solana' : insufficientBalance ? 'Insufficient Balance' : 'Swap via Jupiter Routing'}
            </button>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="bg-[#111113] border border-[#222226] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-[#222226] bg-[#0A0A0B] flex items-center justify-between">
            <h2 className="text-[12px] font-bold text-[#EEEFF2] uppercase tracking-wide">Wallet Holdings</h2>
            <span className="text-[11px] font-mono text-[#52525E]">{portfolio.length} assets</span>
          </div>

          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-[#17171A] font-mono text-[10px] text-[#52525E] uppercase tracking-wide bg-[#0D0D0F]">
                <th className="px-5 py-2.5">Asset</th>
                <th className="px-5 py-2.5 text-right">Balance</th>
                <th className="px-5 py-2.5 text-right">Value (USD)</th>
                <th className="px-5 py-2.5 text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17171A] text-[#8A8A96]">
              {portfolio.map(item => {
                const value = item.balance * item.token.price;
                const cost = item.balance * item.avgBuyPrice;
                const pnl = value - cost;
                const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                const isGain = pnl >= 0;

                return (
                  <tr key={item.token.id} className="hover:bg-[#17171A] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        {item.token.imageUrl ? (
                          <img src={item.token.imageUrl} alt={item.token.symbol} className="w-6 h-6 rounded-full object-cover border border-[#222226]" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#17171A] border border-[#222226] flex items-center justify-center font-bold text-[10px] text-[#EEEFF2]">
                            {item.token.symbol[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#EEEFF2] text-[12.5px]">{item.token.symbol}</div>
                          <div className="text-[10px] text-[#52525E]">{item.token.name}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3 text-right font-mono">
                      <div className="text-[#EEEFF2]">{item.balance.toLocaleString()}</div>
                      <div className="text-[10px] text-[#52525E]">@ ${item.avgBuyPrice.toFixed(2)}</div>
                    </td>

                    <td className="px-5 py-3 text-right font-mono text-[#EEEFF2] font-medium">
                      {formatCurrency(value)}
                    </td>

                    <td className="px-5 py-3 text-right font-mono">
                      <div className={cn('text-[12px] font-semibold', isGain ? 'text-green-400' : 'text-red-400')}>
                        {isGain ? '+' : ''}{formatCurrency(pnl)}
                      </div>
                      <div className={cn('text-[10px]', isGain ? 'text-green-400/80' : 'text-red-400/80')}>
                        {isGain ? '+' : ''}{pnlPct.toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
