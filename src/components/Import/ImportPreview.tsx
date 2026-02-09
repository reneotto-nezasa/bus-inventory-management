import { useTranslation } from 'react-i18next';

interface ImportPreviewProps {
  data: any[];
  columns: string[];
  maxRows?: number;
}

export function ImportPreview({ data, columns, maxRows = 10 }: ImportPreviewProps) {
  const { t } = useTranslation('import');

  const displayData = data.slice(0, maxRows);
  const hasMore = data.length > maxRows;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{t('preview.title')}</h3>
        <span className="badge-info">
          {data.length} {t('preview.records')}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700">
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-left text-white font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, idx) => (
              <tr key={idx} className="border-t border-gray-700 hover:bg-gray-700">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 text-gray-300">
                    {row[col] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <p className="text-sm text-gray-400 text-center">
          {t('preview.showingFirst', { count: maxRows })}
        </p>
      )}
    </div>
  );
}
