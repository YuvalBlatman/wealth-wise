import React, { useState, useEffect } from 'react';
import { Asset } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { X, AlertCircle } from 'lucide-react';

const SAVINGS_TYPES = [
  { value: 'fixed_deposit', label: 'פק"מ' },
  { value: 'savings_plan', label: 'תוכנית חיסכון' },
  { value: 'investment_provident', label: 'קופת גמל להשקעה' },
  { value: 'child_savings', label: 'חיסכון לכל ילד' },
  { value: 'checking', label: 'עו"ש' },
  { value: 'other', label: 'אחר' }
];

const INSTITUTIONS = [
  { value: 'leumi', label: 'בנק לאומי' },
  { value: 'poalim', label: 'בנק הפועלים' },
  { value: 'discount', label: 'בנק דיסקונט' },
  { value: 'mizrahi', label: 'בנק מזרחי-טפחות' },
  { value: 'fibi', label: 'הבנק הבינלאומי' },
  { value: 'jerusalem', label: 'בנק ירושלים' },
  { value: 'union', label: 'בנק איגוד' },
  { value: 'other', label: 'אחר' }
];

const CURRENCIES = [
  { value: 'ILS', label: '₪ שקל ישראלי' },
  { value: 'USD', label: '$ דולר אמריקאי' },
  { value: 'EUR', label: '€ אירו' },
  { value: 'GBP', label: '£ לירה שטרלינג' }
];

export default function SavingsAssetForm({ asset, onSave, onCancel, onClose }) {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    institution_name: '',
    interest_rate: '',
    start_date: '',
    end_date: '',
    currency: 'ILS',
    current_value: '',
    is_locked: false,
    lock_end_date: '',
    fund_track_number: '',
    update_method: 'manual',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (asset) {
      setFormData({
        type: asset.type || '',
        description: asset.description || '',
        institution_name: asset.institution_name || '',
        interest_rate: asset.interest_rate?.toString() || '',
        start_date: asset.start_date || '',
        end_date: asset.end_date || '',
        currency: asset.currency || 'ILS',
        current_value: asset.current_value?.toString() || '',
        is_locked: asset.is_locked || false,
        lock_end_date: asset.lock_end_date || '',
        fund_track_number: asset.fund_track_number || '',
        update_method: asset.update_method || 'manual',
        notes: asset.notes || ''
      });
    }
  }, [asset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.type || !formData.institution_name || !formData.current_value) {
        throw new Error('נא למלא את כל שדות החובה');
      }

      const data = {
        ...formData,
        category: 'savings_deposits',
        current_value: Number(formData.current_value),
        interest_rate: formData.interest_rate ? Number(formData.interest_rate) : null
      };

      if (asset?.id) {
        await Asset.update(asset.id, data);
      } else {
        await Asset.create(data);
      }
      onSave();
    } catch (err) {
      setError(err.message || 'אירעה שגיאה בשמירת החיסכון. אנא נסו שנית.');
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
        className="absolute left-2 top-2"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <ScrollArea className="h-[80vh] px-4">
        <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="type" className="required">סוג חיסכון</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג חיסכון" />
              </SelectTrigger>
              <SelectContent>
                {SAVINGS_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור החיסכון</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="תיאור או שם לזיהוי החיסכון"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution_name" className="required">מוסד פיננסי</Label>
            <Select
              value={formData.institution_name}
              onValueChange={(value) => setFormData(prev => ({ ...prev, institution_name: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר מוסד" />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTIONS.map(inst => (
                  <SelectItem key={inst.value} value={inst.value}>
                    {inst.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interest_rate">ריבית שנתית (%)</Label>
              <Input
                id="interest_rate"
                type="number"
                value={formData.interest_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: e.target.value }))}
                placeholder="0.00"
                step="0.01"
                min="0"
                max="100"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="required">מטבע</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">תאריך פתיחה</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">תאריך סיום</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_value" className="required">סכום נוכחי</Label>
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

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                id="is_locked"
                checked={formData.is_locked}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_locked: checked }))}
              />
              <Label htmlFor="is_locked">החיסכון נעול עד תאריך מסוים</Label>
            </div>

            {formData.is_locked && (
              <div className="space-y-2">
                <Label htmlFor="lock_end_date">תאריך שחרור הנעילה</Label>
                <Input
                  id="lock_end_date"
                  type="date"
                  value={formData.lock_end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, lock_end_date: e.target.value }))}
                  dir="ltr"
                />
              </div>
            )}
          </div>

          {formData.type === 'investment_provident' && (
            <div className="space-y-2">
              <Label htmlFor="fund_track_number">מספר מסלול השקעה</Label>
              <Input
                id="fund_track_number"
                value={formData.fund_track_number}
                onChange={(e) => setFormData(prev => ({ ...prev, fund_track_number: e.target.value }))}
                placeholder="מספר מסלול השקעה בקופת הגמל"
                dir="ltr"
              />
            </div>
          )}

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
            <Label htmlFor="update_method">עדכון אוטומטי של ערך החיסכון</Label>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'שומר...' : asset ? 'עדכן חיסכון' : 'הוסף חיסכון'}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
}