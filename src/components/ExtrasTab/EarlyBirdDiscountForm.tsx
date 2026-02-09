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
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {discount ? t('form.discountEditTitle') : t('form.discountCreateTitle')}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-slate-500 mb-1 text-sm">
              {t('fields.bookingDeadline')} *
            </label>
            <input
              type="date"
              value={formData.booking_deadline}
              onChange={(e) =>
                setFormData({ ...formData, booking_deadline: e.target.value })
              }
              className="input w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.travelDateFrom')}
              </label>
              <input
                type="date"
                value={formData.travel_date_from}
                onChange={(e) =>
                  setFormData({ ...formData, travel_date_from: e.target.value })
                }
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.travelDateTo')}
              </label>
              <input
                type="date"
                value={formData.travel_date_to}
                onChange={(e) =>
                  setFormData({ ...formData, travel_date_to: e.target.value })
                }
                className="input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.discountType')} *
              </label>
              <select
                value={formData.discount_type}
                onChange={(e) =>
                  setFormData({ ...formData, discount_type: e.target.value as DiscountType })
                }
                className="select w-full"
                required
              >
                <option value="flat">{t('discountTypes.flat')}</option>
                <option value="percent">{t('discountTypes.percent')}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.discountValue')} *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.discount_value}
                onChange={(e) =>
                  setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })
                }
                className="input w-full"
                required
                placeholder={formData.discount_type === 'percent' ? '10' : '50.00'}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 text-sm">
              {t('fields.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full"
              rows={3}
            />
          </div>
        </form>

        <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-3">
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
