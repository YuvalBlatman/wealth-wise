import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Percent } from "lucide-react";
import { formatCurrency } from '@/components/utils/format-utils';

export default function PortfolioSummary({ assets }) {
  const summary = useMemo(() => {
    if (!assets || assets.length === 0) {
      return { 
        totalValue: 0, 
        dailyChange: 0, 
        percentChange: 0 
      };
    }
    
    // Calculate total portfolio value and change
    const totalValue = assets.reduce((sum, asset) => {
      const value = asset.quantity * (asset.current_price || 0);
      return sum + value;
    }, 0);
    
    // Calculate daily change amount
    const dailyChange = assets.reduce((sum, asset) => {
      const value = asset.quantity * (asset.current_price || 0);
      const changeAmount = value * (asset.daily_change_percent || 0) / 100;
      return sum + changeAmount;
    }, 0);
    
    // Calculate percentage change (weighted average)
    const percentChange = totalValue > 0 
      ? (dailyChange / totalValue) * 100 
      : 0;
    
    return {
      totalValue,
      dailyChange,
      percentChange
    };
  }, [assets]);
  
  const renderTrend = () => {
    if (summary.percentChange > 0) {
      return (
        <div className="flex items-center text-green-500">
          <ArrowUpIcon className="h-4 w-4 mr-1" />
          <span>{summary.percentChange.toFixed(2)}%</span>
        </div>
      );
    } else if (summary.percentChange < 0) {
      return (
        <div className="flex items-center text-red-500">
          <ArrowDownIcon className="h-4 w-4 mr-1" />
          <span>{Math.abs(summary.percentChange).toFixed(2)}%</span>
        </div>
      );
    }
    return <span className="text-muted-foreground">0.00%</span>;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Portfolio Value
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total value of all your investments
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Daily Change
          </CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold">
              {formatCurrency(summary.dailyChange)}
            </div>
            {renderTrend()}
          </div>
          <p className="text-xs text-muted-foreground">
            Change in value since yesterday
          </p>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Asset Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10 flex items-center space-x-1">
            {assets && assets.length > 0 ? (
              Object.entries(groupAssetsByCategory(assets, summary.totalValue))
                .sort((a, b) => b[1].value - a[1].value)
                .map(([category, data], index) => (
                  <div 
                    key={category}
                    className="h-4 rounded-sm" 
                    style={{
                      width: `${(data.value / summary.totalValue) * 100}%`,
                      backgroundColor: getCategoryColor(category, index)
                    }}
                    title={`${category}: ${((data.value / summary.totalValue) * 100).toFixed(1)}%`}
                  />
                ))
            ) : (
              <div className="text-sm text-muted-foreground">No assets</div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {assets && assets.length > 0 ? (
              Object.entries(groupAssetsByCategory(assets, summary.totalValue))
                .sort((a, b) => b[1].value - a[1].value)
                .map(([category, data], index) => (
                  <div key={category} className="flex items-center">
                    <div 
                      className="h-2 w-2 rounded-full mr-1"
                      style={{ backgroundColor: getCategoryColor(category, index) }}
                    />
                    <span>{category}</span>
                    <span className="ml-auto">{((data.value / summary.totalValue) * 100).toFixed(1)}%</span>
                  </div>
                ))
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function groupAssetsByCategory(assets, totalPortfolioValue) {
  return assets.reduce((groups, asset) => {
    const category = asset.category || 'Other';
    const assetValue = asset.quantity * (asset.current_price || 0);
    
    if (!groups[category]) {
      groups[category] = { value: 0, count: 0 };
    }
    
    groups[category].value += assetValue;
    groups[category].count += 1;
    
    return groups;
  }, {});
}

function getCategoryColor(category, index) {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f97316', // orange
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#6366f1', // indigo
    '#f59e0b', // amber
    '#ef4444', // red
    '#84cc16', // lime
  ];
  
  // If we have a predefined color for this category, use it
  const categoryColors = {
    'Stocks': '#3b82f6',
    'Crypto': '#8b5cf6',
    'Bonds': '#10b981',
    'Cash': '#f59e0b',
    'Real Estate': '#f97316',
    'Commodities': '#ec4899'
  };
  
  return categoryColors[category] || colors[index % colors.length];
}