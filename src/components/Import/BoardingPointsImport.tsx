import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUploadZone } from './FileUploadZone';
import { ImportPreview } from './ImportPreview';
import { ImportReport } from './ImportReport';
import { ProgressBar } from './ProgressBar';
import {
  parseCSV,
  parseJSON,
  importBoardingPoints,
  type BoardingPointImport,
  type ImportDiffSummary,
} from '../../utils/parseImportData';

export function BoardingPointsImport() {
  const { t } = useTranslation('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<BoardingPointImport[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<ImportDiffSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setParsedData([]);
    setReport(null);
    setError(null);

    try {
      const content = await file.text();
      let parsed: any[];

      if (file.name.endsWith('.json')) {
        parsed = parseJSON(content);
      } else if (file.name.endsWith('.csv')) {
        parsed = parseCSV(content);
      } else {
        throw new Error('Unsupported file type. Please upload CSV or JSON.');
      }

      setParsedData(parsed as BoardingPointImport[]);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setProgress(10);

    try {
      setProgress(30);
      const importReport = await importBoardingPoints(parsedData);
      setProgress(100);
      setReport(importReport);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedData([]);
    setReport(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('boardingPoints.title')}</h2>
        <p className="text-gray-400 mb-4">{t('boardingPoints.description')}</p>

        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-2">
            {t('boardingPoints.requiredFields')}
          </h3>
          <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
            <li>
              <code className="text-teal-400">idbuspro</code> - BusPro ID
            </li>
            <li>
              <code className="text-teal-400">city</code> - {t('boardingPoints.cityField')}
            </li>
            <li>
              <code className="text-teal-400">postal_code</code> -{' '}
              {t('boardingPoints.postalCodeField')}
            </li>
            <li>
              <code className="text-teal-400">address</code> -{' '}
              {t('boardingPoints.addressField')}
            </li>
            <li>
              <code className="text-teal-400">description</code> -{' '}
              {t('boardingPoints.descriptionField')} ({t('boardingPoints.optional')})
            </li>
            <li>
              <code className="text-teal-400">time</code> - {t('boardingPoints.timeField')} (
              {t('boardingPoints.optional')})
            </li>
          </ul>
        </div>
      </div>

      {!report && (
        <FileUploadZone
          onFileSelect={handleFileSelect}
          acceptedTypes={['.csv', '.json', 'text/csv', 'application/json']}
          selectedFile={selectedFile}
        />
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {parsedData.length > 0 && !importing && !report && (
        <div className="card space-y-4">
          <ImportPreview
            data={parsedData}
            columns={['idbuspro', 'city', 'postal_code', 'address', 'description', 'time']}
          />

          <div className="flex gap-3">
            <button onClick={handleImport} className="btn-primary">
              {t('actions.startImport')}
            </button>
            <button onClick={handleReset} className="btn-ghost">
              {t('actions.cancel')}
            </button>
          </div>
        </div>
      )}

      {importing && (
        <ProgressBar progress={progress} message={t('progress.importingBoardingPoints')} />
      )}

      {report && (
        <div className="space-y-4">
          <ImportReport report={report} type="master" />
          <button onClick={handleReset} className="btn-primary">
            {t('actions.importAnother')}
          </button>
        </div>
      )}
    </div>
  );
}
