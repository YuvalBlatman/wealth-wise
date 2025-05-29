
import React, { useState, useEffect } from 'react';
import { Asset } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { X, AlertCircle, Scan, Briefcase } from 'lucide-react'; // Added Briefcase for Study Fund
import DocumentScanModal from '../modals/DocumentScanModal';

const PROVIDERS = [
  { value: 'menora', label: 'מנורה מבטחים' },
  { value: 'migdal', label: 'מגדל' },
  { value: 'clal', label: 'כלל' },
  { value: 'harel', label: 'הראל' },
  { value: 'phoenix', label: 'הפניקס' },
  { value: 'altshuler', label: 'אלטשולר שחם' },
  { value: 'psagot', label: 'פסגות' },
  { value: 'meitav', label: 'מיטב דש' },
  { value: 'other', label: 'אחר' }
];

const CURRENCIES = [
  { value: 'ILS', label: '₪ שקל ישראלי' }
];

// Since this form is specifically for Study Funds, asset_type_key will be fixed
const ASSET_TYPE_KEY_STUDY_FUND = 'study_fund_general'; 

export default function StudyFundForm({ asset, onSave, onCancel, onClose, assetTypesForCategory = [] }) {
  const [formData, setFormData] = useState({
    description: '',
    provider: '',
    investment_route: '',
    currency: 'ILS',
    current_value: '',
    monthly_deposit: '',
    start_date: '', // open_date - exists
    end_date: '', // New field for manual release date
    insurance_coverage: '', 
    update_method: 'manual',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScanDialog, setShowScanDialog] = useState(false);

  useEffect(() => {
    if (asset) {
      setFormData({
        description: asset.description || `קרן השתלמות ${asset.institution_name || ''}`,
        provider: asset.institution_name || '',
        investment_route: asset.fund_track_number || '',
        currency: asset.currency || 'ILS',
        current_value: asset.current_value?.toString() || '',
        monthly_deposit: asset.monthly_deposit_amount?.toString() || '',
        start_date: asset.open_date || '',
        end_date: asset.end_date || '', // Load manual release date
        insurance_coverage: asset.insurance_coverage_details || '',
        update_method: asset.update_method || 'manual',
        notes: asset.notes || ''
      });
    } else {
      setFormData({
        description: '',
        provider: '',
        investment_route: '',
        currency: 'ILS',
        current_value: '',
        monthly_deposit: '',
        start_date: '',
        end_date: '', // Init manual release date
        insurance_coverage: '',
        update_method: 'manual',
        notes: ''
      });
    }
  }, [asset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.description.trim()) { setError('נא למלא תיאור.'); setLoading(false); return; }
    if (!formData.provider) { setError('נא לבחור גוף מנהל.'); setLoading(false); return; }
    if (!formData.current_value || isNaN(Number(formData.current_value))) { setError('נא למלא יתרה צבורה במספרים.'); setLoading(false); return; }
    if (!formData.investment_route.trim()) { setError('נא למלא מספר מסלול השקעה.'); setLoading(false); return; }
    if (!formData.currency) { setError('נא לבחור מטבע.'); setLoading(false); return; }


    try {
      const dataToSubmit = {
        category: 'study_funds', 
        asset_type_key: ASSET_TYPE_KEY_STUDY_FUND, 
        description: formData.description,
        institution_name: formData.provider,
        fund_track_number: formData.investment_route,
        currency: formData.currency,
        current_value: Number(formData.current_value),
        monthly_deposit_amount: formData.monthly_deposit ? Number(formData.monthly_deposit) : null,
        open_date: formData.start_date,
        end_date: formData.end_date, // Save manual release date
        insurance_coverage_details: formData.insurance_coverage,
        update_method: formData.update_method,
        notes: formData.notes,
        last_updated_manual: new Date().toISOString()
      };

      if (asset?.id) {
        await Asset.update(asset.id, dataToSubmit);
      } else {
        await Asset.create(dataToSubmit);
      }
      onSave();
    } catch (err) {
      setError(err.message || 'אירעה שגיאה בשמירת קרן ההשתלמות. אנא נסו שנית.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanData = (data) => {
    if (!data) return;
    const updatedData = {
      ...formData,
      description: data.description || formData.description || `קרן השתלמות ${data.institution_name || ''}`,
      provider: data.institution_name || formData.provider,
      investment_route: data.fund_track_number || formData.investment_route,
      current_value: data.current_value ? data.current_value.toString() : formData.current_value,
    };
    setFormData(updatedData);
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

      <DocumentScanModal
        open={showScanDialog}
        onOpenChange={setShowScanDialog}
        onSaveData={handleScanData}
        documentType="pension" // Can reuse pension OCR schema for study funds
        onEditManually={handleScanData}
      />

      <ScrollArea className="h-[80vh] px-4">
        <form onSubmit={handleSubmit} className="space-y-6 pt-8" dir="rtl">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              type="button"
              variant="outline"
              onClick={() => setShowScanDialog(true)}
              className="mb-4"
            >
              <Scan className="h-4 w-4 ml-2" />
              סרוק דו״ח קרן השתלמות
            </Button>
          </div>
          
          {/* asset_type_key is fixed, so no Select for it. Display a title? */}
          <div className="text-lg font-semibold flex items-center mb-4">
            <Briefcase className="w-5 h-5 mr-2 text-primary" />
            קרן השתלמות
          </div>


          <div className="space-y-2">
            <Label htmlFor="description" className="required">תיאור</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="תיאור או שם לזיהוי (למשל, קרן השתלמות אלטשולר)"
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">תאריך פתיחה (לחישוב נזילות)</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">תאריך מימוש ידני (אופציונלי)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                dir="ltr"
                placeholder="אם לא יוזן, נזילות תחושב אוטומטית"
              />
            </div>
          </div>

          {/* Insurance coverage might be less relevant, but kept for structure */}
          <div className="space-y-2">
            <Label htmlFor="insurance_coverage">כיסוי ביטוחי (אם רלוונטי)</Label>
            <Textarea
              id="insurance_coverage"
              value={formData.insurance_coverage}
              onChange={(e) => setFormData(prev => ({ ...prev, insurance_coverage: e.target.value }))}
              placeholder="פירוט הכיסויים הביטוחיים אם יש"
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
              {loading ? 'שומר...' : asset ? 'עדכן קרן' : 'הוסף קרן'}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
}
