import React, { useState, useMemo, useEffect } from 'react';
import { EconomicDataPoint } from '@/api/entities';
import { formatCurrency, getCurrencySymbol } from '@/components/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Landmark, Briefcase, ShieldCheck, Box, Scale, Building, FileText as StudyFundIcon } from 'lucide-react'; // Removed AlertCircle

const CATEGORY_DATA = {
  financial_instruments: { name_he: "מכשירים פיננסיים", IconComponent: Briefcase, color: '#4F46E5' },
  savings_deposits: { name_he: "חסכונות ופקדונות", IconComponent: Landmark, color: '#10B981' },
  pension_insurance: { name_he: "פנסיה וביטוח", IconComponent: ShieldCheck, color: '#F59E0B' },
  study_funds: { name_he: "קרנות השתלמות", IconComponent: StudyFundIcon, color: '#6366F1' }, 
  alternative_assets: { name_he: "נכסים אלטרנטיביים", IconComponent: Box, color: '#EC4899' },
  real_estate: { name_he: "נדל\"ן", IconComponent: Building, color: '#EF4444' }
};

export default function SummaryWidget({ assets = [] }) {
  const [systemExchangeRates, setSystemExchangeRates] = useState({});

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const [usdRateData, eurRateData] = await Promise.all([
          EconomicDataPoint.filter({ indicator_type: 'usd_ils_exchange_rate' }, '-last_updated', 1),
          EconomicDataPoint.filter({ indicator_type: 'eur_ils_exchange_rate' }, '-last_updated', 1)
        ]);
        const rates = {};
        if (usdRateData?.[0]?.data?.current_value) rates.USD = usdRateData[0].data.current_value;
        if (eurRateData?.[0]?.data?.current_value) rates.EUR = eurRateData[0].data.current_value;
        setSystemExchangeRates(rates);
      } catch (error) {
        console.error("Error fetching system exchange rates for summary:", error);
      }
    };
    fetchRates();
  }, []);

  const { totalNetWorthInILS, assetsByCategoryInILS } = useMemo(() => {
    let totalValue = 0;
    const categoryTotals = {};
    // Removed missingExchangeRateAssets logic entirely

    assets.forEach(asset => {
      let valueInILS = asset.current_value || 0;
      let effectiveExchangeRate = null;
      let hasValidRate = true;

      if (asset.currency !== 'ILS') {
        if (asset.exchange_rate && asset.exchange_rate > 0) {
          valueInILS = (asset.current_value || 0) * asset.exchange_rate;
          effectiveExchangeRate = asset.exchange_rate;
          hasValidRate = true;
        } else if (systemExchangeRates[asset.currency]) {
          valueInILS = (asset.current_value || 0) * systemExchangeRates[asset.currency];
          effectiveExchangeRate = systemExchangeRates[asset.currency];
          hasValidRate = true;
        } else {
          // No user rate and no system rate available - asset value in ILS will be 0
          valueInILS = 0; 
          hasValidRate = false; // Will not be counted in totals
        }
      }

      if (hasValidRate) { // Only add to totals if rate was found
        const categoryKey = asset.category;
        if (!categoryTotals[categoryKey]) {
          categoryTotals[categoryKey] = { totalValue: 0, count: 0, assets: [] };
        }
        categoryTotals[categoryKey].totalValue += valueInILS;
        categoryTotals[categoryKey].count += 1;
        categoryTotals[categoryKey].assets.push({
            description: asset.description,
            original_value: asset.current_value,
            currency: asset.currency,
            exchange_rate: effectiveExchangeRate,
            value_in_ils: valueInILS
        });
        totalValue += valueInILS;
      }
    });

    return { 
      totalNetWorthInILS: totalValue, 
      assetsByCategoryInILS: categoryTotals,
      // missingExchangeRateAssets: [] // Explicitly return empty array or remove
    };
  }, [assets, systemExchangeRates]);

  const displayCategories = Object.keys(CATEGORY_DATA).map(key => {
    return {
      key,
      ...CATEGORY_DATA[key],
      data: assetsByCategoryInILS[key] || { totalValue: 0, count: 0, assets: [] }
    };
  });

  return (
    <TooltipProvider>
      <Card className="mb-6" dir="rtl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Scale className="w-7 h-7 ml-3 text-primary" />
            שווי נכסים כולל (בש"ח)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold mb-6">{formatCurrency(totalNetWorthInILS, 'ILS')}</p>
          
          {/* Removed the missingExchangeRateAssets warning block */}

          <div className="space-y-3">
            {displayCategories.map(({ key, name_he, IconComponent, color, data }) => {
              if (data.count === 0 && data.totalValue === 0) return null;
              const percentage = totalNetWorthInILS > 0 ? (data.totalValue / totalNetWorthInILS) * 100 : 0;
              const assetsInForeignCurrency = data.assets.filter(a => a.currency !== 'ILS' && a.value_in_ils > 0); 
              
              return (
                <div key={key} className="flex items-center">
                  <IconComponent className="w-5 h-5 ml-3" style={{ color }} />
                  <span className="w-1/2 font-medium">{name_he} ({data.count})</span>
                  <div className="w-1/2 flex items-center justify-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-auto mr-3 font-semibold cursor-default">{formatCurrency(data.totalValue, 'ILS')}</span>
                      </TooltipTrigger>
                      {assetsInForeignCurrency.length > 0 && (
                        <TooltipContent side="top" className="max-w-xs text-xs p-2 bg-background border shadow-lg rounded-md" dir="rtl">
                          <div className="space-y-1">
                            <p className="font-bold">פירוט נכסים במט"ח בקטגוריה זו (מומר לש"ח):</p>
                            {assetsInForeignCurrency.slice(0, 5).map((asset, idx) => (
                              <div key={idx}>
                                {asset.description}: {getCurrencySymbol(asset.currency)}{formatNumber(asset.original_value)}
                                {asset.exchange_rate ? ` (שער: ${asset.exchange_rate})` : ''}
                                 = {formatCurrency(asset.value_in_ils, 'ILS')}
                              </div>
                            ))}
                            {assetsInForeignCurrency.length > 5 && <p>ועוד...</p>}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                    <span className="text-xs text-muted-foreground tabular-nums">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// Helper to format number for tooltip
const formatNumber = (num) => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 2 }).format(num);
};