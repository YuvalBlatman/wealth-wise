import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, FileUp, Image as ImageIcon, Loader2 } from 'lucide-react';
import { UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations';

export default function DocumentUploader({ onExtractedData, documentType = 'pension' }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('נא להעלות קובץ תמונה בלבד (JPG, PNG)');
      return;
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('גודל הקובץ המקסימלי הוא 5MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const getExtractionSchema = () => {
    return {
      type: "object",
      properties: {
        asset_type_key: {
          type: "string",
          description: "זיהוי סוג המכשיר הפיננסי. אם מופיע 'השתלמות' או 'קרן השתלמות' - להחזיר 'study_fund'. אם מופיע 'פנסיה' - להחזיר 'new_pension'. אם מופיע 'גמל' - להחזיר 'provident_fund'."
        },
        description: {
          type: "string",
          description: "שם מלא של המכשיר הפיננסי כפי שמופיע בתמונה"
        },
        institution_name: {
          type: "string",
          description: "שם החברה המנהלת. אם מופיע 'מנורה' - להחזיר 'menora'. אם מופיע 'מגדל' - להחזיר 'migdal'. אם מופיע 'הראל' - להחזיר 'harel'. אם מופיע 'כלל' - להחזיר 'clal'. אם מופיע 'הפניקס' - להחזיר 'phoenix'. אם מופיע 'אלטשולר' - להחזיר 'altshuler'. אם מופיע 'פסגות' - להחזיר 'psagot'. אם מופיע 'מיטב' - להחזיר 'meitav'."
        },
        fund_track_number: {
          type: "string",
          description: "מספר מסלול ההשקעה - מספר בן 4-9 ספרות"
        },
        current_value: {
          type: "number",
          description: "היתרה הצבורה בשקלים - להמיר למספר ולהסיר פסיקים ו-₪"
        }
      },
      required: ["asset_type_key", "institution_name", "fund_track_number", "current_value"]
    };
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Upload the file
      const { file_url } = await UploadFile({ file });
      
      setProcessing(true);
      
      // Extract data using OCR
      const extractionResult = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: getExtractionSchema()
      });

      if (extractionResult.status === 'error') {
        throw new Error(extractionResult.details || 'שגיאה בזיהוי הנתונים מהתמונה');
      }

      const extractedData = extractionResult.output;
      
      if (!extractedData || Object.keys(extractedData).length === 0) {
        throw new Error('לא זוהו נתונים בתמונה. נא לנסות תמונה אחרת או למלא ידנית');
      }

      onExtractedData(extractedData);

    } catch (err) {
      setError(err.message || 'אירעה שגיאה בעיבוד התמונה');
      console.error('Error processing document:', err);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {preview ? (
                  <img src={preview} alt="תצוגה מקדימה" className="max-h-48 object-contain" />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">לחץ להעלאת תמונה</span> או גרור לכאן
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG (מקסימום 5MB)
                    </p>
                  </>
                )}
              </div>
              <Input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {file && (
            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={uploading || processing}
                className="w-full"
              >
                {(uploading || processing) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {uploading ? 'מעלה תמונה...' : processing ? 'מזהה נתונים...' : 'זהה נתונים'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}