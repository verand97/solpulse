import { Token, WhaleAlert, PortfolioAsset, ChartDataPoint, Notification, SwapToken } from './types';

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
  {
    id: '7',
    symbol: 'RAY',
    name: 'Raydium',
    price: 1.82,
    priceChange24h: 3.7,
    volume24h: 92000000,
    liquidity: 55000000,
    marketCap: 475000000,
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    createdAt: Date.now() - 86400000 * 300,
  },
  {
    id: '8',
    symbol: 'ORCA',
    name: 'Orca',
    price: 3.45,
    priceChange24h: -4.2,
    volume24h: 28000000,
    liquidity: 38000000,
    marketCap: 210000000,
    address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    createdAt: Date.now() - 86400000 * 280,
  },
];

export const MOCK_WHALE_ALERTS: WhaleAlert[] = [
  {
    id: 'w1',
    tokenSymbol: 'WIF',
    type: 'sell',
    amountUsd: 1250000,
    timestamp: Date.now() - 120000,
    txHash: '5xRy7kL9pQm3nV2bZ8wT4jFgHsAcDrEf6YuN1oXiP',
    walletAddress: '7aVkR9pQm3nV2bZ8wT4jFgHsAcDrEf6YuN1oXi9Kp',
  },
  {
    id: 'w2',
    tokenSymbol: 'SOL',
    type: 'buy',
    amountUsd: 4500000,
    timestamp: Date.now() - 450000,
    txHash: '2bNz5mK8qR4tY7wV3jPfLsXcGhAe9DnU1oZi6Wm4Wt',
    walletAddress: '3cPz6nL9rS5uZ8xW4kQgMtYdHiB0EoVu2pAj7Xn5Lt',
  },
  {
    id: 'w3',
    tokenSymbol: 'BONK',
    type: 'buy',
    amountUsd: 850000,
    timestamp: Date.now() - 900000,
    txHash: '9qYc4mK8qR4tY7wV3jPfLsXcGhAe9DnU1oZi6p2Xr',
    walletAddress: '8dQz7oM0sT6vA9yX5lRhNuZeIjC1FpWv3qBk8Yo6Mr',
  },
  {
    id: 'w4',
    tokenSymbol: 'POPCAT',
    type: 'buy',
    amountUsd: 520000,
    timestamp: Date.now() - 1800000,
    txHash: '4xTc3mK8qR4tY7wV3jPfLsXcGhAe9DnU1oZi6z1Lm',
    walletAddress: '9eRz8pN1tU7wB0zA6mSiOvAfJkD2GqXw4rCl9Zp7Ns',
  },
  {
    id: 'w5',
    tokenSymbol: 'JUP',
    type: 'sell',
    amountUsd: 2100000,
    timestamp: Date.now() - 3600000,
    txHash: '6gHr2nJ7sP3qX5yB8kTfMuWdIaC0EvNx1oZi6dR4Kp',
    walletAddress: '2fSz9qO2uV8xC1AB7nTjPwBgKlE3HrYx5sDm0Aq8Ot',
  },
  {
    id: 'w6',
    tokenSymbol: 'RAY',
    type: 'buy',
    amountUsd: 780000,
    timestamp: Date.now() - 5400000,
    txHash: '1pQw9mK8qR4tY7wV3jPfLsXcGhAe9DnU1oZi6bN5Vj',
    walletAddress: '4gTz0rP3vW9yD2BC8oUkQxCgLfF4IsZy6tEn1Br9Pu',
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

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'Whale Alert: WIF',
    message: 'Large sell detected — $1.25M WIF dumped by whale wallet.',
    type: 'whale',
    timestamp: Date.now() - 120000,
    read: false,
  },
  {
    id: 'n2',
    title: 'Price Alert: SOL',
    message: 'SOL crossed above $145 — your price alert triggered.',
    type: 'price',
    timestamp: Date.now() - 600000,
    read: false,
  },
  {
    id: 'n3',
    title: 'Whale Alert: SOL',
    message: 'Massive $4.5M SOL buy detected on Raydium.',
    type: 'whale',
    timestamp: Date.now() - 450000,
    read: true,
  },
  {
    id: 'n4',
    title: 'Network Update',
    message: 'Solana TPS recovered to 2,800+ after brief congestion.',
    type: 'system',
    timestamp: Date.now() - 1800000,
    read: true,
  },
];

export const SWAP_TOKENS: SwapToken[] = [
  { symbol: 'SOL', name: 'Solana', balance: 42.5, price: 145.23, icon: 'S' },
  { symbol: 'USDC', name: 'USD Coin', balance: 1250.0, price: 1.0, icon: 'U' },
  { symbol: 'USDT', name: 'Tether', balance: 500.0, price: 1.0, icon: 'T' },
  { symbol: 'WIF', name: 'dogwifhat', balance: 0, price: 2.15, icon: 'W' },
  { symbol: 'BONK', name: 'Bonk', balance: 0, price: 0.000021, icon: 'B' },
  { symbol: 'JUP', name: 'Jupiter', balance: 2500, price: 0.95, icon: 'J' },
  { symbol: 'RAY', name: 'Raydium', balance: 0, price: 1.82, icon: 'R' },
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
