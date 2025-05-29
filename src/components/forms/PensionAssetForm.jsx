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

const PENSION_TYPES = [
  { value: 'new_pension', label: 'קרן פנסיה חדשה' },
  { value: 'old_pension', label: 'קרן פנסיה ותיקה' },
  { value: 'managers_insurance', label: 'ביטוח מנהלים' },
  { value: 'study_fund', label: 'קרן השתלמות' },
  { value: 'provident_fund', label: 'קופת גמל' },
  { value: 'life_insurance', label: 'ביטוח חיים' },
  { value: 'disability_insurance', label: 'אובדן כושר עבודה' }
];

const PROVIDERS = [
  { value: 'menora', label: 'מנורה מבטחים' },
  { value: 'migdal', label: 'מגדל' },
  { value: 'clal', label: 'כלל' },
  { value: 'harel', label: 'הראל' },
  { value: 'phoenix', label: 'הפניקס' },
  { value: 'altshuler', label: 'אלטשולר שחם' },
  { value: 'psagot', label: 'פסגות' },
  { value: 'more', label: 'מיטב דש' },
  { value: 'other', label: 'אחר' }
];

const CURRENCIES = [
  { value: 'ILS', label: '₪ שקל ישראלי' }
];

export default function PensionAssetForm({ asset, onSave, onCancel, onClose }) {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    provider: '',
    investment_route: '',
    currency: 'ILS',
    current_value: '',
    monthly_deposit: '',
    monthly_pension_estimate: '',
    start_date: '',
    insurance_coverage: '',
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
        provider: asset.provider || '',
        investment_route: asset.investment_route || '',
        currency: asset.currency || 'ILS',
        current_value: asset.current_value?.toString() || '',
        monthly_deposit: asset.monthly_deposit?.toString() || '',
        monthly_pension_estimate: asset.monthly_pension_estimate?.toString() || '',
        start_date: asset.start_date || '',
        insurance_coverage: asset.insurance_coverage || '',
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
      if (!formData.type || !formData.provider || !formData.current_value || !formData.investment_route) {
        throw new Error('נא למלא את כל שדות החובה');
      }

      const data = {
        ...formData,
        category: 'pension_insurance',
        current_value: Number(formData.current_value),
        monthly_deposit: formData.monthly_deposit ? Number(formData.monthly_deposit) : null,
        monthly_pension_estimate: formData.monthly_pension_estimate ? Number(formData.monthly_pension_estimate) : null
      };

      if (asset?.id) {
        await Asset.update(asset.id, data);
      } else {
        await Asset.create(data);
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
            <Label htmlFor="type" className="required">סוג מכשיר</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג מכשיר" />
              </SelectTrigger>
              <SelectContent>
                {PENSION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="תיאור או שם לזיהוי"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider" className="required">גוף מנהל</Label>
            <Select
              value={formData.provider}
              onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר חברה מנהלת" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map(provider => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="investment_route" className="required">מספר מסלול השקעה</Label>
            <Input
              id="investment_route"
              value={formData.investment_route}
              onChange={(e) => setFormData(prev => ({ ...prev, investment_route: e.target.value }))}
              placeholder="מספר מסלול השקעה"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_value" className="required">יתרה צבורה</Label>
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

            <div className="space-y-2">
              <Label htmlFor="currency">מטבע</Label>
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
              <Label htmlFor="monthly_deposit">הפקדה חודשית</Label>
              <Input
                id="monthly_deposit"
                type="number"
                value={formData.monthly_deposit}
                onChange={(e) => setFormData(prev => ({ ...prev, monthly_deposit: e.target.value }))}
                placeholder="0"
                min="0"
                step="0.01"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_pension_estimate">קצבה חודשית צפויה</Label>
              <Input
                id="monthly_pension_estimate"
                type="number"
                value={formData.monthly_pension_estimate}
                onChange={(e) => setFormData(prev => ({ ...prev, monthly_pension_estimate: e.target.value }))}
                placeholder="0"
                min="0"
                step="0.01"
                dir="ltr"
              />
            </div>
          </div>

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
            <Label htmlFor="insurance_coverage">כיסוי ביטוחי</Label>
            <Textarea
              id="insurance_coverage"
              value={formData.insurance_coverage}
              onChange={(e) => setFormData(prev => ({ ...prev, insurance_coverage: e.target.value }))}
              placeholder="פירוט הכיסויים הביטוחיים"
            />
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
            <Label htmlFor="update_method">עדכון אוטומטי של הערך הצבור</Label>
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
              {loading ? 'שומר...' : asset ? 'עדכן נכס' : 'הוסף נכס'}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
}