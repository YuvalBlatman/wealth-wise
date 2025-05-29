
import React, { useState, useEffect } from 'react';
import { Asset } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { X, AlertCircle, Scan, Briefcase, PiggyBank, Building } from 'lucide-react'; // Added icons for different types
import DocumentScanModal from '../modals/DocumentScanModal';
import { Card, CardContent } from "@/components/ui/card"

const SAVINGS_TYPES = [
  { value: 'fixed_deposit', label: 'פק"מ', icon: PiggyBank },
  { value: 'savings_plan', label: 'תוכנית חיסכון', icon: PiggyBank },
  { value: 'child_savings', label: 'חיסכון לכל ילד', icon: Briefcase }, // Similar to study fund
  { value: 'checking', label: 'עו"ש', icon: Building }, // Bank icon
  { value: 'other', label: 'אחר', icon: PiggyBank }
];

const INSTITUTIONS = [
  { value: 'leumi', label: 'בנק לאומי' },
  { value: 'poalim', label: 'בנק הפועלים' },
  { value: 'discount', label: 'בנק דיסקונט' },
  { value: 'mizrahi', label: 'בנק מזרחי-טפחות' },
  { value: 'fibi', label: 'הבנק הבינלאומי' },
  { value: 'jerusalem', label: 'בנק ירושלים' },
  { value: 'union', label: 'בנק איגוד' },
  // For Child Savings and other fund-like savings
  { value: 'menora', label: 'מנורה מבטחים' },
  { value: 'migdal', label: 'מגדל' },
  { value: 'clal', label: 'כלל' },
  { value: 'harel', label: 'הראל' },
  { value: 'phoenix', label: 'הפניקס' },
  { value: 'altshuler', label: 'אלטשולר שחם' },
  { value: 'psagot', label: 'פסגות' },
  { value: 'meitav', label: 'מיטב דש' },
  { value: 'other_financial', label: 'מוסד פיננסי אחר' }
];

const CURRENCIES = [
  { value: 'ILS', label: '₪ שקל ישראלי' },
  { value: 'USD', label: '$ דולר אמריקאי' },
  { value: 'EUR', label: '€ אירו' },
  { value: 'GBP', label: '£ לירה שטרלינג' }
];

const INTEREST_TYPES = [
    { value: 'fixed', label: 'ריבית קבועה' },
    { value: 'variable', label: 'ריבית משתנה' }
];

const INDEXATION_TYPES = [
    { value: 'none', label: 'ללא הצמדה' },
    { value: 'cpi', label: 'צמוד למדד' },
    { value: 'prime', label: 'צמוד לפריים' },
    { value: 'other', label: 'אחר' }
];

const EXIT_STATION_UNITS = [
    { value: 'days', label: 'ימים' },
    { value: 'weeks', label: 'שבועות' },
    { value: 'months', label: 'חודשים' },
    { value: 'years', label: 'שנים' }
];

const CHILD_SAVINGS_KEY = 'child_savings';
const CHECKING_ACCOUNT_KEY = 'checking';
const DEPOSIT_KEYS = ['fixed_deposit', 'savings_plan'];


export default function SavingsForm({ asset, onSave, onCancel, onClose }) {
  const initialFormData = {
    asset_type_key: '',
    description: '',
    institution: '',
    interest_rate: '',
    interest_type: '',
    indexation_types: [], 
    other_indexation_details: '',
    start_date: '', // Corresponds to open_date
    end_date: '',
    currency: 'ILS',
    current_value: '',
    is_locked: false,
    lock_end_date: '',
    update_method: 'manual',
    notes: '',
    // Fields for 'child_savings' (like study fund)
    fund_track_number: '', 
    monthly_deposit_amount: '',
    insurance_coverage_details: '',
    // Fields for exit stations (new)
    first_exit_station_date: '',
    exit_station_interval_value: '',
    exit_station_interval_unit: 'months',
    // Liquidity specific for 'checking'
    liquidity_data: { is_immediately_liquid: false } 
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScanDialog, setShowScanDialog] = useState(false);

  useEffect(() => {
    if (asset) {
      let indexationTypes = [];
      if (asset.indexation_type) {
        try { indexationTypes = JSON.parse(asset.indexation_type); } 
        catch { indexationTypes = [asset.indexation_type]; }
      }

      setFormData({
        asset_type_key: asset.asset_type_key || '',
        description: asset.description || '',
        institution: asset.institution_name || '',
        interest_rate: asset.interest_rate?.toString() || '',
        interest_type: asset.interest_type || '',
        indexation_types: Array.isArray(indexationTypes) ? indexationTypes : [],
        other_indexation_details: asset.other_indexation_details || '',
        start_date: asset.open_date || '',
        end_date: asset.end_date || '',
        currency: asset.currency || 'ILS',
        current_value: asset.current_value?.toString() || '',
        is_locked: asset.is_locked || false,
        lock_end_date: asset.lock_end_date || '',
        update_method: asset.update_method || 'manual',
        notes: asset.notes || '',
        fund_track_number: asset.fund_track_number || '',
        monthly_deposit_amount: asset.monthly_deposit_amount?.toString() || '',
        insurance_coverage_details: asset.insurance_coverage_details || '',
        first_exit_station_date: asset.first_exit_station_date || '',
        exit_station_interval_value: asset.exit_station_interval_value?.toString() || '',
        exit_station_interval_unit: asset.exit_station_interval_unit || 'months',
        liquidity_data: asset.liquidity_data || { is_immediately_liquid: asset.asset_type_key === CHECKING_ACCOUNT_KEY }
      });
    } else {
      setFormData(initialFormData);
    }
  }, [asset]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => {
        const newState = { ...prev, [name]: value };
        if (name === 'asset_type_key') {
            newState.interest_type = ''; 
            newState.indexation_types = []; 
            newState.other_indexation_details = '';
            newState.fund_track_number = '';
            newState.monthly_deposit_amount = '';
            newState.insurance_coverage_details = '';
            newState.first_exit_station_date = '';
            newState.exit_station_interval_value = '';
            newState.exit_station_interval_unit = 'months';
            newState.liquidity_data = { is_immediately_liquid: value === CHECKING_ACCOUNT_KEY };
        }
        if (name === 'interest_type' && value === 'fixed') {
            newState.indexation_types = []; 
            newState.other_indexation_details = '';
        }
        return newState;
    });
  };

  const handleCheckboxChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleIndexationChange = (value, checked) => {
    setFormData(prev => {
      let newIndexationTypes;
      if (checked) {
        newIndexationTypes = [...prev.indexation_types, value];
      } else {
        newIndexationTypes = prev.indexation_types.filter(type => type !== value);
        if (value === 'other') {
          return { ...prev, indexation_types: newIndexationTypes, other_indexation_details: '' };
        }
      }
      return { ...prev, indexation_types: newIndexationTypes };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // --- Validation based on asset_type_key ---
    if (!formData.asset_type_key) { setError('נא לבחור סוג חיסכון.'); setLoading(false); return; }
    if (!formData.institution) { setError('נא לבחור מוסד.'); setLoading(false); return; }
    if (!formData.current_value || isNaN(Number(formData.current_value))) { setError('נא למלא סכום/יתרה נוכחית במספרים.'); setLoading(false); return; }
    
    let defaultDescription = SAVINGS_TYPES.find(st => st.value === formData.asset_type_key)?.label || 'חיסכון';
    
    if (formData.asset_type_key === CHECKING_ACCOUNT_KEY) {
      if (!formData.description.trim()) defaultDescription = `עו"ש ${INSTITUTIONS.find(i => i.value === formData.institution)?.label || formData.institution}`;
    } else if (formData.asset_type_key === CHILD_SAVINGS_KEY) {
      if (!formData.fund_track_number.trim()) { setError('נא למלא מספר מסלול השקעה.'); setLoading(false); return; }
      if (!formData.description.trim()) defaultDescription = `חיסכון לכל ילד ${INSTITUTIONS.find(i => i.value === formData.institution)?.label || formData.institution}`;
    } else if (DEPOSIT_KEYS.includes(formData.asset_type_key)) {
      if (!formData.description.trim()) { setError('נא למלא תיאור החיסכון.'); setLoading(false); return; }
      if (!formData.interest_type) { setError('נא לבחור סוג ריבית.'); setLoading(false); return; }
      if (formData.interest_type === 'variable' && formData.indexation_types.length === 0) { setError('נא לבחור לפחות סוג הצמדה אחד.'); setLoading(false); return; }
      if (formData.indexation_types.includes('other') && !formData.other_indexation_details.trim()) { setError('נא למלא פרטי הצמדה אחרת.'); setLoading(false); return; }
    } else { // 'other' type
        if (!formData.description.trim()) { setError('נא למלא תיאור החיסכון.'); setLoading(false); return; }
    }


    try {
      const dataToSubmit = {
        category: 'savings_deposits',
        asset_type_key: formData.asset_type_key,
        description: formData.description.trim() || defaultDescription,
        institution_name: formData.institution,
        currency: formData.currency,
        current_value: Number(formData.current_value),
        update_method: formData.update_method,
        notes: formData.notes,
        last_updated_manual: new Date().toISOString(),
        liquidity_data: { is_immediately_liquid: formData.asset_type_key === CHECKING_ACCOUNT_KEY },


        // Conditional fields
        interest_rate: DEPOSIT_KEYS.includes(formData.asset_type_key) && formData.interest_rate ? Number(formData.interest_rate) : null,
        interest_type: DEPOSIT_KEYS.includes(formData.asset_type_key) ? formData.interest_type : null,
        indexation_type: DEPOSIT_KEYS.includes(formData.asset_type_key) && formData.interest_type === 'variable' ? JSON.stringify(formData.indexation_types) : null,
        other_indexation_details: DEPOSIT_KEYS.includes(formData.asset_type_key) && formData.interest_type === 'variable' && formData.indexation_types.includes('other') ? formData.other_indexation_details : null,
        
        open_date: formData.asset_type_key !== CHECKING_ACCOUNT_KEY ? formData.start_date : null,
        end_date: formData.asset_type_key !== CHECKING_ACCOUNT_KEY && !formData.first_exit_station_date ? formData.end_date : null, // end_date if no exit stations
        is_locked: DEPOSIT_KEYS.includes(formData.asset_type_key) ? formData.is_locked : null,
        lock_end_date: DEPOSIT_KEYS.includes(formData.asset_type_key) && formData.is_locked ? formData.lock_end_date : null,
        
        fund_track_number: formData.asset_type_key === CHILD_SAVINGS_KEY ? formData.fund_track_number : null,
        monthly_deposit_amount: formData.asset_type_key === CHILD_SAVINGS_KEY && formData.monthly_deposit_amount ? Number(formData.monthly_deposit_amount) : null,
        insurance_coverage_details: formData.asset_type_key === CHILD_SAVINGS_KEY ? formData.insurance_coverage_details : null,
        
        first_exit_station_date: DEPOSIT_KEYS.includes(formData.asset_type_key) && formData.first_exit_station_date ? formData.first_exit_station_date : null,
        exit_station_interval_value: DEPOSIT_KEYS.includes(formData.asset_type_key) && formData.exit_station_interval_value ? Number(formData.exit_station_interval_value) : null,
        exit_station_interval_unit: DEPOSIT_KEYS.includes(formData.asset_type_key) && formData.exit_station_interval_value ? formData.exit_station_interval_unit : null,
      };

      if (asset?.id) {
        await Asset.update(asset.id, dataToSubmit);
      } else {
        await Asset.create(dataToSubmit);
      }
      onSave();
    } catch (err) {
      setError(err.message || 'אירעה שגיאה בשמירת החיסכון. אנא נסו שנית.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleScanData = (data, formType) => {
    if (!data) return;
    const updatedData = {
      ...formData,
      asset_type_key: data.asset_type_key || formData.asset_type_key,
      description: data.description || formData.description,
      institution: data.institution_name || formData.institution,
      interest_rate: data.interest_rate ? data.interest_rate.toString() : formData.interest_rate,
      start_date: data.open_date || formData.start_date,
      end_date: data.end_date || formData.end_date,
      current_value: data.current_value ? data.current_value.toString() : formData.current_value,
      fund_track_number: data.fund_track_number || formData.fund_track_number
    };
    setFormData(updatedData);
  };
  
  const SelectedIcon = SAVINGS_TYPES.find(t => t.value === formData.asset_type_key)?.icon || PiggyBank;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="absolute left-2 top-2 z-10" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>

      <DocumentScanModal
        open={showScanDialog}
        onOpenChange={setShowScanDialog}
        onSaveData={handleScanData}
        documentType="savings" // Could be 'pension' if scanning for child_savings with fund structure
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
            <Button type="button" variant="outline" onClick={() => setShowScanDialog(true)} className="mb-4">
              <Scan className="h-4 w-4 ml-2" />
              סרוק דו״ח
            </Button>
          </div>
          
          <div className="flex items-center text-lg font-semibold mb-4">
             <SelectedIcon className="w-5 h-5 mr-2 text-primary" />
             {SAVINGS_TYPES.find(t => t.value === formData.asset_type_key)?.label || "פרטי החיסכון"}
          </div>


          <div className="space-y-2">
            <Label htmlFor="asset_type_key" className="required">סוג חיסכון</Label>
            <Select value={formData.asset_type_key} onValueChange={(value) => handleSelectChange('asset_type_key', value)}>
              <SelectTrigger><SelectValue placeholder="בחר סוג חיסכון" /></SelectTrigger>
              <SelectContent>
                {SAVINGS_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* --- Fields for CHECKING ACCOUNT --- */}
          {formData.asset_type_key === CHECKING_ACCOUNT_KEY && (
            <>
              <div className="space-y-2">
                <Label htmlFor="institution" className="required">מוסד פיננסי</Label>
                <Select value={formData.institution} onValueChange={(value) => handleSelectChange('institution', value)}>
                  <SelectTrigger><SelectValue placeholder="בחר מוסד" /></SelectTrigger>
                  <SelectContent>
                    {INSTITUTIONS.filter(i => !['menora', 'migdal', 'clal', 'harel', 'phoenix', 'altshuler', 'psagot', 'meitav', 'other_financial'].includes(i.value)).map(inst => ( // Filter out non-bank institutions
                      <SelectItem key={inst.value} value={inst.value}>{inst.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_value" className="required">סכום</Label>
                <Input id="current_value" name="current_value" type="number" value={formData.current_value} onChange={handleInputChange} placeholder="0" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="required">מטבע</Label>
                <Select value={formData.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
                  <SelectTrigger><SelectValue placeholder="בחר מטבע" /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="description">תיאור (אופציונלי)</Label>
                <Input id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder='למשל: עו"ש פרטי בנק לאומי' />
              </div>
            </>
          )}

          {/* --- Fields for CHILD SAVINGS (like Study Fund) --- */}
          {formData.asset_type_key === CHILD_SAVINGS_KEY && (
            <>
              <div className="space-y-2">
                <Label htmlFor="description" className="required">תיאור</Label>
                <Input id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="למשל: חיסכון לכל ילד - מנורה" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution" className="required">גוף מנהל</Label>
                <Select value={formData.institution} onValueChange={(value) => handleSelectChange('institution', value)}>
                  <SelectTrigger><SelectValue placeholder="בחר גוף מנהל" /></SelectTrigger>
                  <SelectContent>
                    {INSTITUTIONS.filter(i => ['menora', 'migdal', 'clal', 'harel', 'phoenix', 'altshuler', 'psagot', 'meitav', 'other_financial'].includes(i.value)).map(inst => (
                      <SelectItem key={inst.value} value={inst.value}>{inst.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fund_track_number" className="required">מספר מסלול השקעה</Label>
                <Input id="fund_track_number" name="fund_track_number" value={formData.fund_track_number} onChange={handleInputChange} placeholder="מספר מסלול" dir="ltr"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_value" className="required">יתרה צבורה</Label>
                  <Input id="current_value" name="current_value" type="number" value={formData.current_value} onChange={handleInputChange} placeholder="0" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="required">מטבע</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
                    <SelectTrigger><SelectValue placeholder="בחר מטבע" /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_deposit_amount">הפקדה חודשית (אם רלוונטי)</Label>
                  <Input id="monthly_deposit_amount" name="monthly_deposit_amount" type="number" value={formData.monthly_deposit_amount} onChange={handleInputChange} placeholder="0" dir="ltr" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="start_date">תאריך פתיחה</Label>
                    <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleInputChange} dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance_coverage_details">כיסוי ביטוחי (אם רלוונטי)</Label>
                <Textarea id="insurance_coverage_details" name="insurance_coverage_details" value={formData.insurance_coverage_details} onChange={handleInputChange} placeholder="פרטי כיסוי ביטוחי" />
              </div>
            </>
          )}
          
          {/* --- Fields for Fixed Deposits, Savings Plans, Other --- */}
          { (DEPOSIT_KEYS.includes(formData.asset_type_key) || formData.asset_type_key === 'other') && formData.asset_type_key !== CHILD_SAVINGS_KEY && formData.asset_type_key !== CHECKING_ACCOUNT_KEY && (
            <>
              <div className="space-y-2">
                <Label htmlFor="description" className="required">תיאור החיסכון</Label>
                <Input id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="תיאור או שם לזיהוי החיסכון" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution" className="required">מוסד פיננסי</Label>
                 <Select value={formData.institution} onValueChange={(value) => handleSelectChange('institution', value)}>
                  <SelectTrigger><SelectValue placeholder="בחר מוסד" /></SelectTrigger>
                  <SelectContent>
                    {INSTITUTIONS.filter(i => !['menora', 'migdal', 'clal', 'harel', 'phoenix', 'altshuler', 'psagot', 'meitav'].includes(i.value)).map(inst => ( // Filter out fund managers
                      <SelectItem key={inst.value} value={inst.value}>{inst.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest_type" className="required">סוג ריבית</Label>
                <Select value={formData.interest_type} onValueChange={(value) => handleSelectChange('interest_type', value)}>
                  <SelectTrigger><SelectValue placeholder="בחר סוג ריבית" /></SelectTrigger>
                  <SelectContent>{INTEREST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {formData.interest_type === 'variable' && (
                <>
                  <div className="space-y-2">
                    <Label className="required">הצמדה (ניתן לבחור כמה אפשרויות)</Label>
                    <div className="space-y-2">
                      {INDEXATION_TYPES.map(type => (
                        <div key={type.value} className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Checkbox id={`indexation_${type.value}`} checked={formData.indexation_types.includes(type.value)} onCheckedChange={(checked) => handleIndexationChange(type.value, checked)} />
                          <Label htmlFor={`indexation_${type.value}`} className="text-sm font-normal">{type.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  {formData.indexation_types.includes('other') && (
                    <div className="space-y-2">
                      <Label htmlFor="other_indexation_details" className="required">פרט הצמדה אחרת</Label>
                      <Input id="other_indexation_details" name="other_indexation_details" value={formData.other_indexation_details} onChange={handleInputChange} placeholder="תיאור ההצמדה" />
                    </div>
                  )}
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interest_rate">ריבית שנתית (%)</Label>
                  <Input id="interest_rate" name="interest_rate" type="number" value={formData.interest_rate} onChange={handleInputChange} placeholder="0.00" step="0.01" min="0" max="100" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_value" className="required">סכום נוכחי</Label>
                  <Input id="current_value" name="current_value" type="number" value={formData.current_value} onChange={handleInputChange} placeholder="0" dir="ltr" />
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="currency" className="required">מטבע</Label>
                <Select value={formData.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
                  <SelectTrigger><SelectValue placeholder="בחר מטבע" /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">תאריך פתיחה</Label>
                  <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleInputChange} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">תאריך סיום / פקיעה (אם אין תחנות יציאה)</Label>
                  <Input id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleInputChange} dir="ltr" disabled={!!formData.first_exit_station_date} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch id="is_locked" checked={formData.is_locked} onCheckedChange={(checked) => handleCheckboxChange('is_locked', checked)} />
                  <Label htmlFor="is_locked">החיסכון נעול עד תאריך מסוים</Label>
                </div>
                {formData.is_locked && (
                  <div className="space-y-2">
                    <Label htmlFor="lock_end_date">תאריך שחרור הנעילה</Label>
                    <Input id="lock_end_date" name="lock_end_date" type="date" value={formData.lock_end_date} onChange={handleInputChange} dir="ltr" />
                  </div>
                )}
              </div>
              {/* Exit Stations Fields */}
              <Card className="pt-4">
                <CardContent className="space-y-4">
                    <Label className="text-md font-semibold">תחנות יציאה מחזוריות (אופציונלי)</Label>
                    <div className="space-y-2">
                        <Label htmlFor="first_exit_station_date">תאריך תחנת יציאה ראשונה</Label>
                        <Input id="first_exit_station_date" name="first_exit_station_date" type="date" value={formData.first_exit_station_date} onChange={handleInputChange} dir="ltr" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="exit_station_interval_value">מרווח בין תחנות</Label>
                            <Input id="exit_station_interval_value" name="exit_station_interval_value" type="number" value={formData.exit_station_interval_value} onChange={handleInputChange} placeholder="למשל 30" dir="ltr"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="exit_station_interval_unit">יחידת זמן</Label>
                            <Select value={formData.exit_station_interval_unit} onValueChange={(value) => handleSelectChange('exit_station_interval_unit', value)}>
                                <SelectTrigger><SelectValue placeholder="בחר יחידת זמן" /></SelectTrigger>
                                <SelectContent>{EXIT_STATION_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                     {formData.first_exit_station_date && formData.exit_station_interval_value && (
                        <p className="text-sm text-muted-foreground">
                            תחנת יציאה ראשונה ב: {new Date(formData.first_exit_station_date).toLocaleDateString('he-IL') || '[תאריך]'}, 
                            ולאחר מכן כל {formData.exit_station_interval_value} {EXIT_STATION_UNITS.find(u=>u.value === formData.exit_station_interval_unit)?.label || '[יחידה]'}.
                        </p>
                    )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Common Fields for all types (except maybe checking) */}
          {formData.asset_type_key !== CHECKING_ACCOUNT_KEY && (
             <div className="flex items-center gap-2">
                <Switch id="update_method" checked={formData.update_method === 'automatic'} onCheckedChange={(checked) => handleCheckboxChange('update_method', checked ? 'automatic' : 'manual')} />
                <Label htmlFor="update_method">עדכון אוטומטי של ערך החיסכון</Label>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="הערות נוספות..." />
          </div>

          <style jsx global>{`.required:after { content: " *"; color: red; }`}</style>
          <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>ביטול</Button>
            <Button type="submit" disabled={loading}>{loading ? 'שומר...' : asset ? 'עדכן חיסכון' : 'הוסף חיסכון'}</Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
}
