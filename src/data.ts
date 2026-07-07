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

export const generateMockChartData = (currentPrice: number, priceChangePct: number, points: number = 50): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  
  // Calculate what the price was originally based on the percentage change
  // priceChangePct is in percentage, e.g., 5.2 means +5.2%
  const startPrice = currentPrice / (1 + priceChangePct / 100);
  
  let simulatedPrice = startPrice;
  const trendPerPoint = (currentPrice - startPrice) / points;
  
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30 * 60000); // 30 minute intervals
    
    if (i === points) {
      simulatedPrice = startPrice;
    } else if (i === 0) {
      simulatedPrice = currentPrice;
    } else {
      // Add trend + random volatility (max 5% of current price per step)
      const volatility = currentPrice * 0.05 * (Math.random() - 0.5);
      simulatedPrice = simulatedPrice + trendPerPoint + volatility;
      
      // Ensure price doesn't go below zero
      if (simulatedPrice <= 0) simulatedPrice = currentPrice * 0.01;
    }
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: simulatedPrice, // Keep full precision, formatting happens in TokenChart
    });
  }
  return data;
};
