
import React, { useState, useEffect } from 'react';
import { Asset } from '@/api/entities';
import { EconomicDataPoint } from '@/api/entities'; // Import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group" // Import
import { X, AlertCircle, Loader2 } from 'lucide-react'; // Import Loader2
import { Switch } from "@/components/ui/switch"

const ASSET_TYPES = [
  { value: 'startup', label: 'סטארטאפ' },
  { value: 'investment_fund', label: 'קרן השקעה פרטית' },
  { value: 'p2p_loan', label: 'הלוואה פרטית / P2P' },
  { value: 'precious_metals', label: 'מתכות יקרות' },
  { value: 'luxury_car', label: 'רכב יוקרה' },
  { value: 'art', label: 'אמנות' },
  { value: 'foreign_realestate', label: 'נדל"ן בחו"ל' },
  { value: 'crypto', label: 'קריפטו' },
  { value: 'other', label: 'אחר' }
];

const CURRENCIES = [
  { value: 'ILS', label: '₪ שקל ישראלי' },
  { value: 'USD', label: '$ דולר אמריקאי' },
  { value: 'EUR', label: '€ אירו' },
  { value: 'GBP', label: '£ לירה שטרלינג' }
];

const STATUSES = [
  { value: 'active', label: 'פעיל' },
  { value: 'sold', label: 'נמכר' },
  { value: 'written_off', label: 'נמחק' }
];

export default function AlternativeForm({ asset, onSave, onCancel, onClose }) {
  const [formData, setFormData] = useState({
    asset_type_key: '',
    description: '',
    currency: 'ILS',
    original_investment: '',
    current_value: '',
    investment_date: '',
    status: 'active',
    notes: '',
    liquidity_data: { is_immediately_liquid: false, release_date: '' },
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
        currency: asset.currency || 'ILS',
        original_investment: asset.original_investment_value?.toString() || '',
        current_value: asset.current_value?.toString() || '',
        investment_date: asset.open_date || '',
        status: asset.investment_status || 'active',
        notes: asset.notes || '',
        liquidity_data: asset.liquidity_data || { is_immediately_liquid: false, release_date: '' },
        exchange_rate_source: asset.exchange_rate ? 'manual' : 'system',
        exchange_rate: asset.exchange_rate?.toString() || '',
        exchange_rate_date: asset.exchange_rate_date || new Date().toISOString().split('T')[0]
      });
      if (asset.currency && asset.currency !== 'ILS') {
        fetchSystemRate(asset.currency);
      }
    } else {
       if (formData.currency && formData.currency !== 'ILS') {
         fetchSystemRate(formData.currency);
      }
    }
  }, [asset]);

  useEffect(() => {
    if (formData.currency && formData.currency !== 'ILS') {
      fetchSystemRate(formData.currency);
    } else {
      setSystemExchangeRate(null);
      setSystemExchangeRateDate(null);
      if (formData.exchange_rate_source === 'system') {
          setFormData(prev => ({...prev, exchange_rate: '', exchange_rate_date: ''}));
      }
    }
  }, [formData.currency]);

  useEffect(() => {
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
  };

  const handleExchangeRateSourceChange = (value) => {
    setFormData(prev => ({
        ...prev,
        exchange_rate_source: value,
        exchange_rate: value === 'system' && systemExchangeRate ? systemExchangeRate : '',
        exchange_rate_date: value === 'system' && systemExchangeRateDate ? systemExchangeRateDate : new Date().toISOString().split('T')[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Frontend Validation
    if (!formData.asset_type_key) {
      setError('נא לבחור סוג נכס.');
      setLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('נא למלא שם הנכס / השקעה.');
      setLoading(false);
      return;
    }
    if (!formData.current_value || isNaN(Number(formData.current_value))) {
      setError('נא למלא שווי נוכחי מוערך במספרים.');
      setLoading(false);
      return;
    }
    if (!formData.currency) {
        setError('נא לבחור מטבע.');
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
        category: 'alternative_assets',
        asset_type_key: formData.asset_type_key,
        description: formData.description,
        currency: formData.currency,
        original_investment_value: formData.original_investment ? Number(formData.original_investment) : null,
        current_value: Number(formData.current_value),
        open_date: formData.investment_date,
        investment_status: formData.status,
        notes: formData.notes,
        last_updated_manual: new Date().toISOString(),
        update_method: 'manual',
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
            <Label htmlFor="asset_type_key" className="required">סוג נכס</Label>
            <Select
              value={formData.asset_type_key}
              onValueChange={(value) => setFormData(prev => ({ ...prev, asset_type_key: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג נכס" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

           <div className="space-y-2">
            <Label htmlFor="description" className="required">שם הנכס / השקעה</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="שם החברה או תיאור הנכס"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="original_investment">סכום השקעה מקורי</Label>
              <Input
                id="original_investment"
                type="number"
                value={formData.original_investment}
                onChange={(e) => setFormData(prev => ({ ...prev, original_investment: e.target.value }))}
                placeholder="0"
                min="0"
                step="0.01"
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
                    <RadioGroupItem value="system" id="alt-system-rate" />
                    <Label htmlFor="alt-system-rate">שער מערכת 
                      {fetchingRate && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
                      {systemExchangeRate && ` (${systemExchangeRate})`}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="manual" id="alt-manual-rate" />
                    <Label htmlFor="alt-manual-rate">הזנה ידנית</Label>
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

          <div className="space-y-2">
            <Label htmlFor="current_value" className="required">שווי נוכחי מוערך (במטבע הנכס)</Label>
            <Input
              id="current_value"
              type="number"
              value={formData.current_value}
              onChange={(e) => setFormData(prev => ({ ...prev, current_value: e.target.value }))}
              placeholder="0"
              min="0"
              step="0.01"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="investment_date">תאריך השקעה</Label>
              <Input
                id="investment_date"
                type="date"
                value={formData.investment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, investment_date: e.target.value }))}
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
