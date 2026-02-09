import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Calendar, Percent, DollarSign } from 'lucide-react';
import type { EarlyBirdDiscount } from '../../types';
import { useExtras } from '../../hooks';

interface EarlyBirdSectionProps {
  discounts: EarlyBirdDiscount[];
  onEdit: (discount: EarlyBirdDiscount) => void;
  onDelete: (id: string) => void;
}

export function EarlyBirdSection({ discounts, onEdit, onDelete }: EarlyBirdSectionProps) {
  const { t } = useTranslation('extras');
  const { deleteEarlyBirdDiscount } = useExtras();

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDeleteDiscount'))) {
      try {
        await deleteEarlyBirdDiscount(id);
        onDelete(id);
      } catch (error) {
        console.error('Failed to delete early bird discount:', error);
      }
    }
  };

  if (discounts.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">{t('empty.earlyBird')}</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.bookingDeadline')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.travelDateFrom')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.travelDateTo')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.discountValue')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.description')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('actions.edit')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {discounts.map((discount) => (
              <tr key={discount.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-900">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    {new Date(discount.booking_deadline).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {discount.travel_date_from
                    ? new Date(discount.travel_date_from).toLocaleDateString()
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {discount.travel_date_to
                    ? new Date(discount.travel_date_to).toLocaleDateString()
                    : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm font-semibold text-teal-600">
                    {discount.discount_type === 'percent' ? (
                      <>
                        <Percent className="w-4 h-4" />
                        {discount.discount_value}%
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4" />
                        €{discount.discount_value.toFixed(2)}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {discount.description || '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(discount)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(discount.id)}
                      className="p-1.5 hover:bg-red-50 rounded text-slate-600 hover:text-slate-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
