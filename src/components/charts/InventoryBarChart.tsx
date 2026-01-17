import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CategoryInventory } from '@/hooks/useInventoryData';

interface InventoryBarChartProps {
  data: CategoryInventory[];
  dataKey?: 'quantity' | 'value';
}

const COLORS = [
  'hsl(221, 83%, 53%)', // Primary blue
  'hsl(142, 76%, 36%)', // Success green
  'hsl(38, 92%, 50%)',  // Warning orange
  'hsl(280, 65%, 60%)', // Purple
  'hsl(199, 89%, 48%)', // Info blue
];

export const InventoryBarChart: React.FC<InventoryBarChartProps> = ({
  data,
  dataKey = 'quantity',
}) => {
  const formatValue = (value: number) => {
    if (dataKey === 'value') {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Inventory by Category
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(220, 13%, 91%)"
              vertical={false}
            />
            <XAxis
              dataKey="category"
              tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(220, 13%, 91%)' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                dataKey === 'value' ? `$${(value / 1000).toFixed(0)}k` : value
              }
            />
            <Tooltip
              cursor={{ fill: 'hsl(221, 91%, 96%)' }}
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 13%, 91%)',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number) => [formatValue(value), dataKey === 'value' ? 'Value' : 'Quantity']}
            />
            <Bar
              dataKey={dataKey}
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
