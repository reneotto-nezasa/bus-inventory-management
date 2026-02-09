import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, DollarSign } from 'lucide-react';
import type { BoardingPoint, TransferCostCategory } from '../../types';
import { useBoardingPoints } from '../../hooks';

interface SurchargeManagementPanelProps {
  boardingPoints: BoardingPoint[];
  transferCostCategories: TransferCostCategory[];
  onClose: () => void;
}

export function SurchargeManagementPanel({
  boardingPoints,
  transferCostCategories,
  onClose,
}: SurchargeManagementPanelProps) {
  const { t } = useTranslation('trips');
  const { createOrUpdateBoardingPointSurcharge, refetch } = useBoardingPoints();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    transferCostCategories[0]?.id || ''
  );
  const [surcharges, setSurcharges] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useMemo(() => {
    if (!selectedCategoryId) return;

    const initialSurcharges: Record<string, number> = {};
    boardingPoints.forEach((bp) => {
      const surcharge = bp.boarding_point_surcharges?.find(
        (s) => s.transfer_cost_category_id === selectedCategoryId
      );
      initialSurcharges[bp.id] = surcharge?.amount || 0;
    });
    setSurcharges(initialSurcharges);
  }, [selectedCategoryId, boardingPoints]);

  const handleSurchargeChange = (boardingPointId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSurcharges((prev) => ({
      ...prev,
      [boardingPointId]: numValue,
    }));
  };

  const handleSave = async () => {
    if (!selectedCategoryId) return;

    setSaving(true);
    try {
      for (const [boardingPointId, amount] of Object.entries(surcharges)) {
        await createOrUpdateBoardingPointSurcharge(
          boardingPointId,
          selectedCategoryId,
          amount
        );
      }

      await refetch();
      onClose();
    } catch (error) {
      console.error('Failed to save surcharges:', error);
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const values = Object.values(surcharges).filter((v) => v > 0);
    const total = values.length;
    const average = total > 0 ? values.reduce((a, b) => a + b, 0) / total : 0;
    return { total, average };
  }, [surcharges]);

  const selectedCategory = transferCostCategories.find(
    (cat) => cat.id === selectedCategoryId
  );

  return (
    <div className="w-full lg:w-96 bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-700 flex flex-col max-h-96 lg:max-h-none">
      <div className="p-3 sm:p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-teal-400" />
          {t('boardingPoints.surchargePanel.title')}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 sm:p-4 border-b border-gray-700">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {t('boardingPoints.surchargePanel.category')}
        </label>
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          {transferCostCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {selectedCategory && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-gray-700 rounded p-2">
              <p className="text-xs text-gray-400 mb-1">
                {t('boardingPoints.surchargePanel.totalCount')}
              </p>
              <p className="text-lg font-semibold text-white">{stats.total}</p>
            </div>
            <div className="bg-gray-700 rounded p-2">
              <p className="text-xs text-gray-400 mb-1">
                {t('boardingPoints.surchargePanel.averageSurcharge')}
              </p>
              <p className="text-lg font-semibold text-teal-400 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {stats.average.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {boardingPoints.map((bp) => (
            <div key={bp.id} className="bg-gray-700 rounded p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{bp.ort}</p>
                  <p className="text-xs text-gray-400 truncate">{bp.stelle}</p>
                  <code className="text-xs text-gray-500">{bp.code}</code>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={surcharges[bp.id] || 0}
                  onChange={(e) => handleSurchargeChange(bp.id, e.target.value)}
                  className="flex-1 px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : t('boardingPoints.surchargePanel.saveSurcharges')}
        </button>
      </div>
    </div>
  );
}
