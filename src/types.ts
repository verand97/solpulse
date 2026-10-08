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
