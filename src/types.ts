export interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChange1h?: number;
  priceChange5m?: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  fdv?: number;
  address: string;
  pairAddress?: string;
  chainId: string;
  dexId?: string;
  createdAt: number;
  imageUrl?: string;
  buys24h?: number;
  sells24h?: number;
  websites?: { url: string; label: string }[];
  socials?: { url: string; type: string }[];
}

export interface ChartDataPoint {
  time: string;
  price: number;
}

export interface WhaleAlert {
  id: string;
  tokenSymbol: string;
  type: 'buy' | 'sell' | 'transfer';
  amountUsd: number;
  timestamp: number;
  txHash: string;
  walletAddress: string;
  walletLabel?: string;
  dex?: string;
  isRealOnchain?: boolean;
}

export interface TrackedWhale {
  address: string;
  label: string;
  category: 'smart-money' | 'whale' | 'dex-mm' | 'exchange' | 'kol';
  notes?: string;
  solBalance?: number;
  estimatedValueUsd?: number;
  lastActive?: number;
  isCustom?: boolean;
}

export interface WhaleTransaction {
  id: string;
  signature: string;
  walletAddress: string;
  walletLabel?: string;
  timestamp: number;
  status: 'success' | 'failed';
  type: 'buy' | 'sell' | 'transfer' | 'dex_swap';
  slot?: number;
  memo?: string;
  explorerUrl: string;
}

export interface PortfolioAsset {
  token: Token;
  balance: number;
  avgBuyPrice: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'whale' | 'price' | 'system';
  timestamp: number;
  read: boolean;
}

export type SwapToken = {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  icon: string;
  imageUrl?: string;
};

export interface MLScoreFactor {
  factor: string;
  detail: string;
  impact: 'positive' | 'negative' | 'caution' | 'neutral';
}

export interface MLScreenedToken {
  id?: number;
  token_address: string;
  symbol: string;
  name?: string;
  chain: string;
  model_version: string;
  calculated_at: string;
  risk_score: number;
  potential_score: number;
  anomaly_score: number;
  passes_hard_rules: boolean | number;
  rejected_rule_reason?: string | null;
  recommendation: 'STRONG_BUY_CANDIDATE' | 'ACCUMULATE_WATCH' | 'MONITOR' | 'AVOID_HIGH_RISK' | 'REJECT_UNSAFE' | string;
  top_shap_reasons?: MLScoreFactor[];
  price_usd?: number;
  liquidity_usd?: number;
  volume_24h?: number;
  price_change_24h?: number;
  initial_price_usd?: number;
  initial_liquidity_usd?: number;
  imageUrl?: string;
}

