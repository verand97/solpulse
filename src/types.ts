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
}

export interface PortfolioAsset {
  token: Token;
  balance: number;
  avgBuyPrice: number;
}
