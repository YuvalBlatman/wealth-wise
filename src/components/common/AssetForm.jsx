import React, { useState, useEffect } from 'react';
import { Asset } from '@/api/entities';
import { AssetType } from '@/api/entities';
import { getCategoryNameHebrew, formatDate } from '@/components/utils/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, X } from 'lucide-react';

const CURRENCIES = [
  { value: 'ILS', label: '₪ שקל' },
  { value: 'USD', label: '$ דולר' },
  { value: 'EUR', label: '€ אירו' },
  { value: 'GBP', label: '£ ליש"ט' }
];

export default function AssetForm({ 
  asset, 
  category,
  onSave, 
  onCancel, 
  onClose 
}) {
  const [formData, setFormData] = useState({
    category: category || asset?.category || 'real_estate',
    type: asset?.type || '',
    description: asset?.description || '',
    value: asset?.value || '',
    currency: asset?.currency || 'ILS',
    symbol: asset?.symbol || '',
    quantity: asset?.quantity || '',
    update_method: asset?.update_method || 'manual',
    address: asset?.address || '',
    size: asset?.size || '',
    valuation_source: asset?.valuation_source || '',
    provider: asset?.provider || '',
    bank_name: asset?.bank_name || '',
    account_type: asset?.account_type || ''
  });

  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Load asset types for the selected category
  useEffect(() => {
    const loadAssetTypes = async () => {
      setLoading(true);
      try {
        const types = await AssetType.filter({ category: formData.category });
        setAssetTypes(types);
        
        // Set default type if available
        if (types.length > 0 && !formData.type) {
          setFormData(prev => ({
            ...prev,
            type: types[0].name
          }));
        }
      } catch (error) {
        console.error('Error loading asset types:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAssetTypes();
  }, [formData.category]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : parseFloat(value);
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ 
      ...prev, 
      [name]: checked ? 'automatic' : 'manual' 
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Format the data for submission
      const assetData = {
        ...formData,
        last_updated: new Date().toISOString()
      };
      
      let result;
      
      if (asset?.id) {
        result = await Asset.update(asset.id, assetData);
      } else {
        result = await Asset.create(assetData);
      }
      
      if (onSave) onSave(result);
      if (onClose) onClose();
      
    } catch (error) {
      console.error('Error saving asset:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Get the current asset type object
  const currentType = assetTypes.find(t => t.name === formData.type);

  // Get form fields based on asset type
  const getFormFields = () => {
    // Common fields for all asset types
    const commonFields = (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="description">תיאור הנכס *</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="שם הנכס או תיאור קצר"
              required
              dir="rtl"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">סוג נכס *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleSelectChange('type', value)}
              disabled={loading || assetTypes.length === 0}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="בחר סוג נכס" />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.name_he}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="value">ערך נוכחי *</Label>
            <Input
              id="value"
              name="value"
              type="number"
              value={formData.value}
              onChange={handleNumberChange}
              placeholder="0"
              required
              dir="ltr"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">מטבע *</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => handleSelectChange('currency', value)}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="מטבע" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
          <Switch
            id="update_method"
            checked={formData.update_method === 'automatic'}
            onCheckedChange={(checked) => handleSwitchChange('update_method', checked)}
          />
          <Label htmlFor="update_method" className="mr-2">עדכון אוטומטי של שווי</Label>
        </div>
      </div>
    );
    
    // Fields specific to the asset category
    let specificFields = null;
    
    switch (formData.category) {
      case 'real_estate':
        specificFields = (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">כתובת</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="הכנס את כתובת הנכס"
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">שטח (מ"ר)</Label>
                <Input
                  id="size"
                  name="size"
                  type="number"
                  value={formData.size}
                  onChange={handleNumberChange}
                  placeholder="0"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valuation_source">מקור הערכה</Label>
                <Select
                  value={formData.valuation_source}
                  onValueChange={(value) => handleSelectChange('valuation_source', value)}
                >
                  <SelectTrigger id="valuation_source">
                    <SelectValue placeholder="בחר מקור" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="madlan">מדלן</SelectItem>
                    <SelectItem value="yad2">יד 2</SelectItem>
                    <SelectItem value="appraiser">שמאי</SelectItem>
                    <SelectItem value="personal">הערכה אישית</SelectItem>
                    <SelectItem value="purchase_price">מחיר רכישה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
        break;
        
      case 'financial':
        specificFields = (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">סימול</Label>
                <Input
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="לדוגמה: AAPL"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">כמות</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleNumberChange}
                  placeholder="0"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        );
        break;
        
      case 'savings':
        specificFields = (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">שם הבנק</Label>
                <Select
                  value={formData.bank_name}
                  onValueChange={(value) => handleSelectChange('bank_name', value)}
                >
                  <SelectTrigger id="bank_name">
                    <SelectValue placeholder="בחר בנק" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leumi">בנק לאומי</SelectItem>
                    <SelectItem value="poalim">בנק הפועלים</SelectItem>
                    <SelectItem value="discount">בנק דיסקונט</SelectItem>
                    <SelectItem value="mizrahi">בנק מזרחי-טפחות</SelectItem>
                    <SelectItem value="fibi">הבנק הבינלאומי</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_type">סוג חשבון</Label>
                <Select
                  value={formData.account_type}
                  onValueChange={(value) => handleSelectChange('account_type', value)}
                >
                  <SelectTrigger id="account_type">
                    <SelectValue placeholder="בחר סוג" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">חשבון עו״ש</SelectItem>
                    <SelectItem value="savings">חיסכון</SelectItem>
                    <SelectItem value="deposit">פיקדון</SelectItem>
                    <SelectItem value="makam">מק״מ</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
        break;
        
      case 'pension':
        specificFields = (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">חברה מנהלת</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => handleSelectChange('provider', value)}
                >
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="בחר חברה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="menora">מנורה מבטחים</SelectItem>
                    <SelectItem value="migdal">מגדל</SelectItem>
                    <SelectItem value="clal">כלל</SelectItem>
                    <SelectItem value="harel">הראל</SelectItem>
                    <SelectItem value="phoenix">הפניקס</SelectItem>
                    <SelectItem value="altshuler">אלטשולר שחם</SelectItem>
                    <SelectItem value="more">מור</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
        break;
        
      case 'alternative':
        specificFields = (
          <div className="space-y-4">
            {formData.type === 'crypto' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">סימול מטבע</Label>
                  <Input
                    id="symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="לדוגמה: BTC"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">כמות</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleNumberChange}
                    placeholder="0"
                    dir="ltr"
                  />
                </div>
              </div>
            )}
          </div>
        );
        break;
        
      default:
        specificFields = null;
    }
    
    return (
      <>
        {commonFields}
        {specificFields && (
          <div className="pt-4 mt-4 border-t">
            {specificFields}
          </div>
        )}
      </>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="pt-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {asset ? 'עריכת נכס' : `הוספת נכס חדש - ${getCategoryNameHebrew(formData.category)}`}
          </h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {getFormFields()}
              
              <div className="flex justify-end gap-3 pt-4">
                {onCancel && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={saving}
                  >
                    ביטול
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      שומר...
                    </>
                  ) : (
                    <>
                      <Save className="ml-2 h-4 w-4" />
                      {asset ? 'שמור שינויים' : 'הוסף נכס'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}