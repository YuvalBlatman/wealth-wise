import React, { useState, useEffect } from 'react';
import { EconomicDataPoint } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, TrendingUp, Percent, Home, DollarSign, Euro, Banknote, Edit3, AlertCircle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { he } from 'date-fns/locale';

const INDICATOR_DETAILS = {
  israel_interest_rate: { title: 'ריבית בנק ישראל', Icon: Percent, unit: '%', editable: false },
  consumer_price_index: { title: 'מדד המחירים לצרכן', Icon: TrendingUp, unit: '%', editable: false },
  usd_ils_exchange_rate: { title: 'שער דולר / שקל', Icon: DollarSign, unit: '₪', editable: true, dataKey: 'current_value' },
  eur_ils_exchange_rate: { title: 'שער אירו / שקל', Icon: Euro, unit: '₪', editable: true, dataKey: 'current_value' },
  construction_input_index: { title: 'מדד תשומות הבנייה', Icon: Home, unit: '%', editable: false },
  housing_price_index: { title: 'מדד מחירי הדיור', Icon: Home, unit: '%', editable: false },
};

const EditDataPointDialog = ({ open, onOpenChange, dataPoint, onSave, indicatorDetails }) => {
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (dataPoint && indicatorDetails?.dataKey) {
      setValue(dataPoint.data[indicatorDetails.dataKey]?.toString() || '');
      setDate(dataPoint.last_updated || new Date().toISOString().split('T')[0]);
    }
  }, [dataPoint, indicatorDetails]);

  const handleSave = async () => {
    setError('');
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      setError('ערך השער חייב להיות מספר חיובי.');
      return;
    }
    if (!date || !isValid(parseISO(date))) {
      setError('תאריך העדכון אינו תקין.');
      return;
    }

    setLoading(true);
    try {
      const updatedData = { ...dataPoint.data };
      if(indicatorDetails?.dataKey) {
        updatedData[indicatorDetails.dataKey] = Number(value);
      }
      
      await EconomicDataPoint.update(dataPoint.id, {
        data: updatedData,
        last_updated: date,
      });
      onSave(); // Triggers refetch in parent
      onOpenChange(false); // Close dialog
    } catch (err) {
      console.error("Error updating data point:", err);
      setError('שגיאה בעדכון הנתון. אנא נסה שנית.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!dataPoint || !indicatorDetails) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת {indicatorDetails.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="valueEdit">ערך השער ({indicatorDetails.unit})</Label>
            <Input
              id="valueEdit"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="הזן ערך"
              step="any"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateEdit">תאריך עדכון</Label>
            <Input
              id="dateEdit"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              dir="ltr"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">ביטול</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            שמור שינויים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const DataCard = ({ dataPoint, onEdit }) => {
  const details = INDICATOR_DETAILS[dataPoint.indicator_type] || { title: dataPoint.indicator_type, Icon: Banknote, editable: false };
  const displayUnit = details.unit || '';

  const renderDataFields = () => {
    if (!dataPoint.data) return <p className="text-sm text-muted-foreground">אין נתונים זמינים.</p>;
    
    return Object.entries(dataPoint.data).map(([key, value]) => {
      let displayKey = key;
      let displayValue = value;

      if (key === 'current_value') displayKey = 'ערך נוכחי';
      if (key === 'monthly_change_percent') displayKey = 'שינוי חודשי';
      if (key === 'yearly_change_percent') displayKey = 'שינוי שנתי';
      if (key === 'base_index_value') displayKey = 'ערך מדד בסיס';
      if (key === 'current_index_value') displayKey = 'ערך מדד נוכחי';
      
      if (typeof value === 'number') {
        displayValue = `${value.toLocaleString('he-IL', { maximumFractionDigits: indicator_typeAllowsManyDigits(dataPoint.indicator_type, key) ? 4 : 2 })}${ (dataPoint.indicator_type !== 'usd_ils_exchange_rate' && dataPoint.indicator_type !== 'eur_ils_exchange_rate' && key !== 'base_index_value' && key !== 'current_index_value' && displayUnit) ? displayUnit : ''}`;
      }
      
      return (
        <div key={key} className="flex justify-between text-sm">
          <span className="text-muted-foreground capitalize">{displayKey.replace(/_/g, ' ')}:</span>
          <span className="font-medium">{displayValue}</span>
        </div>
      );
    });
  };
  
  // Helper to decide if more digits are needed for display
  const indicator_typeAllowsManyDigits = (indicatorType, key) => {
      if ((indicatorType === 'usd_ils_exchange_rate' || indicatorType === 'eur_ils_exchange_rate') && key === 'current_value') {
          return true;
      }
      return false;
  }


  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center text-lg">
            <details.Icon className="w-5 h-5 ml-2 text-primary" />
            {details.title}
          </CardTitle>
          {dataPoint.source && <CardDescription className="text-xs mt-1">מקור: {dataPoint.source}</CardDescription>}
        </div>
        {details.editable && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(dataPoint)}>
            <Edit3 className="w-4 h-4" />
            <span className="sr-only">ערוך</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {renderDataFields()}
        <p className="text-xs text-muted-foreground pt-2">
          עודכן לאחרונה: {dataPoint.last_updated ? format(parseISO(dataPoint.last_updated), 'dd/MM/yyyy', { locale: he }) : 'לא ידוע'}
        </p>
      </CardContent>
    </Card>
  );
};

export default function EconomicDataPage() {
  const [economicData, setEconomicData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDataPoint, setEditingDataPoint] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await EconomicDataPoint.list(); // Assuming .list() fetches all fields including id
      const order = Object.keys(INDICATOR_DETAILS);
      data.sort((a, b) => order.indexOf(a.indicator_type) - order.indexOf(b.indicator_type));
      setEconomicData(data);
    } catch (error) {
      console.error("Error fetching economic data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (dataPoint) => {
    setEditingDataPoint(dataPoint);
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    fetchData(); // Refetch data after save
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">נתונים כלכליים מרכזיים</h2>
        <p className="text-muted-foreground">
          סקירה של מדדים כלכליים עדכניים המשפיעים על ניהול הנכסים וההשקעות. ניתן לערוך שערי מט"ח לצורך בניית תחזיות.
        </p>
      </div>

      {economicData.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">לא נמצאו נתונים כלכליים.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {economicData.map((dataPoint) => (
          <DataCard key={dataPoint.id || dataPoint.indicator_type} dataPoint={dataPoint} onEdit={handleEdit} />
        ))}
      </div>

      {editingDataPoint && (
        <EditDataPointDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          dataPoint={editingDataPoint}
          onSave={handleSave}
          indicatorDetails={INDICATOR_DETAILS[editingDataPoint.indicator_type]}
        />
      )}
    </div>
  );
}