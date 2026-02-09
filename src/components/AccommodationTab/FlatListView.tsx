import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import type { Accommodation } from '../../types';
import { useAccommodations } from '../../hooks';

interface FlatListViewProps {
  accommodations: Accommodation[];
  onEdit: (accommodation: Accommodation) => void;
  onDelete: (id: string) => void;
}

export function FlatListView({ accommodations, onEdit, onDelete }: FlatListViewProps) {
  const { t } = useTranslation('accommodations');
  const { deleteAccommodation } = useAccommodations();

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteAccommodation(id);
        onDelete(id);
      } catch (error) {
        console.error('Failed to delete accommodation:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Frei':
        return 'bg-green-500';
      case 'Anfrage':
        return 'bg-orange-500';
      default:
        return 'bg-slate-200';
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.code')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.name')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.roomType')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.price')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.occupancy')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.mealPlan')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.nights')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('fields.status')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('actions.edit')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {accommodations.map((accommodation) => (
              <tr key={accommodation.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-600">
                  {accommodation.code || '-'}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{accommodation.name}</p>
                    {accommodation.deck_name && (
                      <p className="text-xs text-slate-500">
                        {t(`deck.${accommodation.deck_name}`, accommodation.deck_name)}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {accommodation.room_type
                    ? t(`roomTypes.${accommodation.room_type}`)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                  €{accommodation.price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {accommodation.belegung_min}-{accommodation.belegung_max}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {accommodation.meal_plan
                    ? t(`mealPlans.${accommodation.meal_plan}`)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {accommodation.nights || '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs text-white ${getStatusColor(
                      accommodation.status
                    )}`}
                  >
                    {t(`statuses.${accommodation.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(accommodation)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(accommodation.id)}
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
