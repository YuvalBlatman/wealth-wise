import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PencilIcon, CheckCircle } from 'lucide-react';

export default function DocumentPreviewForm({ extractedData, documentType, onSaveData, onEditManually, imageUrl }) {
  if (!extractedData) return null;

  const getProviderLabel = (providerId) => {
    const providers = {
      'menora': 'מנורה מבטחים',
      'migdal': 'מגדל',
      'harel': 'הראל',
      'clal': 'כלל',
      'phoenix': 'הפניקס',
      'altshuler': 'אלטשולר שחם',
      'psagot': 'פסגות',
      'meitav': 'מיטב דש'
    };
    return providers[providerId] || providerId;
  };

  const getAssetTypeLabel = (typeKey) => {
    const types = {
      'study_fund': 'קרן השתלמות',
      'new_pension': 'קרן פנסיה חדשה',
      'provident_fund': 'קופת גמל'
    };
    return types[typeKey] || typeKey;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>נתונים שזוהו מהמסמך</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>סוג מכשיר</Label>
            <div className="p-2 bg-muted rounded-md">
              {getAssetTypeLabel(extractedData.asset_type_key)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>חברה מנהלת</Label>
            <div className="p-2 bg-muted rounded-md">
              {getProviderLabel(extractedData.institution_name)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>מספר מסלול</Label>
            <div className="p-2 bg-muted rounded-md">
              {extractedData.fund_track_number}
            </div>
          </div>

          <div className="space-y-2">
            <Label>יתרה צבורה</Label>
            <div className="p-2 bg-muted rounded-md">
              ₪{extractedData.current_value?.toLocaleString()}
            </div>
          </div>

          {extractedData.description && (
            <div className="space-y-2">
              <Label>תיאור</Label>
              <div className="p-2 bg-muted rounded-md">
                {extractedData.description}
              </div>
            </div>
          )}
        </div>

        {imageUrl && (
          <div className="mt-4">
            <Label>תמונה מקורית</Label>
            <div className="mt-2 border rounded-lg overflow-hidden">
              <img src={imageUrl} alt="מסמך מקורי" className="w-full object-contain max-h-48" />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => onEditManually(extractedData)}>
          <PencilIcon className="h-4 w-4 mr-2" />
          ערוך ידנית
        </Button>
        <Button onClick={() => onSaveData(extractedData, documentType)}>
          <CheckCircle className="h-4 w-4 mr-2" />
          אשר והמשך
        </Button>
      </CardFooter>
    </Card>
  );
}