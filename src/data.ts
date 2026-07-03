import { Token, WhaleAlert, PortfolioAsset, ChartDataPoint } from './types';

export const MOCK_TOKENS: Token[] = [
  {
    id: '1',
    symbol: 'SOL',
    name: 'Solana',
    price: 145.23,
    priceChange24h: 5.2,
    volume24h: 2450000000,
    liquidity: 500000000,
    marketCap: 65000000000,
    address: 'So11111111111111111111111111111111111111112',
    createdAt: Date.now() - 86400000 * 365,
  },
  {
    id: '2',
    symbol: 'WIF',
    name: 'dogwifhat',
    price: 2.15,
    priceChange24h: -12.4,
    volume24h: 350000000,
    liquidity: 45000000,
    marketCap: 2150000000,
    address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    createdAt: Date.now() - 86400000 * 120,
  },
  {
    id: '3',
    symbol: 'BONK',
    name: 'Bonk',
    price: 0.000021,
    priceChange24h: 15.8,
    volume24h: 180000000,
    liquidity: 60000000,
    marketCap: 1400000000,
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    createdAt: Date.now() - 86400000 * 200,
  },
  {
    id: '4',
    symbol: 'JUP',
    name: 'Jupiter',
    price: 0.95,
    priceChange24h: 2.1,
    volume24h: 120000000,
    liquidity: 85000000,
    marketCap: 1280000000,
    address: 'JUPyiwrYPRn4aWe1w53xR6qF4X4H6CAtN6C65c7RzWJ',
    createdAt: Date.now() - 86400000 * 60,
  },
  {
    id: '5',
    symbol: 'PYTH',
    name: 'Pyth Network',
    price: 0.38,
    priceChange24h: -1.5,
    volume24h: 45000000,
    liquidity: 30000000,
    marketCap: 570000000,
    address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3AkTvww45bLwX',
    createdAt: Date.now() - 86400000 * 150,
  },
  {
    id: '6',
    symbol: 'POPCAT',
    name: 'Popcat',
    price: 0.45,
    priceChange24h: 45.2,
    volume24h: 85000000,
    liquidity: 12000000,
    marketCap: 440000000,
    address: '7GCihgDB8fe6KNjn2TwD4X9n8x5gB8vWjCj3V93U6V5r',
    createdAt: Date.now() - 86400000 * 10,
  },
];

export const MOCK_WHALE_ALERTS: WhaleAlert[] = [
  {
    id: 'w1',
    tokenSymbol: 'WIF',
    type: 'sell',
    amountUsd: 1250000,
    timestamp: Date.now() - 120000,
    txHash: '5xRy...k9Pq',
  },
  {
    id: 'w2',
    tokenSymbol: 'SOL',
    type: 'buy',
    amountUsd: 4500000,
    timestamp: Date.now() - 450000,
    txHash: '2bNz...m4Wt',
  },
  {
    id: 'w3',
    tokenSymbol: 'BONK',
    type: 'buy',
    amountUsd: 850000,
    timestamp: Date.now() - 900000,
    txHash: '9qYc...p2Xr',
  },
  {
    id: 'w4',
    tokenSymbol: 'POPCAT',
    type: 'buy',
    amountUsd: 520000,
    timestamp: Date.now() - 1800000,
    txHash: '4xTc...z1Lm',
  },
];

export const MOCK_PORTFOLIO: PortfolioAsset[] = [
  {
    token: MOCK_TOKENS[0], // SOL
    balance: 45.5,
    avgBuyPrice: 110.5,
  },
  {
    token: MOCK_TOKENS[2], // BONK
    balance: 15000000,
    avgBuyPrice: 0.000015,
  },
  {
    token: MOCK_TOKENS[3], // JUP
    balance: 2500,
    avgBuyPrice: 1.1,
  },
];

export const generateMockChartData = (startPrice: number, points: number = 50): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  let currentPrice = startPrice;
  const now = new Date();
  
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60000); // 5 minute intervals
    // Random walk
    const change = (Math.random() - 0.5) * 0.02 * currentPrice; 
    currentPrice += change;
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: Number(currentPrice.toFixed(4)),
    });
  }
  return data;
};
