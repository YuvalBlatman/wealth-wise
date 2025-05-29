import React, { useState, useMemo, useEffect } from 'react';
import { EconomicDataPoint } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip } from 'recharts';
import { formatCurrency } from '@/components/utils/formatters';
import { TrendingUp } from 'lucide-react';
// Removed date-fns imports related to simulated data
// import { addMonths, addQuarters, addYears, format as formatDateFns, subMonths, subQuarters, subYears } from 'date-fns';
// import { he } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PIE_CHART_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#EF4444', '#06B6D4', '#84CC16'];

const CATEGORIES_FOR_CHART = {
  financial_instruments: { key: "financial_instruments", name_he: "מכשירים פיננסיים" },
  savings_deposits: { key: "savings_deposits", name_he: "חסכונות ופקדונות" },
  pension_insurance: { key: "pension_insurance", name_he: "פנסיה וביטוח" },
  study_funds: { key: "study_funds", name_he: "קרנות השתלמות" },
  alternative_assets: { key: "alternative_assets", name_he: "נכסים אלטרנטיביים" },
  real_estate: { key: "real_estate", name_he: "נדל\"ן" },
  other: { key: "other", name_he: "אחר" }
};

// TIME_RANGES might be irrelevant now if we don't have historical data to show for line chart
// const TIME_RANGES = [
//     { value: 'monthly', label: 'חודשי (שנה אחורה)', points: 12, subtractFn: subMonths, addFn: addMonths, format: 'MMM yy' },
//     { value: 'quarterly', label: 'רבעוני (3 שנים אחורה)', points: 12, subtractFn: subQuarters, addFn: addQuarters, format: 'QQQ yy' },
//     { value: 'yearly', label: 'שנתי (5 שנים אחורה)', points: 5, subtractFn: subYears, addFn: addYears, format: 'yyyy' }
// ];

export default function PortfolioCharts({ assets = [] }) {
  const [systemExchangeRates, setSystemExchangeRates] = useState({});
  // selectedTimeRange might be irrelevant now
  // const [selectedTimeRange, setSelectedTimeRange] = useState(TIME_RANGES[0].value); 

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
        console.error("Error fetching system exchange rates for charts:", error);
      }
    };
    fetchRates();
  }, []);

  const { pieChartData, totalPortfolioValueInILS } = useMemo(() => {
    if (!assets.length) return { pieChartData: [], totalPortfolioValueInILS: 0 };
    
    let totalValue = 0;

    const grouped = assets.reduce((acc, asset) => {
      const categoryInfo = CATEGORIES_FOR_CHART[asset.category] || CATEGORIES_FOR_CHART.other;
      const displayName = categoryInfo.name_he;
      
      let valueInILS = asset.current_value || 0;
      let hasValidRate = true;

      if (asset.currency !== 'ILS') {
        if (asset.exchange_rate && asset.exchange_rate > 0) {
          valueInILS = (asset.current_value || 0) * asset.exchange_rate;
           hasValidRate = true;
        } else if (systemExchangeRates[asset.currency]) {
           valueInILS = (asset.current_value || 0) * systemExchangeRates[asset.currency];
           hasValidRate = true;
        } else {
          valueInILS = 0; 
          hasValidRate = false;
        }
      }

      if (hasValidRate) {
        if (!acc[displayName]) {
          acc[displayName] = { name: displayName, value: 0 };
        }
        acc[displayName].value += valueInILS;
        totalValue += valueInILS;
      }
      return acc;
    }, {});
    
    return { 
        pieChartData: Object.values(grouped).filter(item => item.value > 0),
        totalPortfolioValueInILS: totalValue,
    };
  }, [assets, systemExchangeRates]);

  // Line chart data will be empty for now as we don't have real historical data
  const lineChartData = useMemo(() => {
    // TODO: Implement logic to fetch/calculate real historical portfolio data
    // For now, return empty array or a single point representing current value if desired
    // Example for a single point:
    // if (totalPortfolioValueInILS > 0) {
    //   return [{ date: formatDateFns(new Date(), 'dd/MM/yy', { locale: he }), value: totalPortfolioValueInILS }];
    // }
    return []; 
  }, [totalPortfolioValueInILS]);


  const PieCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalPortfolioValueInILS > 0 ? (data.value / totalPortfolioValueInILS * 100).toFixed(1) : 0;
      return (
        <div className="bg-background p-2 border rounded shadow-lg">
          <p className="font-semibold">{`${data.name}: ${formatCurrency(data.value, 'ILS')}`}</p>
          <p className="text-sm text-muted-foreground">{`(${percentage}%)`}</p>
        </div>
      );
    }
    return null;
  };

  const LineCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded shadow-lg">
          <p className="label text-sm">{`${label}`}</p>
          <p className="intro font-semibold">{`שווי תיק: ${formatCurrency(payload[0].value, 'ILS')}`}</p>
        </div>
      );
    }
    return null;
  };

  const showPieChart = pieChartData.length > 0 && totalPortfolioValueInILS > 0;
  const showLineChart = lineChartData.length > 0 && totalPortfolioValueInILS > 0; // This will likely be false now


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>התפלגות נכסים לפי קטגוריה (בש"ח)</CardTitle>
          <CardDescription>שווי כולל: {formatCurrency(totalPortfolioValueInILS, 'ILS')}</CardDescription>
        </CardHeader>
        <CardContent>
          {showPieChart ? (
            <ResponsiveContainer width="100%" height={300}>
               <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<PieCustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-10">
              {assets.length > 0 ? "אין נתונים להצגת גרף עוגה. ודא שהוזנו שווי נכסים ושערי המרה במידת הצורך." : "אין מספיק נכסים להצגת גרפים."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    מעקב ביצועים (שווי תיק לאורך זמן)
                </CardTitle>
                <CardDescription>
                    {/* Updated description */}
                    הגרף יתעדכן אוטומטית כאשר יתווספו נתונים היסטוריים על שווי התיק.
                </CardDescription>
            </div>
            {/* Select for time range might be hidden or disabled if no data */}
            {/* 
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange} disabled={!showLineChart}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="בחר טווח זמן" />
                </SelectTrigger>
                <SelectContent>
                    {TIME_RANGES.map(range => (
                        <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            */}
        </CardHeader>
        <CardContent>
          {showLineChart ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCurrency(value, 'ILS', true)} tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                <LineTooltip content={<LineCustomTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} name="שווי תיק" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 h-[300px]">
                <TrendingUp className="w-16 h-16 text-muted-foreground/30" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-muted-foreground">אין נתונים היסטוריים להצגת גרף ביצועים</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    כדי להציג גרף זה, יש צורך בנתונים היסטוריים על שווי התיק.
                    {/* You might add: "בעתיד, המערכת תשמור 'צילומי מצב' של שווי התיק ותציג אותם כאן." */}
                  </p>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to format currency for YAxis to be more compact - can be kept if line chart is used in future
const formatCurrencyShort = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};