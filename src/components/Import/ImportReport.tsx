import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { ImportReport as ImportReportType } from '../../utils/parseBusProXML';
import type { ImportDiffSummary } from '../../utils/parseImportData';

interface ImportReportProps {
  report: ImportReportType | ImportDiffSummary | null;
  type: 'buspro' | 'master';
}

export function ImportReport({ report, type }: ImportReportProps) {
  const { t } = useTranslation('import');

  if (!report) return null;

  const isBusProReport = (r: any): r is ImportReportType => 'success' in r;
  const isMasterReport = (r: any): r is ImportDiffSummary => 'newRecords' in r;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        {isBusProReport(report) && report.success ? (
          <>
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">{t('report.successTitle')}</h3>
          </>
        ) : (
          <>
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">{t('report.completedTitle')}</h3>
          </>
        )}
      </div>

      {isBusProReport(report) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t('report.trips')} value={report.counts.trips} />
          <StatCard label={t('report.departures')} value={report.counts.departures} />
          <StatCard label={t('report.transports')} value={report.counts.transports} />
          <StatCard label={t('report.accommodations')} value={report.counts.accommodations} />
          <StatCard label={t('report.extras')} value={report.counts.extras} />
          <StatCard label={t('report.boardingPoints')} value={report.counts.boardingPoints} />
          <StatCard
            label={t('report.earlyBirdDiscounts')}
            value={report.counts.earlyBirdDiscounts}
          />
        </div>
      )}

      {isMasterReport(report) && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label={t('report.newRecords')} value={report.newRecords} color="green" />
          <StatCard label={t('report.updatedRecords')} value={report.updatedRecords} color="blue" />
          <StatCard
            label={t('report.unchangedRecords')}
            value={report.unchangedRecords}
            color="gray"
          />
        </div>
      )}

      {isBusProReport(report) && report.unresolvedReferences && (
        <>
          {report.unresolvedReferences.boardingPoints.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h4 className="font-semibold text-yellow-300">
                  {t('report.unresolvedBoardingPoints')}
                </h4>
              </div>
              <p className="text-sm text-gray-300 mb-2">
                {t('report.placeholdersCreated', {
                  count: report.unresolvedReferences.boardingPoints.length,
                })}
              </p>
              <div className="max-h-32 overflow-y-auto">
                <ul className="text-xs text-gray-400 list-disc list-inside">
                  {report.unresolvedReferences.boardingPoints.map((bp, idx) => (
                    <li key={idx}>{bp}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {report.unresolvedReferences.hotels.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h4 className="font-semibold text-yellow-300">{t('report.unresolvedHotels')}</h4>
              </div>
              <p className="text-sm text-gray-300 mb-2">
                {t('report.placeholdersCreated', {
                  count: report.unresolvedReferences.hotels.length,
                })}
              </p>
              <div className="max-h-32 overflow-y-auto">
                <ul className="text-xs text-gray-400 list-disc list-inside">
                  {report.unresolvedReferences.hotels.map((hotel, idx) => (
                    <li key={idx}>{hotel}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {report.warnings && report.warnings.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-yellow-400" />
            <h4 className="font-semibold text-yellow-300">{t('report.warnings')}</h4>
          </div>
          <div className="max-h-32 overflow-y-auto">
            <ul className="text-xs text-gray-300 list-disc list-inside">
              {report.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {report.errors && report.errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h4 className="font-semibold text-red-300">{t('report.errors')}</h4>
          </div>
          <div className="max-h-32 overflow-y-auto">
            <ul className="text-xs text-gray-300 list-disc list-inside">
              {report.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color?: 'green' | 'blue' | 'gray' | 'default';
}

function StatCard({ label, value, color = 'default' }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-900/20 border-green-600',
    blue: 'bg-blue-900/20 border-blue-600',
    gray: 'bg-gray-700 border-gray-600',
    default: 'bg-gray-700 border-gray-600',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-300">{label}</p>
    </div>
  );
}
