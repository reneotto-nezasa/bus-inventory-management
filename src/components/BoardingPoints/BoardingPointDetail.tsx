import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Settings, Save, Trash2, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import type { BoardingPoint, TransferCostCategory } from '../../types';

interface BoardingPointDetailProps {
  boardingPoint?: BoardingPoint;
  transferCostCategories: TransferCostCategory[];
  onSave: (data: Partial<BoardingPoint>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
  onBack: () => void;
}

export function BoardingPointDetail({
  boardingPoint,
  transferCostCategories,
  onSave,
  onDelete,
  onToggleStatus,
  onBack,
}: BoardingPointDetailProps) {
  const { t } = useTranslation(['boarding', 'common']);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    ort: boardingPoint?.ort || '',
    stelle: boardingPoint?.stelle || '',
    plz: boardingPoint?.plz || '',
    code: boardingPoint?.code || '',
    art: boardingPoint?.art || 'BUS',
    status: boardingPoint?.status || 'freigegeben',
    idbuspro: boardingPoint?.idbuspro || '',
    transfer_cost_category_id: boardingPoint?.transfer_cost_category_id || '',
  });

  const isNew = !boardingPoint;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...formData,
        idbuspro: formData.idbuspro || null,
        transfer_cost_category_id: formData.transfer_cost_category_id || null,
      });
    } catch (error) {
      console.error('Failed to save boarding point:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!boardingPoint) return;
    await onDelete(boardingPoint.id);
  };

  const handleToggleStatus = async () => {
    if (!boardingPoint) return;
    await onToggleStatus(boardingPoint.id);
    onBack();
  };

  const isActive = boardingPoint?.status === 'freigegeben';

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-slate-900">
                  {isNew ? t('form.createTitle') : t('form.editTitle')}
                </h1>
                {!isNew && (
                  <code className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                    {boardingPoint.code}
                  </code>
                )}
              </div>
              {!isNew && (
                <p className="text-sm text-slate-500 mt-0.5">
                  {boardingPoint.ort}, {boardingPoint.plz}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isNew && (
              <>
                <button
                  onClick={handleToggleStatus}
                  className={`btn text-sm ${isActive ? 'btn-ghost text-amber-600 hover:bg-amber-50' : 'btn-ghost text-emerald-600 hover:bg-emerald-50'}`}
                >
                  {isActive ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  {isActive ? t('common:actions.block') : t('common:actions.approve')}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-ghost text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common:actions.delete')}
                </button>
              </>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !formData.ort || !formData.plz || !formData.stelle || !formData.code}
              className="btn btn-primary"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? t('common:status.saving') : t('common:actions.save')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-semibold text-slate-900">{t('detail.locationSection')}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  className="input"
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
                  className="input"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('form.address')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.stelle}
                  onChange={(e) => setFormData({ ...formData, stelle: e.target.value })}
                  placeholder={t('form.addressPlaceholder')}
                  className="input"
                />
              </div>

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
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('form.type')}
                </label>
                <select
                  value={formData.art}
                  onChange={(e) => setFormData({ ...formData, art: e.target.value as BoardingPoint['art'] })}
                  className="select w-full"
                >
                  <option value="BUS">BUS</option>
                  <option value="SCHIFF">SCHIFF</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Settings className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-semibold text-slate-900">{t('detail.configSection')}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  value={formData.transfer_cost_category_id}
                  onChange={(e) => setFormData({ ...formData, transfer_cost_category_id: e.target.value })}
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

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('form.busProId')}
                </label>
                <input
                  type="text"
                  value={formData.idbuspro}
                  onChange={(e) => setFormData({ ...formData, idbuspro: e.target.value })}
                  placeholder={t('form.busProIdPlaceholder')}
                  className="input"
                />
                <p className="mt-1.5 text-xs text-slate-400">{t('detail.busProIdHint')}</p>
              </div>
            </div>
          </div>

          {!isNew && boardingPoint.boarding_point_surcharges && boardingPoint.boarding_point_surcharges.length > 0 && (
            <div className="card p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-teal-600 font-bold text-sm">EUR</span>
                <h2 className="text-base font-semibold text-slate-900">{t('detail.surchargesSection')}</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t('detail.category')}
                      </th>
                      <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t('surcharge')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {boardingPoint.boarding_point_surcharges.map((surcharge) => (
                      <tr key={surcharge.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-sm text-slate-700">
                          {surcharge.transfer_cost_category?.name || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-sm text-slate-900 text-right font-medium">
                          {surcharge.amount.toFixed(2)} EUR
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && boardingPoint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('common:actions.delete')}</h3>
            <p className="text-sm text-slate-600 mb-6">{t('confirmDelete')}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-ghost"
              >
                {t('common:actions.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
              >
                <Trash2 className="w-4 h-4" />
                {t('common:actions.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
