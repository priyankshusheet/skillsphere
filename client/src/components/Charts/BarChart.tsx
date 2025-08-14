import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '../../utils/cn';

interface DataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface BarChartProps {
  data: DataPoint[];
  bars: Array<{
    key: string;
    color: string;
    fill?: string;
  }>;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  horizontal?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  bars,
  title,
  xAxisLabel,
  yAxisLabel,
  height = 300,
  className,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  horizontal = false,
}) => {
  const ChartComponent = horizontal ? RechartsBarChart : RechartsBarChart;
  const BarComponent = horizontal ? Bar : Bar;

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent 
          data={data} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={horizontal ? 'horizontal' : 'vertical'}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
          <XAxis 
            dataKey={horizontal ? 'value' : 'name'}
            label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 0 } : undefined}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            dataKey={horizontal ? 'name' : 'value'}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            tick={{ fontSize: 12 }}
          />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          {bars.map((bar, _index) => (
            <BarComponent
              key={bar.key}
              dataKey={bar.key}
              fill={bar.fill || bar.color}
              stroke={bar.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};
