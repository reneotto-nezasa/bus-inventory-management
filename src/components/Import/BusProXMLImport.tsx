import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUploadZone } from './FileUploadZone';
import { ImportReport } from './ImportReport';
import { ProgressBar } from './ProgressBar';
import { parseBusProXML, importBusProData } from '../../utils/parseBusProXML';
import type { ParsedBusProData, ImportReport as ImportReportType } from '../../utils/parseBusProXML';

export function BusProXMLImport() {
  const { t } = useTranslation('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedBusProData | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<ImportReportType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setParsedData(null);
    setReport(null);
    setError(null);

    try {
      const content = await file.text();
      const parsed = parseBusProXML(content);
      setParsedData(parsed);
    } catch (err: any) {
      setError(err.message || 'Failed to parse XML file');
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    setProgress(10);

    try {
      setProgress(30);
      const importReport = await importBusProData(parsedData);
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
    setParsedData(null);
    setReport(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('busproXML.title')}</h2>
        <p className="text-gray-400">{t('busproXML.description')}</p>
      </div>

      {!report && (
        <FileUploadZone
          onFileSelect={handleFileSelect}
          acceptedTypes={['.xml', 'text/xml', 'application/xml']}
          selectedFile={selectedFile}
        />
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {parsedData && !importing && !report && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-white">{t('busproXML.previewTitle')}</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreviewStatCard label={t('report.trips')} value={parsedData.trips.length} />
            <PreviewStatCard label={t('report.departures')} value={parsedData.departures.length} />
            <PreviewStatCard
              label={t('report.transports')}
              value={parsedData.transports.length}
            />
            <PreviewStatCard
              label={t('report.accommodations')}
              value={
                parsedData.accommodations.length + parsedData.compositeAccommodations.length
              }
            />
            <PreviewStatCard label={t('report.extras')} value={parsedData.extras.length} />
            <PreviewStatCard
              label={t('report.earlyBirdDiscounts')}
              value={parsedData.earlyBirdDiscounts.length}
            />
            <PreviewStatCard
              label={t('busproXML.unresolvedBoardingPoints')}
              value={parsedData.unresolvedBoardingPoints.size}
              warning={parsedData.unresolvedBoardingPoints.size > 0}
            />
            <PreviewStatCard
              label={t('busproXML.unresolvedHotels')}
              value={parsedData.unresolvedHotels.size}
              warning={parsedData.unresolvedHotels.size > 0}
            />
          </div>

          {(parsedData.unresolvedBoardingPoints.size > 0 ||
            parsedData.unresolvedHotels.size > 0) && (
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
              <p className="text-sm text-yellow-300">{t('busproXML.placeholderWarning')}</p>
            </div>
          )}

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

      {importing && <ProgressBar progress={progress} message={t('progress.importingBusPro')} />}

      {report && (
        <div className="space-y-4">
          <ImportReport report={report} type="buspro" />
          <button onClick={handleReset} className="btn-primary">
            {t('actions.importAnother')}
          </button>
        </div>
      )}
    </div>
  );
}

interface PreviewStatCardProps {
  label: string;
  value: number;
  warning?: boolean;
}

function PreviewStatCard({ label, value, warning }: PreviewStatCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 ${
        warning ? 'bg-yellow-900/20 border-yellow-600' : 'bg-gray-700 border-gray-600'
      }`}
    >
      <p className={`text-2xl font-bold ${warning ? 'text-yellow-300' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-sm text-gray-300">{label}</p>
    </div>
  );
}
