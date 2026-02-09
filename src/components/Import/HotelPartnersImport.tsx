import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUploadZone } from './FileUploadZone';
import { ImportPreview } from './ImportPreview';
import { ImportReport } from './ImportReport';
import { ProgressBar } from './ProgressBar';
import {
  parseCSV,
  parseJSON,
  importHotelPartners,
  type HotelPartnerImport,
  type ImportDiffSummary,
} from '../../utils/parseImportData';

export function HotelPartnersImport() {
  const { t } = useTranslation('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<HotelPartnerImport[]>([]);
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

      setParsedData(parsed as HotelPartnerImport[]);
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
      const importReport = await importHotelPartners(parsedData);
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
        <h2 className="text-2xl font-bold text-white mb-2">{t('hotelPartners.title')}</h2>
        <p className="text-gray-400 mb-4">{t('hotelPartners.description')}</p>

        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-2">
            {t('hotelPartners.requiredFields')}
          </h3>
          <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
            <li>
              <code className="text-teal-400">idbuspro_partner_hotel</code> - BusPro Hotel ID
            </li>
            <li>
              <code className="text-teal-400">name</code> - {t('hotelPartners.nameField')}
            </li>
            <li>
              <code className="text-teal-400">city</code> - {t('hotelPartners.cityField')}
            </li>
            <li>
              <code className="text-teal-400">address</code> - {t('hotelPartners.addressField')}{' '}
              ({t('hotelPartners.optional')})
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
            columns={['idbuspro_partner_hotel', 'name', 'city', 'address']}
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
        <ProgressBar progress={progress} message={t('progress.importingHotelPartners')} />
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
