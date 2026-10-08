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
  color = '#10B981', 
  height = 300 
}) => {
  const minMax = useMemo(() => {
    if (!data.length) return { min: 0, max: 0 };
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return { min: Math.max(0, min - padding), max: max + padding };
  }, [data]);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="tokenChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.18} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1E" />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#52525E', fontSize: 10, fontFamily: 'monospace' }}
            minTickGap={30}
          />
          <YAxis 
            domain={[minMax.min, minMax.max]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#52525E', fontSize: 10, fontFamily: 'monospace' }}
            tickFormatter={(val) => val < 0.0001 ? val.toExponential(1) : (val < 0.01 ? val.toFixed(4) : val.toFixed(2))}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111113', border: '1px solid #222226', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}
            itemStyle={{ color: '#EEEFF2' }}
            formatter={(value: number) => [value < 0.0001 ? value.toExponential(3) : (value < 0.01 ? value.toFixed(6) : value.toFixed(2)), 'Price']}
            labelStyle={{ color: '#52525E', marginBottom: '2px' }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            strokeWidth={1.5}
            fillOpacity={1} 
            fill="url(#tokenChartGradient)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
