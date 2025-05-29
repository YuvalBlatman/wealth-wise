
import React, { useState, useEffect } from 'react';
import { Asset } from '@/api/entities';
import { EconomicDataPoint } from '@/api/entities'; // Import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group" // Import
import { X, AlertCircle, Loader2 } from 'lucide-react'; // Import Loader2

const PROPERTY_TYPES = [
  { value: 'residential_apartment', label: 'דירת מגורים' }, 
  { value: 'investment_apartment', label: 'דירה להשקעה' }, 
  { value: 'office', label: 'משרד' },
  { value: 'retail', label: 'חנות / מסחרי' },
  { value: 'storage', label: 'מחסן' },
  { value: 'parking', label: 'חניה' },
  { value: 'land', label: 'קרקע' },
  { value: 'other', label: 'אחר' }
];

const CURRENCIES = [
  { value: 'ILS', label: '₪ שקל ישראלי' },
  { value: 'USD', label: '$ דולר אמריקאי' },
  { value: 'EUR', label: '€ אירו' },
  { value: 'GBP', label: '£ לירה שטרלינג' }
];

const VALUATION_SOURCES = [
  { value: 'appraiser', label: 'שמאי' },
  { value: 'recent_purchase', label: 'רכישה אחרונה' },
  { value: 'tax', label: 'הערכה לצרכי מס' },
  { value: 'madlan', label: 'מדלן' },
  { value: 'yad2', label: 'יד 2' },
  { value: 'personal', label: 'הערכה אישית' },
  { value: 'other', label: 'אחר' }
];

const RENT_INDEXATION_TYPES = [
    { value: 'none', label: 'ללא הצמדה' },
    { value: 'cpi', label: 'צמוד למדד' },
    { value: 'prime', label: 'צמוד לפריים' },
    { value: 'other', label: 'אחר' }
];

const INVESTMENT_APARTMENT_KEY = 'investment_apartment';

export default function RealEstateForm({ asset, onSave, onCancel, onClose }) {
  const [formData, setFormData] = useState({
    asset_type_key: '',
    description: '',
    address: '',
    size_sqm: '', 
    currency: 'ILS',
    current_value: '',
    valuation_source: '',
    valuation_date: new Date().toISOString().split('T')[0], 
    monthly_rent_income: '',
    rent_indexation_types: [],
    other_rent_indexation_details: '',
    notes: '',
    liquidity_data: { rent_to_liquid_account: false },
    exchange_rate_source: 'manual',
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
      let rentIndexationTypes = [];
      if (asset.rent_indexation_type) {
        try { rentIndexationTypes = JSON.parse(asset.rent_indexation_type); } 
        catch { rentIndexationTypes = [asset.rent_indexation_type]; }
      }

      setFormData({
        asset_type_key: asset.asset_type_key || '',
        description: asset.description || '',
        address: asset.address || '',
        size_sqm: asset.size?.toString() || '',
        currency: asset.currency || 'ILS',
        current_value: asset.current_value?.toString() || '',
        valuation_source: asset.valuation_source || '',
        valuation_date: asset.last_valuation_date || new Date().toISOString().split('T')[0],
        monthly_rent_income: asset.monthly_rent_income?.toString() || '',
        rent_indexation_types: Array.isArray(rentIndexationTypes) ? rentIndexationTypes : [],
        other_rent_indexation_details: asset.other_rent_indexation_details || '',
        notes: asset.notes || '',
        liquidity_data: asset.liquidity_data || { rent_to_liquid_account: false },
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
  
  const handleRentIndexationChange = (value, checked) => {
    setFormData(prev => {
      let newRentIndexationTypes;
      if (checked) {
        newRentIndexationTypes = [...prev.rent_indexation_types, value];
      } else {
        newRentIndexationTypes = prev.rent_indexation_types.filter(type => type !== value);
        if (value === 'other') {
          return { ...prev, rent_indexation_types: newRentIndexationTypes, other_rent_indexation_details: '' };
        }
      }
      return { ...prev, rent_indexation_types: newRentIndexationTypes };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.asset_type_key) { setError('נא לבחור סוג נכס.'); setLoading(false); return; }
    if (!formData.address.trim()) { setError('נא למלא כתובת מלאה.'); setLoading(false); return; }
    if (!formData.size_sqm || isNaN(Number(formData.size_sqm))) { setError('נא למלא שטח במ"ר במספרים.'); setLoading(false); return; }
    if (!formData.current_value || isNaN(Number(formData.current_value))) { setError('נא למלא שווי נוכחי במספרים.'); setLoading(false); return; }
    if (!formData.valuation_source) { setError('נא לבחור מקור הערכת שווי.'); setLoading(false); return; }
    if (!formData.currency) { setError('נא לבחור מטבע.'); setLoading(false); return; }
    if (formData.currency !== 'ILS' && (!formData.exchange_rate || isNaN(Number(formData.exchange_rate)) || Number(formData.exchange_rate) <= 0)) {
        setError('עבור מטבע שאינו ש"ח, נא למלא שער המרה חיובי.');
        setLoading(false);
        return;
    }
    
    const description = formData.description.trim() || `${PROPERTY_TYPES.find(pt => pt.value === formData.asset_type_key)?.label || 'נדל"ן'} ב${formData.address}`;

    try {
      const dataToSubmit = {
        category: 'real_estate',
        asset_type_key: formData.asset_type_key,
        description: description,
        address: formData.address,
        size: Number(formData.size_sqm),
        currency: formData.currency,
        current_value: Number(formData.current_value),
        valuation_source: formData.valuation_source,
        last_valuation_date: formData.valuation_date,
        monthly_rent_income: formData.asset_type_key === INVESTMENT_APARTMENT_KEY && formData.monthly_rent_income ? Number(formData.monthly_rent_income) : null,
        rent_indexation_type: formData.asset_type_key === INVESTMENT_APARTMENT_KEY ? JSON.stringify(formData.rent_indexation_types) : null,
        other_rent_indexation_details: formData.asset_type_key === INVESTMENT_APARTMENT_KEY && formData.rent_indexation_types.includes('other') ? formData.other_rent_indexation_details : null,
        notes: formData.notes,
        update_method: 'manual',
        last_updated_manual: new Date().toISOString(),
        liquidity_data: formData.asset_type_key === INVESTMENT_APARTMENT_KEY ? formData.liquidity_data : null,
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
              onValueChange={(value) => setFormData(prev => ({ ...prev, asset_type_key: value, rent_indexation_types: [], other_rent_indexation_details: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג נכס" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור הנכס (אופציונלי אם כתובת מלאה)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="תיאור קצר של הנכס"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="required">כתובת מלאה</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="רחוב, מספר, עיר"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size_sqm" className="required">שטח במ"ר</Label>
              <Input
                id="size_sqm"
                type="number"
                value={formData.size_sqm}
                onChange={(e) => setFormData(prev => ({ ...prev, size_sqm: e.target.value }))}
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
                    <RadioGroupItem value="system" id="re-system-rate" />
                    <Label htmlFor="re-system-rate">שער מערכת 
                      {fetchingRate && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
                      {systemExchangeRate && ` (${systemExchangeRate})`}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="manual" id="re-manual-rate" />
                    <Label htmlFor="re-manual-rate">הזנה ידנית</Label>
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
            <Label htmlFor="current_value" className="required">שווי נוכחי (במטבע הנכס)</Label>
            <Input
              id="current_value"
              type="number"
              value={formData.current_value}
              onChange={(e) => setFormData(prev => ({ ...prev, current_value: e.target.value }))}
              placeholder="0"
              min="0"
              step="1000"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valuation_source" className="required">מקור הערכת שווי</Label>
              <Select
                value={formData.valuation_source}
                onValueChange={(value) => setFormData(prev => ({ ...prev, valuation_source: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מקור" />
                </SelectTrigger>
                <SelectContent>
                  {VALUATION_SOURCES.map(source => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valuation_date">תאריך הערכה</Label>
              <Input
                id="valuation_date"
                type="date"
                value={formData.valuation_date}
                onChange={(e) => setFormData(prev => ({ ...prev, valuation_date: e.target.value }))}
                dir="ltr"
              />
            </div>
          </div>

          {formData.asset_type_key === INVESTMENT_APARTMENT_KEY && (
            <>
              <div className="space-y-2">
                <Label htmlFor="monthly_rent_income">שכירות חודשית</Label>
                <Input
                  id="monthly_rent_income"
                  type="number"
                  value={formData.monthly_rent_income}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthly_rent_income: e.target.value }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  dir="ltr"
                />
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id="rent_to_liquid_account"
                  checked={formData.liquidity_data.rent_to_liquid_account}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      liquidity_data: { ...prev.liquidity_data, rent_to_liquid_account: checked }
                    }))
                  }
                />
                <Label htmlFor="rent_to_liquid_account" className="text-sm font-normal">
                  האם השכירות מתקבלת לחשבון נזיל (לצורך חישוב נזילות)?
                </Label>
              </div>
              <div className="space-y-2">
                <Label>הצמדת שכר דירה (ניתן לבחור כמה אפשרויות)</Label>
                <div className="space-y-2">
                    {RENT_INDEXATION_TYPES.map(type => (
                        <div key={type.value} className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Checkbox
                                id={`rent_indexation_${type.value}`}
                                checked={formData.rent_indexation_types.includes(type.value)}
                                onCheckedChange={(checked) => handleRentIndexationChange(type.value, checked)}
                            />
                            <Label htmlFor={`rent_indexation_${type.value}`} className="text-sm font-normal">
                                {type.label}
                            </Label>
                        </div>
                    ))}
                </div>
              </div>
              {formData.rent_indexation_types.includes('other') && (
                <div className="space-y-2">
                  <Label htmlFor="other_rent_indexation_details">פרט הצמדת שכר דירה אחרת</Label>
                  <Input
                    id="other_rent_indexation_details"
                    value={formData.other_rent_indexation_details}
                    onChange={(e) => setFormData(prev => ({ ...prev, other_rent_indexation_details: e.target.value }))}
                    placeholder="תיאור ההצמדה"
                  />
                </div>
              )}
            </>
          )}

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
