import { Token, WhaleAlert, PortfolioAsset, ChartDataPoint, Notification, SwapToken } from './types';

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
