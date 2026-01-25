import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { uploadFile, validateFile } from '../../services/fileUpload';
import { summarizeMedicalRecord } from '../../services/llmService';
import { queueRequest } from '../../services/aiQueue';
import { useOffline } from '../../hooks/useOffline';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../shared/Button';
import Card from '../shared/Card';
import AIIndicator from '../shared/AIIndicator';
import Disclaimer from '../shared/Disclaimer';

export default function HealthUploadScreen() {
  const navigate = useNavigate();
  const { addRecord } = useMedicalRecords();
  const { updateDataSharingConsent } = useUserPreferences();
  const isOffline = useOffline();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    content: string;
    fileType: string;
    filename: string;
    arrayBuffer: ArrayBuffer;
    fileSize: number;
  } | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || t('health.invalidFile'));
      return;
    }

    setError(null);
    setUploading(true);
    setOcrProcessing(false);
    setOcrProgress(0);

    try {
      // Upload and extract content (with OCR progress tracking for images)
      const uploadResult = await uploadFile(file, progress => {
        if (
          progress.status === 'recognizing text' ||
          progress.status === 'loading tesseract core'
        ) {
          setOcrProcessing(true);
          setOcrProgress(progress.progress);
        }
      });

      // OCR processing complete
      setOcrProcessing(false);
      setUploading(false);

      // Store upload result for preview and save
      setUploadResult({
        content: uploadResult.content,
        fileType: uploadResult.fileType,
        filename: uploadResult.filename,
        arrayBuffer: uploadResult.arrayBuffer,
        fileSize: uploadResult.fileSize,
      });

      // Auto-consent to AI processing when user uploads a file
      // This is implicit consent - user action indicates they want AI processing
      try {
        await updateDataSharingConsent(true);
      } catch (err) {
        // Non-critical error, continue with processing
        console.warn('Failed to update consent:', err);
      }

      // Process with AI (don't save yet, wait for user to click save)
      if (!isOffline) {
        setProcessing(true);
        try {
          const summary = await summarizeMedicalRecord({
            content: uploadResult.content,
            fileType: uploadResult.fileType,
            metadata: {
              filename: uploadResult.filename,
              uploadDate: new Date().toISOString(),
            },
          });

          // Ensure we have proper structure - extract fields correctly
          console.log('Summary received:', summary);

          // Handle case where summary might be a string (raw response) or object
          let parsedSummary: any = summary;
          if (typeof summary === 'string') {
            try {
              parsedSummary = JSON.parse(summary);
            } catch {
              // If parsing fails, treat as observations only
              parsedSummary = {
                observations: summary,
                possibleCauses: [],
                suggestions: [],
                whenToSeekHelp: '',
                disclaimer: '',
                processingTimestamp: new Date().toISOString(),
              };
            }
          }

          // Validate and set AI analysis with proper structure
          // Ensure each field is properly extracted
          const analysisData: {
            observations: string;
            possibleCauses: string[];
            suggestions: string[];
            whenToSeekHelp: string;
            disclaimer: string;
          } = {
            observations: (parsedSummary.observations || '').toString(),
            possibleCauses: Array.isArray(parsedSummary.possibleCauses)
              ? parsedSummary.possibleCauses.map((c: any) => String(c))
              : [],
            suggestions: Array.isArray(parsedSummary.suggestions)
              ? parsedSummary.suggestions.map((s: any) => String(s))
              : [],
            whenToSeekHelp: (parsedSummary.whenToSeekHelp || '').toString(),
            disclaimer: (parsedSummary.disclaimer || '').toString(),
          };

          console.log('Setting AI analysis:', analysisData);
          setAiAnalysis(analysisData);
          setProcessing(false);
        } catch (aiError: any) {
          setError(aiError.message || t('health.failedToProcess'));
          setProcessing(false);
        }
      } else {
        setError(t('health.upload.offline'));
      }
    } catch (err: any) {
      setError(err.message || t('health.failedToUpload'));
      setUploading(false);
      setOcrProcessing(false);
      setUploadResult(null);
      setAiAnalysis(null);
    }
  };

  const handleSave = async () => {
    if (!uploadResult) return;

    try {
      setError(null);

      // Create medical record
      const now = new Date().toISOString();
      const record = await addRecord({
        filename: uploadResult.filename,
        fileType: uploadResult.fileType as 'text' | 'image' | 'pdf',
        uploadDate: now,
        fileContent: uploadResult.arrayBuffer,
        fileSize: uploadResult.fileSize,
        aiSummary: aiAnalysis ? aiAnalysis.observations : null,
        aiAnalysis: aiAnalysis
          ? {
              observations: aiAnalysis.observations,
              possibleCauses: aiAnalysis.possibleCauses,
              suggestions: aiAnalysis.suggestions,
              whenToSeekHelp: aiAnalysis.whenToSeekHelp,
              disclaimer: aiAnalysis.disclaimer,
            }
          : null,
        processingStatus: aiAnalysis ? 'completed' : 'pending',
        errorMessage: null,
      });

      // If offline and no AI analysis, queue for later processing
      if (isOffline && !aiAnalysis) {
        queueRequest('medical-record', {
          recordId: record.id,
          content: uploadResult.content,
          fileType: uploadResult.fileType,
        });
      }

      // Navigate to summary page
      navigate(`/health/summary/${record.id}`);
    } catch (err: any) {
      setError(err.message || t('health.failedToUpload'));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('health.upload.title')}</h1>

      <Card className="mb-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || processing}
          />
          <div className="space-y-4">
            <div className="text-4xl">📋</div>
            <div>
              <p className="text-gray-700 font-medium mb-1">
                {uploading ? t('health.upload.uploading') : t('health.upload.clickOrDrag')}
              </p>
              <p className="text-sm text-gray-500">{t('health.upload.supports')}</p>
            </div>
          </div>
        </div>
      </Card>

      {ocrProcessing && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900 mb-1">{t('health.upload.ocrProcessing')}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{ocrProgress}%</p>
            </div>
          </div>
        </Card>
      )}

      {processing && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 mb-1">{t('health.upload.processing')}</p>
              <p className="text-sm text-gray-600">{t('health.upload.processingNote')}</p>
            </div>
            <AIIndicator status="processing" />
          </div>
        </Card>
      )}

      {/* Show full AI analysis if available - each field in separate card */}
      {aiAnalysis && !processing && typeof aiAnalysis === 'object' && aiAnalysis !== null && (
        <>
          {/* Observations Card - Always show if exists */}
          {aiAnalysis.observations && (
            <Card className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <AIIndicator status="completed" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('health.symptoms.observations')}
                </h2>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{String(aiAnalysis.observations)}</p>
            </Card>
          )}

          {/* Possible Causes Card - Only show if array exists and has items */}
          {Array.isArray(aiAnalysis.possibleCauses) && aiAnalysis.possibleCauses.length > 0 && (
            <Card className="mb-4 border-blue-100">
              <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span>💡</span> {t('health.symptoms.possibleCauses')}
              </h2>
              <ul className="space-y-2">
                {aiAnalysis.possibleCauses.map((cause: any, index: number) => (
                  <li key={index} className="text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{String(cause)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Suggestions Card - Only show if array exists and has items */}
          {Array.isArray(aiAnalysis.suggestions) && aiAnalysis.suggestions.length > 0 && (
            <Card className="mb-4 border-green-100">
              <h2 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                <span>✅</span> {t('health.symptoms.suggestions')}
              </h2>
              <ul className="space-y-2">
                {aiAnalysis.suggestions.map((suggestion: any, index: number) => (
                  <li key={index} className="text-gray-700 flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>{String(suggestion)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* When to Seek Help Card */}
          {aiAnalysis.whenToSeekHelp && (
            <Card className="mb-4 border-orange-100">
              <h2 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <span>💊</span> {t('health.symptoms.whenToSeekHelp')}
              </h2>
              <p className="text-gray-700">{String(aiAnalysis.whenToSeekHelp)}</p>
            </Card>
          )}

          {/* Disclaimer Card */}
          {aiAnalysis.disclaimer && (
            <Card className="mb-6 border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600 italic">{String(aiAnalysis.disclaimer)}</p>
            </Card>
          )}
        </>
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm">{error}</p>
        </Card>
      )}

      {isOffline && !uploadResult && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <p className="text-yellow-800 text-sm">{t('health.upload.offline')}</p>
        </Card>
      )}

      <Disclaimer type="medical" className="mb-6" />

      <div className="flex gap-3">
        <Button
          variant="outline"
          fullWidth
          onClick={() => {
            // Reset state when going back
            setUploadResult(null);
            setAiAnalysis(null);
            setError(null);
            navigate('/health');
          }}
        >
          {t('common.back')}
        </Button>
        {uploadResult && (
          <Button variant="primary" fullWidth onClick={handleSave} disabled={processing}>
            {t('common.save')}
          </Button>
        )}
      </div>
    </div>
  );
}
