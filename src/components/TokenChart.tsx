import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartDataPoint } from '../types';

interface TokenChartProps {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
}

export const TokenChart: React.FC<TokenChartProps> = ({ 
  data, 
  color = '#80FF56', 
  height = 300 
}) => {
  const minMax = useMemo(() => {
    if (!data.length) return { min: 0, max: 0 };
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return { min: min - padding, max: max + padding };
  }, [data]);

  const formatChartPrice = (val: number) => {
    if (val >= 1) return val.toFixed(2);
    if (val >= 0.01) return val.toFixed(4);
    if (val >= 0.0001) return val.toFixed(6);
    return val.toExponential(2); // Use exponential for extremely small numbers, or 8 decimals
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#383A40" />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            minTickGap={30}
          />
          <YAxis 
            domain={[minMax.min, minMax.max]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickFormatter={(val) => val < 0.0001 ? val.toExponential(1) : (val < 0.01 ? val.toFixed(4) : val.toFixed(2))}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#2B2D31', border: '1px solid #383A40', borderRadius: '8px' }}
            itemStyle={{ color: '#F2F3F5' }}
            formatter={(value: number) => [value < 0.0001 ? value.toExponential(3) : (value < 0.01 ? value.toFixed(6) : value.toFixed(2)), 'Price']}
            labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
