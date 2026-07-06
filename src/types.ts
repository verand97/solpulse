export interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  address: string;
  createdAt: number;
  imageUrl?: string;
}

export interface ChartDataPoint {
  time: string;
  price: number;
}

export interface WhaleAlert {
  id: string;
  tokenSymbol: string;
  type: 'buy' | 'sell';
  amountUsd: number;
  timestamp: number;
  txHash: string;
  walletAddress: string;
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
};
