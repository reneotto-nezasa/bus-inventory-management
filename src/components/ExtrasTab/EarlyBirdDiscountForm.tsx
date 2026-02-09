import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type {
  EarlyBirdDiscount,
  EarlyBirdDiscountFormData,
  DiscountType,
} from '../../types';
import { useExtras } from '../../hooks';

interface EarlyBirdDiscountFormProps {
  tripDepartureId: string;
  discount: EarlyBirdDiscount | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EarlyBirdDiscountForm({
  tripDepartureId,
  discount,
  onClose,
  onSuccess,
}: EarlyBirdDiscountFormProps) {
  const { t } = useTranslation('extras');
  const { createEarlyBirdDiscount, updateEarlyBirdDiscount } = useExtras();
  const [formData, setFormData] = useState<EarlyBirdDiscountFormData>({
    travel_date_from: '',
    travel_date_to: '',
    booking_deadline: '',
    discount_value: 0,
    discount_type: 'flat',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (discount) {
      setFormData({
        travel_date_from: discount.travel_date_from || '',
        travel_date_to: discount.travel_date_to || '',
        booking_deadline: discount.booking_deadline,
        discount_value: discount.discount_value,
        discount_type: discount.discount_type,
        description: discount.description || '',
      });
    }
  }, [discount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (discount) {
        await updateEarlyBirdDiscount(discount.id, formData);
      } else {
        await createEarlyBirdDiscount(tripDepartureId, formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save early bird discount:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {discount ? t('form.discountEditTitle') : t('form.discountCreateTitle')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-gray-400 mb-1 text-sm">
              {t('fields.bookingDeadline')} *
            </label>
            <input
              type="date"
              value={formData.booking_deadline}
              onChange={(e) =>
                setFormData({ ...formData, booking_deadline: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-1 text-sm">
                {t('fields.travelDateFrom')}
              </label>
              <input
                type="date"
                value={formData.travel_date_from}
                onChange={(e) =>
                  setFormData({ ...formData, travel_date_from: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 text-sm">
                {t('fields.travelDateTo')}
              </label>
              <input
                type="date"
                value={formData.travel_date_to}
                onChange={(e) =>
                  setFormData({ ...formData, travel_date_to: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-1 text-sm">
                {t('fields.discountType')} *
              </label>
              <select
                value={formData.discount_type}
                onChange={(e) =>
                  setFormData({ ...formData, discount_type: e.target.value as DiscountType })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              >
                <option value="flat">{t('discountTypes.flat')}</option>
                <option value="percent">{t('discountTypes.percent')}</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 text-sm">
                {t('fields.discountValue')} *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.discount_value}
                onChange={(e) =>
                  setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
                placeholder={formData.discount_type === 'percent' ? '10' : '50.00'}
              />
            </div>
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
