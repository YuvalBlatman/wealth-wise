
import React, { useState, useEffect, useMemo } from 'react';
import { Asset } from '@/api/entities';
import { EconomicDataPoint } from '@/api/entities'; // For exchange rates if needed
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2, Clock, Briefcase as StudyFundIcon, Landmark, Building as RealEstateIcon, DollarSign, Box as AlternativeIcon, ShieldCheck, LineChart as LineChartIcon } from 'lucide-react';
import { format, parseISO, isPast, isToday, addYears, differenceInDays, differenceInMonths, differenceInYears, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, isBefore, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
import { formatCurrency } from '@/components/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts'; // Import Recharts components

const CATEGORY_ICONS = {
  financial_instruments: DollarSign,
  savings_deposits: Landmark,
  pension_insurance: ShieldCheck,
  study_funds: StudyFundIcon,
  alternative_assets: AlternativeIcon,
  real_estate: RealEstateIcon,
};

const ASSET_TYPE_KEY_CHILD_SAVINGS = 'child_savings';
const ASSET_TYPE_KEY_STUDY_FUND = 'study_fund_general';
const ASSET_TYPE_KEY_CHECKING = 'checking';
const DEPOSIT_KEYS = ['fixed_deposit', 'savings_plan'];


const calculateLiquidityDate = (asset) => {
  // 1. Checking account - always liquid
  if (asset.asset_type_key === ASSET_TYPE_KEY_CHECKING) {
    return { liquidityDate: new Date(), isLiquidNow: true, reason: 'חשבון עו"ש' };
  }

  // 2. Financial Instruments - generally liquid, unless specified otherwise
  if (asset.category === 'financial_instruments') {
    if (asset.liquidity_data?.is_immediately_liquid === false && asset.liquidity_data?.release_date) {
      const releaseDate = parseISO(asset.liquidity_data.release_date);
      if (isValid(releaseDate)) return { liquidityDate: releaseDate, isLiquidNow: isPast(releaseDate) || isToday(releaseDate), reason: 'נזילות מוגדרת' };
    }
    return { liquidityDate: new Date(), isLiquidNow: true, reason: 'מכשיר פיננסי נזיל' };
  }
  
  // 3. Alternative Assets - liquidity based on release_date
  if (asset.category === 'alternative_assets') {
    if (asset.liquidity_data?.is_immediately_liquid === false && asset.liquidity_data?.release_date) {
      const releaseDate = parseISO(asset.liquidity_data.release_date);
      if (isValid(releaseDate)) return { liquidityDate: releaseDate, isLiquidNow: isPast(releaseDate) || isToday(releaseDate), reason: 'נזילות מוגדרת' };
    }
    return { liquidityDate: null, isLiquidNow: asset.liquidity_data?.is_immediately_liquid || false, reason: asset.liquidity_data?.is_immediately_liquid ? 'נזיל מיידית (מוגדר)' : 'תאריך לא מוגדר' };
  }

  // 4. Real Estate - typically not liquid
  if (asset.category === 'real_estate') {
     return { liquidityDate: null, isLiquidNow: false, reason: 'נכס נדל"ן' };
  }

  // 5. Savings Deposits (fixed_deposit, savings_plan, child_savings)
  if (DEPOSIT_KEYS.includes(asset.asset_type_key) || asset.asset_type_key === ASSET_TYPE_KEY_CHILD_SAVINGS) {
    if (asset.end_date) { 
      const endDate = parseISO(asset.end_date);
      if (isValid(endDate)) return { liquidityDate: endDate, isLiquidNow: isPast(endDate) || isToday(endDate), reason: 'תאריך סיום מוגדר' };
    }
    if (asset.first_exit_station_date) {
      const firstExit = parseISO(asset.first_exit_station_date);
      if (isValid(firstExit) && (isPast(firstExit) || isToday(firstExit))) {
         // More complex logic for future exit stations can be added here if needed
        return { liquidityDate: firstExit, isLiquidNow: true, reason: 'תחנת יציאה עברה' };
      } else if (isValid(firstExit)) {
        return { liquidityDate: firstExit, isLiquidNow: false, reason: 'תחנת יציאה עתידית' };
      }
    }
    if (asset.lock_end_date) {
      const lockEnd = parseISO(asset.lock_end_date);
      if (isValid(lockEnd)) return { liquidityDate: lockEnd, isLiquidNow: isPast(lockEnd) || isToday(lockEnd), reason: 'סיום נעילה' };
    }
    return { liquidityDate: null, isLiquidNow: false, reason: 'אין תאריך נזילות ברור' };
  }
  
  // 6. Study Funds (קרנות השתלמות)
  if (asset.category === 'study_funds' && asset.asset_type_key === ASSET_TYPE_KEY_STUDY_FUND) {
    if (asset.end_date) { // Manual release date from form
        const manualReleaseDate = parseISO(asset.end_date);
        if(isValid(manualReleaseDate)) return { liquidityDate: manualReleaseDate, isLiquidNow: isPast(manualReleaseDate) || isToday(manualReleaseDate), reason: 'תאריך מימוש ידני' };
    }
    if (asset.open_date) { // Automatic calculation: open_date + 6 years
        const openDate = parseISO(asset.open_date);
        if(isValid(openDate)){
            const autoLiquidityDate = addYears(openDate, 6);
            return { liquidityDate: autoLiquidityDate, isLiquidNow: isPast(autoLiquidityDate) || isToday(autoLiquidityDate), reason: '6 שנים מפתיחה' };
        }
    }
    return { liquidityDate: null, isLiquidNow: false, reason: 'אין תאריך פתיחה/מימוש' };
  }

  // Default for other types (e.g., some pension/insurance if not explicitly handled)
  return { liquidityDate: null, isLiquidNow: false, reason: 'לא מוגדר / לא נזיל כעת' };
};

const LiquidityChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 h-[300px]">
        <LineChartIcon className="w-16 h-16 text-muted-foreground/30" />
        <h3 className="text-lg font-medium text-muted-foreground">אין נתונים להצגת גרף צפי נזילות</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          הגרף יציג מידע לאחר שיוזנו נכסים עם תאריכי נזילות עתידיים.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(value) => formatCurrency(value, 'ILS', true)} tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
        <RechartsTooltip formatter={(value) => formatCurrency(value, 'ILS')} />
        <Legend />
        <Line type="monotone" dataKey="cumulativeLiquidValue" name="שווי נזיל מצטבר" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};


export default function LiquidityPage() {
  const [allAssets, setAllAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemExchangeRates, setSystemExchangeRates] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [assetsData, usdRateData, eurRateData] = await Promise.all([
          Asset.list('-created_date'),
          EconomicDataPoint.filter({ indicator_type: 'usd_ils_exchange_rate' }, '-last_updated', 1),
          EconomicDataPoint.filter({ indicator_type: 'eur_ils_exchange_rate' }, '-last_updated', 1),
          ]);
        setAllAssets(assetsData);
        const rates = {};
        if (usdRateData?.[0]?.data?.current_value) rates.USD = usdRateData[0].data.current_value;
        if (eurRateData?.[0]?.data?.current_value) rates.EUR = eurRateData[0].data.current_value;
        setSystemExchangeRates(rates);
      } catch (error) {
        console.error("שגיאה בטעינת נתונים:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processedAssets = useMemo(() => {
    return allAssets.map(asset => {
      const { liquidityDate, isLiquidNow, reason } = calculateLiquidityDate(asset);
      let valueInILS = asset.current_value || 0;
      if (asset.currency !== 'ILS') {
        const rate = asset.exchange_rate || systemExchangeRates[asset.currency];
        if (rate && rate > 0) {
          valueInILS *= rate;
        } else {
          valueInILS = 0; // Cannot convert to ILS, treat as 0 for liquidity sum
        }
      }
      return { ...asset, liquidityDate, isLiquidNow, liquidityReason: reason, valueInILS };
    }).sort((a, b) => {
      if (a.liquidityDate && b.liquidityDate) return a.liquidityDate - b.liquidityDate;
      if (a.liquidityDate) return -1;
      if (b.liquidityDate) return 1;
      return 0;
    });
  }, [allAssets, systemExchangeRates]);

  const liquidAssetsForList = useMemo(() => processedAssets.filter(a => a.isLiquidNow), [processedAssets]);
  const upcomingLiquidityAssets = useMemo(() => processedAssets.filter(a => !a.isLiquidNow && a.liquidityDate && isAfter(a.liquidityDate, new Date())), [processedAssets]);
  
  const totalLiquidValue = useMemo(() => liquidAssetsForList.reduce((sum, asset) => sum + asset.valueInILS, 0), [liquidAssetsForList]);

  const liquidityChartData = useMemo(() => {
    const today = new Date();
    // Combine currently liquid and upcoming liquid assets that have a valid future date
    const relevantAssets = processedAssets.filter(a => a.liquidityDate && isValid(a.liquidityDate) && (a.isLiquidNow || isAfter(a.liquidityDate, today)));
    
    if (relevantAssets.length === 0 && totalLiquidValue === 0) return [];

    const dataPoints = [];
    let cumulativeValue = 0;

    // Add current liquid value as starting point
    if (totalLiquidValue > 0) {
        dataPoints.push({
            date: format(today, 'MMM yy', { locale: he }),
            cumulativeLiquidValue: totalLiquidValue,
        });
        cumulativeValue = totalLiquidValue;
    }
    
    // Create timeline points for the next 2 years, monthly
    const futureMonths = eachMonthOfInterval({
        start: startOfMonth(addMonths(today,1)), // Start from next month
        end: endOfMonth(addYears(today, 2))
    });

    futureMonths.forEach(monthStart => {
        let newlyLiquidThisMonth = 0;
        relevantAssets.forEach(asset => {
            // Check if asset becomes liquid in this specific month and wasn't already counted
            if (!asset.isLiquidNow && asset.liquidityDate && isSameMonth(asset.liquidityDate, monthStart) && isBefore(asset.liquidityDate, addMonths(monthStart,1))) {
                 if (!dataPoints.find(dp => dp.originalAssetId === asset.id)) { // Simple check to avoid double counting
                    newlyLiquidThisMonth += asset.valueInILS;
                 }
            }
        });
        cumulativeValue += newlyLiquidThisMonth;
        
        // Add data point only if there's a change or it's the first future point
         if (newlyLiquidThisMonth > 0 || (dataPoints.length === (totalLiquidValue > 0 ? 1 : 0)) || cumulativeValue !== dataPoints[dataPoints.length-1]?.cumulativeLiquidValue ) {
            dataPoints.push({
                date: format(monthStart, 'MMM yy', { locale: he }),
                cumulativeLiquidValue: cumulativeValue,
            });
        }
    });
    
    // Ensure unique dates for chart (can happen if multiple assets become liquid in same month)
    // and filter out points where value didn't change from previous, unless it's the first or current value.
    const uniqueAndChangedDataPoints = dataPoints.reduce((acc, current, index, arr) => {
        const prev = arr[index-1];
        if (index === 0 || !prev || current.date !== prev.date || current.cumulativeLiquidValue !== prev.cumulativeLiquidValue) {
            acc.push(current);
        } else if (prev && current.date === prev.date && current.cumulativeLiquidValue > prev.cumulativeLiquidValue) {
            // If same date but higher value (multiple assets in same month), update last entry
            acc[acc.length-1] = current;
        }
        return acc;
    }, []);

    // If only current liquidity exists, and no upcoming, chart might be less useful.
    // Add a point for today if no other points generated and totalLiquidValue > 0
    if (uniqueAndChangedDataPoints.length === 0 && totalLiquidValue > 0) {
         return [{ date: format(today, 'MMM yy', { locale: he }), cumulativeLiquidValue: totalLiquidValue }];
    }


    return uniqueAndChangedDataPoints;

  }, [processedAssets, totalLiquidValue]);


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const AssetRow = ({ asset }) => {
    const Icon = CATEGORY_ICONS[asset.category] || DollarSign;
    const timeToLiquidity = asset.liquidityDate && !asset.isLiquidNow ? 
      (
        differenceInDays(asset.liquidityDate, new Date()) > 31 ?
        (differenceInMonths(asset.liquidityDate, new Date()) > 12 ? 
          `${differenceInYears(asset.liquidityDate, new Date())} שנים` 
          : `${differenceInMonths(asset.liquidityDate, new Date())} חודשים`
        ) 
        : `${differenceInDays(asset.liquidityDate, new Date())} ימים`
      )
      : null;

    return (
      <div className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary" />
          <div>
            <p className="font-semibold">{asset.description}</p>
            <p className="text-xs text-muted-foreground">
              {asset.liquidityReason}
              {asset.liquidityDate && ` - ${format(asset.liquidityDate, 'dd/MM/yyyy')}`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(asset.valueInILS, 'ILS')}</p>
          {timeToLiquidity && (
            <Badge variant="outline" className="mt-1">
              <Clock className="w-3 h-3 ml-1" />
              בעוד {timeToLiquidity}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <TrendingUp className="w-7 h-7 ml-3 text-green-500" />
            צפי נזילות
          </CardTitle>
          <CardDescription>התפתחות הנזילות הצפויה של הנכסים שלך לאורך זמן.</CardDescription>
        </CardHeader>
        <CardContent>
          <LiquidityChart data={liquidityChartData} />
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="w-6 h-6 ml-2 text-green-500" />
              נכסים נזילים כעת
            </CardTitle>
            <CardDescription>סה"כ שווי נזיל כעת: {formatCurrency(totalLiquidValue, 'ILS')}</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {liquidAssetsForList.length > 0 ? (
              liquidAssetsForList.map(asset => <AssetRow key={asset.id} asset={asset} />)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <p>אין נכסים נזילים כעת.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-6 h-6 ml-2 text-amber-500" />
              נכסים עם נזילות עתידית
            </CardTitle>
            <CardDescription>נכסים שצפויים להפוך נזילים בתאריך עתידי.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {upcomingLiquidityAssets.length > 0 ? (
              upcomingLiquidityAssets.map(asset => <AssetRow key={asset.id} asset={asset} />)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <p>אין נכסים עם צפי נזילות עתידית.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to check if a date is after another (handles nulls)
function isAfter(date1, date2) {
  if (!date1 || !date2) return false;
  return date1 > date2;
}
