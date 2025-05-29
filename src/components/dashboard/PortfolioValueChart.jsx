import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { format, subDays } from "date-fns";

export default function PortfolioValueChart({ assets }) {
  // Generate demo chart data based on current portfolio value
  // In a real app, this would be fetched from historical data
  const chartData = useMemo(() => {
    if (!assets || assets.length === 0) {
      return [];
    }
    
    const currentValue = assets.reduce((sum, asset) => {
      return sum + asset.quantity * (asset.current_price || 0);
    }, 0);
    
    // Generate sample data for the last 30 days
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = subDays(new Date(), i);
      
      // Add some randomness to create a realistic looking chart
      // Fluctuate around current value with some trend
      const dayFactor = 1 + ((Math.random() * 0.04) - 0.02); // Random factor between 0.98 and 1.02
      const trendFactor = 1 - (i * 0.005); // Slight upward trend (older dates have lower values)
      
      data.push({
        date: format(date, "MMM d"),
        value: Math.round(currentValue * dayFactor * trendFactor * 100) / 100
      });
    }
    
    return data;
  }, [assets]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">{label}</div>
            <div className="font-medium text-right">
              ${payload[0].value.toLocaleString()}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
        <CardDescription>
          Your investment growth over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Add assets to see your portfolio performance
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}