import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type {
  TripExtra,
  TripExtraFormData,
  ExtraType,
  ExtraStatus,
} from '../../types';
import { EXTRA_TYPES } from '../../types';
import { useExtras } from '../../hooks';

interface ExtrasFormProps {
  tripDepartureId: string;
  extra: TripExtra | null;
  defaultType?: ExtraType;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExtrasForm({
  tripDepartureId,
  extra,
  defaultType = 'excursion',
  onClose,
  onSuccess,
}: ExtrasFormProps) {
  const { t } = useTranslation('extras');
  const { createExtra, updateExtra } = useExtras();
  const [formData, setFormData] = useState<TripExtraFormData>({
    type: defaultType,
    name: '',
    description: '',
    price: 0,
    currency: 'EUR',
    date: '',
    status: 'Frei',
    is_included: false,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (extra) {
      setFormData({
        type: extra.type,
        name: extra.name,
        description: extra.description || '',
        price: extra.price,
        currency: extra.currency,
        date: extra.date || '',
        status: extra.status,
        is_included: extra.is_included,
        sort_order: extra.sort_order,
      });
    }
  }, [extra]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (extra) {
        await updateExtra(extra.id, formData);
      } else {
        await createExtra(tripDepartureId, formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save extra:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {extra ? t('form.editTitle') : t('form.createTitle')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-1 text-sm">
                {t('fields.type')} *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as ExtraType })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              >
                {EXTRA_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {t(`types.${type.value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 text-sm">
                {t('fields.status')} *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ExtraStatus })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              >
                <option value="Frei">{t('statuses.Frei')}</option>
                <option value="Anfrage">{t('statuses.Anfrage')}</option>
                <option value="Ausgebucht">{t('statuses.Ausgebucht')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-1 text-sm">
              {t('fields.name')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1 text-sm">
              {t('fields.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-1 text-sm">
                {t('fields.price')} (€) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 text-sm">
                {t('fields.date')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_included}
                onChange={(e) =>
                  setFormData({ ...formData, is_included: e.target.checked })
                }
                className="w-4 h-4 text-teal-500 bg-gray-700 border-gray-600 rounded"
              />
              <span className="text-sm">{t('fields.included')}</span>
            </label>
          </div>
        </form>

        <div className="p-4 border-t border-gray-700 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            {t('actions.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : t('actions.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
