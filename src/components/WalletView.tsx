import React, { useState, useMemo } from 'react';
import { Wallet as WalletIcon, Copy, ExternalLink, QrCode, ArrowRightLeft, Check, ChevronDown, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatAddress, cn } from '../utils';
import { MOCK_PORTFOLIO, SWAP_TOKENS } from '../data';
import { SwapToken } from '../types';

interface WalletViewProps {
  walletConnected: boolean;
  onConnect: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ walletConnected, onConnect }) => {
  const address = '7aVkR9pQm3nV2bZ8wT4jFgHsAcDrEf6YuN1oXi9Kp';
  const totalValue = MOCK_PORTFOLIO.reduce((acc, item) => acc + (item.balance * item.token.price), 0);

  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [payToken, setPayToken] = useState<SwapToken>(SWAP_TOKENS[0]); // SOL
  const [receiveToken, setReceiveToken] = useState<SwapToken>(SWAP_TOKENS[1]); // USDC
  const [showPaySelect, setShowPaySelect] = useState(false);
  const [showReceiveSelect, setShowReceiveSelect] = useState(false);
  const [copied, setCopied] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);

  // Calculate receive amount based on pay amount and token prices
  const handlePayChange = (val: string) => {
    // Only allow numbers and dots
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
      // Recalculate
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
    }, 2000);
  };

  const insufficientBalance = Number(payAmount) > payToken.balance;
  const canSwap = payAmount && Number(payAmount) > 0 && !insufficientBalance;

  const exchangeRate = useMemo(() => {
    if (!payToken || !receiveToken) return '';
    const rate = payToken.price / receiveToken.price;
    return `1 ${payToken.symbol} = ${rate < 0.01 ? rate.toFixed(6) : rate.toFixed(4)} ${receiveToken.symbol}`;
  }, [payToken, receiveToken]);

  // Not connected state
  if (!walletConnected) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-neon-purple to-lime-green flex items-center justify-center mx-auto mb-6">
            <WalletIcon size={40} className="text-charcoal" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Connect your Solana wallet to view balances, manage assets, and swap tokens instantly.</p>
          <button
            onClick={onConnect}
            className="bg-neon-purple hover:bg-neon-purple-hover text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-[0_0_20px_rgba(127,86,255,0.3)]"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Wallet</h2>
        <p className="text-gray-400 text-sm">Manage your connected digital assets and execute instant swaps.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet Card */}
        <div className="bg-linear-to-br from-neon-purple to-neon-purple-hover rounded-2xl p-8 text-white relative overflow-hidden shadow-[0_0_30px_rgba(127,86,255,0.2)]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <WalletIcon size={120} />
          </div>
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <span className="font-medium text-white/80">Total Balance</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors"
              >
                {formatAddress(address)}
                {copied ? <Check size={14} className="text-lime-green" /> : <Copy size={14} />}
              </button>
            </div>
            <h3 className="text-5xl font-bold font-mono tracking-tight mb-2">
              {formatCurrency(totalValue)}
            </h3>
            <p className="text-white/80 text-sm">≈ {(totalValue / 145.23).toFixed(2)} SOL</p>
            
            <div className="flex gap-4 mt-8">
              <a
                href={`https://solscan.io/account/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white text-neon-purple font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors text-center flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} /> View on Solscan
              </a>
              <button
                onClick={handleCopy}
                className="flex-1 bg-charcoal/20 backdrop-blur-sm border border-white/20 text-white font-bold py-3 rounded-xl hover:bg-charcoal/30 transition-colors flex items-center justify-center gap-2"
              >
                <QrCode size={18} /> Copy Address
              </button>
            </div>
          </div>
        </div>

        {/* Swap Card */}
        <div className="bg-charcoal-light rounded-2xl border border-charcoal-lighter p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Swap</h3>
          <div className="flex-1 flex flex-col justify-center space-y-4">
            {/* Pay */}
            <div className="bg-charcoal p-4 rounded-xl border border-charcoal-lighter relative">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">You pay</span>
                <span className="text-gray-400">Balance: {payToken.balance.toLocaleString()} {payToken.symbol}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <input
                  id="pay-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => handlePayChange(e.target.value)}
                  className={cn(
                    "bg-transparent text-2xl font-mono text-white outline-none w-full min-w-0",
                    insufficientBalance && payAmount && "text-danger"
                  )}
                />
                <div className="relative">
                  <button
                    onClick={() => { setShowPaySelect(!showPaySelect); setShowReceiveSelect(false); }}
                    className="flex items-center gap-2 bg-charcoal-light px-3 py-1.5 rounded-lg text-white font-medium hover:bg-charcoal-lighter transition-colors whitespace-nowrap"
                  >
                    <div className="w-5 h-5 rounded-full bg-linear-to-br from-neon-purple to-lime-green flex items-center justify-center text-[10px] font-bold text-charcoal">
                      {payToken.icon}
                    </div>
                    {payToken.symbol}
                    <ChevronDown size={14} />
                  </button>
                  {showPaySelect && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-charcoal-light border border-charcoal-lighter rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                      {SWAP_TOKENS.filter(t => t.symbol !== receiveToken.symbol).map(token => (
                        <button
                          key={token.symbol}
                          onClick={() => selectPayToken(token)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-charcoal-lighter transition-colors text-left",
                            token.symbol === payToken.symbol && "bg-neon-purple/10"
                          )}
                        >
                          <div className="w-6 h-6 rounded-full bg-linear-to-br from-neon-purple to-lime-green flex items-center justify-center text-[10px] font-bold text-charcoal">
                            {token.icon}
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{token.symbol}</p>
                            <p className="text-xs text-gray-500">{token.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {insufficientBalance && payAmount && (
                <p className="text-xs text-danger mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Insufficient balance
                </p>
              )}
            </div>
            
            {/* Swap toggle */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                id="swap-toggle"
                onClick={handleSwapTokens}
                className="bg-charcoal-lighter p-2 rounded-full border-4 border-charcoal-light text-gray-400 hover:text-white hover:bg-neon-purple transition-all"
              >
                <ArrowRightLeft size={16} className="rotate-90" />
              </button>
            </div>

            {/* Receive */}
            <div className="bg-charcoal p-4 rounded-xl border border-charcoal-lighter relative">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">You receive</span>
                <span className="text-gray-400">Balance: {receiveToken.balance.toLocaleString()} {receiveToken.symbol}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <input
                  id="receive-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={receiveAmount}
                  onChange={(e) => handleReceiveChange(e.target.value)}
                  className="bg-transparent text-2xl font-mono text-white outline-none w-full min-w-0"
                />
                <div className="relative">
                  <button
                    onClick={() => { setShowReceiveSelect(!showReceiveSelect); setShowPaySelect(false); }}
                    className="flex items-center gap-2 bg-neon-purple px-3 py-1.5 rounded-lg text-white font-medium hover:bg-neon-purple-hover transition-colors whitespace-nowrap"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                      {receiveToken.icon}
                    </div>
                    {receiveToken.symbol}
                    <ChevronDown size={14} />
                  </button>
                  {showReceiveSelect && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-charcoal-light border border-charcoal-lighter rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                      {SWAP_TOKENS.filter(t => t.symbol !== payToken.symbol).map(token => (
                        <button
                          key={token.symbol}
                          onClick={() => selectReceiveToken(token)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-charcoal-lighter transition-colors text-left",
                            token.symbol === receiveToken.symbol && "bg-neon-purple/10"
                          )}
                        >
                          <div className="w-6 h-6 rounded-full bg-linear-to-br from-neon-purple to-lime-green flex items-center justify-center text-[10px] font-bold text-charcoal">
                            {token.icon}
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{token.symbol}</p>
                            <p className="text-xs text-gray-500">{token.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Exchange rate */}
            {payAmount && receiveAmount && (
              <p className="text-xs text-gray-500 text-center">{exchangeRate}</p>
            )}
            
            <button
              id="swap-button"
              onClick={handleSwap}
              disabled={!canSwap}
              className={cn(
                "w-full font-bold py-4 rounded-xl transition-all mt-2",
                swapSuccess
                  ? "bg-lime-green text-charcoal"
                  : canSwap
                    ? "bg-neon-purple hover:bg-neon-purple-hover text-white shadow-[0_0_15px_rgba(127,86,255,0.3)]"
                    : "bg-charcoal-lighter text-gray-500 cursor-not-allowed"
              )}
            >
              {swapSuccess ? '✓ Swap Successful!' : insufficientBalance ? 'Insufficient Balance' : 'Swap Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Your Holdings</h3>
        <div className="bg-charcoal-light rounded-xl border border-charcoal-lighter overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-charcoal border-b border-charcoal-lighter text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 text-left font-medium">Asset</th>
                <th className="px-6 py-3 text-right font-medium">Balance</th>
                <th className="px-6 py-3 text-right font-medium">Value</th>
                <th className="px-6 py-3 text-right font-medium">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-lighter">
              {MOCK_PORTFOLIO.map(item => {
                const value = item.balance * item.token.price;
                const cost = item.balance * item.avgBuyPrice;
                const pnl = value - cost;
                const pnlPct = (pnl / cost) * 100;
                const isGain = pnl >= 0;

                return (
                  <tr key={item.token.id} className="hover:bg-charcoal-lighter/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-charcoal border border-charcoal-lighter flex items-center justify-center font-bold text-xs text-white">
                          {item.token.symbol[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{item.token.symbol}</div>
                          <div className="text-xs text-gray-500">{item.token.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono text-white">{item.balance.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">@ {formatCurrency(item.avgBuyPrice)} avg</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-white">
                      {formatCurrency(value)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={cn("font-mono font-medium", isGain ? "text-lime-green" : "text-danger")}>
                        {isGain ? '+' : ''}{formatCurrency(pnl)}
                      </div>
                      <div className={cn("text-xs", isGain ? "text-lime-green/70" : "text-danger/70")}>
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
