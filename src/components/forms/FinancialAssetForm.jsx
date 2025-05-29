
import React, { useState, useEffect } from 'react';
import { Asset } from '@/api/entities';
import { EconomicDataPoint } from '@/api/entities'; // Import EconomicDataPoint
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';

const FINANCIAL_TYPES = [
  { value: 'stock', label: 'מניה' },
  { value: 'gov_bond', label: 'אג"ח ממשלתי' },
  { value: 'corp_bond', label: 'אג"ח קונצרני' },
  { value: 'mutual_fund', label: 'קרן נאמנות' },
  { value: 'etf', label: 'תעודת סל (ETF)' },
  { value: 'index_fund', label: 'קרן מחקה' },
  { value: 'option', label: 'אופציה' },
  { value: 'other', label: 'אחר' }
];

const CURRENCIES = [
  { value: 'ILS', label: '₪ שקל ישראלי' },
  { value: 'USD', label: '$ דולר אמריקאי' },
  { value: 'EUR', label: '€ אירו' },
  { value: 'GBP', label: '£ לירה שטרלינג' }
];

const EXCHANGES = [
  { value: 'TASE', label: 'בורסה לני"ע בת"א' },
  { value: 'NYSE', label: 'NYSE' },
  { value: 'NASDAQ', label: 'NASDAQ' },
  { value: 'LSE', label: 'London Stock Exchange' },
  { value: 'OTHER', label: 'אחר' }
];


export default function FinancialAssetForm({ asset, onSave, onCancel, onClose }) {
  const [formData, setFormData] = useState({
    asset_type_key: '',
    description: '',
    symbol: '',
    currency: 'ILS',
    quantity: '',
    purchase_price: '', // average_purchase_price
    current_value: '',
    update_method: 'manual',
    exchange: '', // exchange_platform
    notes: '',
    liquidity_data: { is_immediately_liquid: true, release_date: '' },
    exchange_rate_source: 'manual', // 'manual' or 'system'
    exchange_rate: '',
    exchange_rate_date: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systemExchangeRate, setSystemExchangeRate] = useState(null);
  const [systemExchangeRateDate, setSystemExchangeRateDate] = useState(null);
  const [fetchingRate, setFetchingRate] = useState(false);

  const fetchSystemRate = async (currency) => {
    if (currency === 'ILS') {
      setSystemExchangeRate(null);
      setSystemExchangeRateDate(null);
      if (formData.exchange_rate_source === 'system') {
        setFormData(prev => ({ ...prev, exchange_rate: '', exchange_rate_date: '' }));
      }
      return;
    }
    setFetchingRate(true);
    try {
      const indicatorType = currency === 'USD' ? 'usd_ils_exchange_rate' : currency === 'EUR' ? 'eur_ils_exchange_rate' : null;
      if (indicatorType) {
        const rates = await EconomicDataPoint.filter({ indicator_type: indicatorType }, '-last_updated', 1);
        if (rates && rates.length > 0 && rates[0].data?.current_value) {
          setSystemExchangeRate(rates[0].data.current_value.toString());
          setSystemExchangeRateDate(rates[0].last_updated);
          if (formData.exchange_rate_source === 'system') {
            setFormData(prev => ({ ...prev, exchange_rate: rates[0].data.current_value.toString(), exchange_rate_date: rates[0].last_updated }));
          }
        } else {
          setSystemExchangeRate(null);
          setSystemExchangeRateDate(null);
        }
      } else {
        setSystemExchangeRate(null);
        setSystemExchangeRateDate(null);
      }
    } catch (err) {
      console.error("Error fetching system exchange rate:", err);
      setSystemExchangeRate(null);
      setSystemExchangeRateDate(null);
    } finally {
      setFetchingRate(false);
    }
  };

  useEffect(() => {
    if (asset) {
      setFormData({
        asset_type_key: asset.asset_type_key || '',
        description: asset.description || '',
        symbol: asset.symbol || '',
        currency: asset.currency || 'ILS',
        quantity: asset.quantity?.toString() || '',
        purchase_price: asset.average_purchase_price?.toString() || '',
        current_value: asset.current_value?.toString() || '',
        update_method: asset.update_method || 'manual',
        exchange: asset.exchange_platform || '',
        notes: asset.notes || '',
        liquidity_data: asset.liquidity_data || { is_immediately_liquid: true, release_date: '' },
        // Determine initial source based on whether exchange_rate was saved (implies manual or previous system)
        exchange_rate_source: asset.exchange_rate ? 'manual' : 'system', // Default to manual if rate exists, else system
        exchange_rate: asset.exchange_rate?.toString() || '',
        exchange_rate_date: asset.exchange_rate_date || new Date().toISOString().split('T')[0]
      });
      if (asset.currency && asset.currency !== 'ILS') {
        fetchSystemRate(asset.currency);
      }
    } else {
      // For new assets, default to manual or attempt to fetch system rate if currency is non-ILS
      if (formData.currency && formData.currency !== 'ILS') {
         fetchSystemRate(formData.currency);
      }
    }
  }, [asset]);

  useEffect(() => {
    // When currency changes, fetch new system rate
    if (formData.currency && formData.currency !== 'ILS') {
      fetchSystemRate(formData.currency);
    } else {
      // If currency is ILS, clear system rate and potentially manual rate if source was system
      setSystemExchangeRate(null);
      setSystemExchangeRateDate(null);
      if (formData.exchange_rate_source === 'system') {
          setFormData(prev => ({...prev, exchange_rate: '', exchange_rate_date: ''}));
      }
    }
  }, [formData.currency]);

  useEffect(() => {
    // When source changes to system, update form with system rate
    if (formData.exchange_rate_source === 'system' && systemExchangeRate) {
      setFormData(prev => ({
        ...prev,
        exchange_rate: systemExchangeRate,
        exchange_rate_date: systemExchangeRateDate || new Date().toISOString().split('T')[0]
      }));
    }
  }, [formData.exchange_rate_source, systemExchangeRate, systemExchangeRateDate]);


  const handleCurrencyChange = (value) => {
    setFormData(prev => ({ ...prev, currency: value, exchange_rate_source: value === 'ILS' ? 'manual' : prev.exchange_rate_source, exchange_rate: '', exchange_rate_date: new Date().toISOString().split('T')[0] }));
    // fetchSystemRate will be called by the useEffect watching formData.currency
  };

  const handleExchangeRateSourceChange = (value) => {
    setFormData(prev => ({
        ...prev,
        exchange_rate_source: value,
        exchange_rate: value === 'system' && systemExchangeRate ? systemExchangeRate : '', // Clear or set system rate
        exchange_rate_date: value === 'system' && systemExchangeRateDate ? systemExchangeRateDate : new Date().toISOString().split('T')[0]
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Frontend Validation
    if (!formData.asset_type_key) {
      setError('נא לבחור סוג מכשיר פינнси.');
      setLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('נא למלא שם הנייר / תיאור.');
      setLoading(false);
      return;
    }
    if (!formData.current_value || isNaN(Number(formData.current_value))) {
        setError('נא למלא שווי נוכחי במספרים.');
        setLoading(false);
        return;
    }
     if (!formData.quantity || isNaN(Number(formData.quantity))) {
        setError('נא למלא כמות במספרים.');
        setLoading(false);
        return;
    }
    if (formData.currency !== 'ILS' && (!formData.exchange_rate || isNaN(Number(formData.exchange_rate)) || Number(formData.exchange_rate) <= 0)) {
        setError('עבור מטבע שאינו ש"ח, נא למלא שער המרה חיובי.');
        setLoading(false);
        return;
    }


    try {
      const dataToSubmit = {
        category: 'financial_instruments',
        asset_type_key: formData.asset_type_key,
        description: formData.description,
        symbol: formData.symbol.toUpperCase(),
        currency: formData.currency,
        quantity: Number(formData.quantity) || 0,
        average_purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
        current_value: Number(formData.current_value) || 0,
        update_method: formData.update_method,
        exchange_platform: formData.exchange,
        notes: formData.notes,
        last_updated_manual: new Date().toISOString(),
        liquidity_data: formData.liquidity_data,
        exchange_rate: formData.currency !== 'ILS' && formData.exchange_rate ? Number(formData.exchange_rate) : null,
        exchange_rate_date: formData.currency !== 'ILS' && formData.exchange_rate && formData.exchange_rate_date ? formData.exchange_rate_date : null,
      };

      if (asset?.id) {
        await Asset.update(asset.id, dataToSubmit);
      } else {
        await Asset.create(dataToSubmit);
      }
      onSave();
    } catch (err) {
      setError(err.message || 'אירעה שגיאה בשמירת הנכס. אנא נסו שנית.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-2 z-10"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <ScrollArea className="h-[80vh] px-4">
        <form onSubmit={handleSubmit} className="space-y-6 pt-8" dir="rtl">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="asset_type_key" className="required">סוג מכשיר פיננסי</Label>
            <Select
              value={formData.asset_type_key}
              onValueChange={(value) => setFormData(prev => ({ ...prev, asset_type_key: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג מכשיר" />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="required">שם הנייר / תיאור</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="לדוגמה: מניית אפל / אג״ח ממשלתי 0524"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">סימול</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                placeholder="AAPL"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exchange">בורסה / זירת מסחר</Label>
              <Select
                value={formData.exchange}
                onValueChange={(value) => setFormData(prev => ({ ...prev, exchange: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר בורסה" />
                </SelectTrigger>
                <SelectContent>
                  {EXCHANGES.map(ex => (
                    <SelectItem key={ex.value} value={ex.value}>
                      {ex.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="required">כמות</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
                min="0"
                step="any"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="required">מטבע</Label>
              <Select
                value={formData.currency}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מטבע" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(cur => (
                    <SelectItem key={cur.value} value={cur.value}>
                      {cur.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {formData.currency !== 'ILS' && (
            <div className="p-4 border rounded-md bg-muted/30 space-y-4">
              <div className="space-y-2">
                <Label>מקור שער המרה</Label>
                <RadioGroup 
                  value={formData.exchange_rate_source} 
                  onValueChange={handleExchangeRateSourceChange}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="system" id="system-rate" />
                    <Label htmlFor="system-rate">שער מערכת 
                      {fetchingRate && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
                      {systemExchangeRate && ` (${systemExchangeRate})`}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="manual" id="manual-rate" />
                    <Label htmlFor="manual-rate">הזנה ידנית</Label>
                  </div>
                </RadioGroup>
                 {formData.exchange_rate_source === 'system' && !systemExchangeRate && !fetchingRate && (
                    <p className="text-xs text-destructive">לא נמצא שער מערכת זמין למטבע {formData.currency}. אנא הזן ידנית.</p>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exchange_rate" className="required">שער המרה לש"ח</Label>
                  <Input
                    id="exchange_rate"
                    type="number"
                    value={formData.exchange_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, exchange_rate: e.target.value }))}
                    placeholder="לדוגמה: 3.7"
                    min="0"
                    step="any"
                    dir="ltr"
                    readOnly={formData.exchange_rate_source === 'system'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchange_rate_date" className="required">תאריך שער המרה</Label>
                  <Input
                    id="exchange_rate_date"
                    type="date"
                    value={formData.exchange_rate_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, exchange_rate_date: e.target.value }))}
                    dir="ltr"
                    readOnly={formData.exchange_rate_source === 'system'}
                  />
                </div>
              </div>
               <p className="col-span-2 text-xs text-muted-foreground">
                יש להזין שער המרה עדכני כדי שהנכס יוצג נכון בסיכום השווי הכולל בש"ח.
              </p>
            </div>
          )}

           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">מחיר רכישה ממוצע</Label>
              <Input
                id="purchase_price"
                type="number"
                value={formData.purchase_price}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
                placeholder="0"
                min="0"
                step="any"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_value" className="required">שווי נוכחי (במטבע הנכס)</Label>
              <Input
                id="current_value"
                type="number"
                value={formData.current_value}
                onChange={(e) => setFormData(prev => ({ ...prev, current_value: e.target.value }))}
                placeholder="0"
                min="0"
                step="any"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="update_method"
              checked={formData.update_method === 'automatic'}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  update_method: checked ? 'automatic' : 'manual'
                }))
              }
            />
            <Label htmlFor="update_method">עדכון אוטומטי של מחירים</Label>
          </div>

          <div className="space-y-3 p-4 border rounded-md">
            <Label className="font-semibold">נתוני נזילות:</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="is_immediately_liquid"
                checked={formData.liquidity_data.is_immediately_liquid}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({
                    ...prev,
                    liquidity_data: { ...prev.liquidity_data, is_immediately_liquid: checked, release_date: checked ? '' : prev.liquidity_data.release_date }
                  }))
                }
              />
              <Label htmlFor="is_immediately_liquid">נזיל מיידית</Label>
            </div>
            {!formData.liquidity_data.is_immediately_liquid && (
              <div className="space-y-2">
                <Label htmlFor="release_date">תאריך שחרור צפוי</Label>
                <Input
                  id="release_date"
                  type="date"
                  value={formData.liquidity_data.release_date}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      liquidity_data: { ...prev.liquidity_data, release_date: e.target.value }
                    }))
                  }
                  dir="ltr"
                />
              </div>
            )}
          </div>


          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="הערות נוספות..."
            />
          </div>

          <style jsx global>{`
            .required:after {
              content: " *";
              color: red;
            }
          `}</style>

          <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading || fetchingRate}>
              {(loading || fetchingRate) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? 'שומר...' : asset ? 'עדכן נכס' : 'הוסף נכס'}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
}
