import React, { useState, useEffect } from 'react';
import { Asset } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { X, AlertCircle } from 'lucide-react';

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

const LIQUIDITY_LEVELS = [
  { value: 'high', label: 'גבוהה' },
  { value: 'medium', label: 'בינונית' },
  { value: 'low', label: 'נמוכה' }
];

const STATUSES = [
  { value: 'active', label: 'פעיל' },
  { value: 'sold', label: 'נמכר' },
  { value: 'written_off', label: 'נמחק' }
];

export default function AlternativeAssetForm({ asset, onSave, onCancel, onClose }) {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    currency: 'ILS',
    original_investment: '',
    current_value: '',
    investment_date: '',
    expected_exit_date: '',
    liquidity_level: '',
    status: 'active',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (asset) {
      setFormData({
        type: asset.type || '',
        description: asset.description || '',
        currency: asset.currency || 'ILS',
        original_investment: asset.original_investment?.toString() || '',
        current_value: asset.current_value?.toString() || '',
        investment_date: asset.investment_date || '',
        expected_exit_date: asset.expected_exit_date || '',
        liquidity_level: asset.liquidity_level || '',
        status: asset.status || 'active',
        notes: asset.notes || ''
      });
    }
  }, [asset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.type || !formData.description || !formData.current_value) {
        throw new Error('נא למלא את כל שדות החובה');
      }

      const data = {
        ...formData,
        category: 'alternative_assets',
        original_investment: Number(formData.original_investment) || 0,
        current_value: Number(formData.current_value)
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
            <Label htmlFor="type" className="required">סוג נכס</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
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

          <div className="space-y-2">
            <Label htmlFor="current_value" className="required">שווי נוכחי מוערך</Label>
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

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="expected_exit_date">תאריך יציאה צפוי</Label>
              <Input
                id="expected_exit_date"
                type="date"
                value={formData.expected_exit_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_exit_date: e.target.value }))}
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="liquidity_level">רמת נזילות</Label>
              <Select
                value={formData.liquidity_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, liquidity_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר רמת נזילות" />
                </SelectTrigger>
                <SelectContent>
                  {LIQUIDITY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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