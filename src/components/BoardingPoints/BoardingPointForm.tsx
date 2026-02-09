import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { BoardingPoint, TransferCostCategory } from '../../types';

interface BoardingPointFormProps {
  boardingPoint?: BoardingPoint;
  transferCostCategories: TransferCostCategory[];
  onSubmit: (data: Partial<BoardingPoint>) => Promise<void>;
  onClose: () => void;
}

export function BoardingPointForm({
  boardingPoint,
  transferCostCategories,
  onSubmit,
  onClose,
}: BoardingPointFormProps) {
  const { t } = useTranslation(['boarding', 'common']);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ort: boardingPoint?.ort || '',
    stelle: boardingPoint?.stelle || '',
    plz: boardingPoint?.plz || '',
    code: boardingPoint?.code || '',
    art: boardingPoint?.art || 'BUS',
    status: boardingPoint?.status || 'freigegeben',
    idbuspro: boardingPoint?.idbuspro || null,
    transfer_cost_category_id: boardingPoint?.transfer_cost_category_id || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save boarding point:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {boardingPoint ? t('form.editTitle') : t('form.createTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('form.location')} *
              </label>
              <input
                type="text"
                required
                value={formData.ort}
                onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
                placeholder={t('form.locationPlaceholder')}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('form.postalCode')} *
              </label>
              <input
                type="text"
                required
                value={formData.plz}
                onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                placeholder={t('form.postalCodePlaceholder')}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('form.address')} *
            </label>
            <input
              type="text"
              required
              value={formData.stelle}
              onChange={(e) => setFormData({ ...formData, stelle: e.target.value })}
              placeholder={t('form.addressPlaceholder')}
              className="input w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('form.code')} *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder={t('form.codePlaceholder')}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('form.type')}
              </label>
              <select
                value={formData.art}
                onChange={(e) => setFormData({ ...formData, art: e.target.value })}
                className="select w-full"
              >
                <option value="BUS">BUS</option>
                <option value="TRAIN">TRAIN</option>
                <option value="HOTEL">HOTEL</option>
                <option value="AIRPORT">AIRPORT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('form.status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'freigegeben' | 'gesperrt' })}
                className="select w-full"
              >
                <option value="freigegeben">{t('common:filters.active')}</option>
                <option value="gesperrt">{t('common:filters.blocked')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('form.transferCategory')}
              </label>
              <select
                value={formData.transfer_cost_category_id || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  transfer_cost_category_id: e.target.value || null
                })}
                className="select w-full"
              >
                <option value="">{t('routeConfig.none')}</option>
                {transferCostCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.amount.toFixed(2)} EUR)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('form.busProId')}
            </label>
            <input
              type="text"
              value={formData.idbuspro || ''}
              onChange={(e) => setFormData({ ...formData, idbuspro: e.target.value || null })}
              placeholder={t('form.busProIdPlaceholder')}
              className="input w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={loading}
            >
              {t('common:actions.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? t('common:status.saving') : t('common:actions.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
