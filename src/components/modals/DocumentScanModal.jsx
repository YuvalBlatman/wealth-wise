import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Scan } from 'lucide-react';

import DocumentUploader from '../ocr/DocumentUploader';
import DocumentPreviewForm from '../ocr/DocumentPreviewForm';

export default function DocumentScanModal({ 
  open, 
  onOpenChange, 
  onSaveData, 
  documentType = 'auto',
  onEditManually
}) {
  const [scanStep, setScanStep] = useState('upload'); // 'upload', 'preview'
  const [extractedData, setExtractedData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  
  const handleExtractedData = (data, detectedType, fileUrl) => {
    setExtractedData(data);
    setImageUrl(fileUrl);
    setScanStep('preview');
  };
  
  const handleSaveData = (formData, formType) => {
    onSaveData(formData, formType);
    setScanStep('upload');
    setExtractedData(null);
    setImageUrl(null);
    onOpenChange(false);
  };
  
  const handleManualEdit = () => {
    onEditManually(extractedData || {});
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        // Reset state when closing
        setScanStep('upload');
        setExtractedData(null);
        setImageUrl(null);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" dir="rtl">
            <Scan className="h-5 w-5" />
            <span>סריקת דו״ח פיננסי</span>
          </DialogTitle>
          <DialogDescription dir="rtl">
            {scanStep === 'upload' 
              ? 'העלה צילום מסך של דו״ח פיננסי כדי למלא את הטופס אוטומטית'
              : 'בדוק את הנתונים שזוהו ואשר אותם'}
          </DialogDescription>
        </DialogHeader>

        {scanStep === 'upload' ? (
          <DocumentUploader 
            onExtractedData={handleExtractedData}
            documentType={documentType}
          />
        ) : (
          <DocumentPreviewForm 
            extractedData={extractedData}
            documentType={documentType}
            onSaveData={handleSaveData}
            onEditManually={handleManualEdit}
            imageUrl={imageUrl}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}