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
    <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col max-h-96 lg:max-h-none">
      <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-teal-600" />
          {t('boardingPoints.surchargePanel.title')}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 sm:p-4 border-b border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {t('boardingPoints.surchargePanel.category')}
        </label>
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="select w-full"
        >
          {transferCostCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {selectedCategory && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <p className="text-xs text-slate-500 mb-1">
                {t('boardingPoints.surchargePanel.totalCount')}
              </p>
              <p className="text-lg font-semibold text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <p className="text-xs text-slate-500 mb-1">
                {t('boardingPoints.surchargePanel.averageSurcharge')}
              </p>
              <p className="text-lg font-semibold text-teal-600 flex items-center gap-1">
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
            <div key={bp.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{bp.ort}</p>
                  <p className="text-xs text-slate-500 truncate">{bp.stelle}</p>
                  <code className="text-xs text-slate-400">{bp.code}</code>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={surcharges[bp.id] || 0}
                  onChange={(e) => handleSurchargeChange(bp.id, e.target.value)}
                  className="input text-sm flex-1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary w-full justify-center"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : t('boardingPoints.surchargePanel.saveSurcharges')}
        </button>
      </div>
    </div>
  );
}
