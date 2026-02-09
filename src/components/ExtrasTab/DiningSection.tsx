import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Calendar, Utensils } from 'lucide-react';
import type { TripExtra } from '../../types';
import { useExtras } from '../../hooks';

interface DiningSectionProps {
  extras: TripExtra[];
  onEdit: (extra: TripExtra) => void;
  onDelete: (id: string) => void;
}

export function DiningSection({ extras, onEdit, onDelete }: DiningSectionProps) {
  const { t } = useTranslation('extras');
  const { deleteExtra } = useExtras();

  const diningExtras = extras.filter((extra) => extra.type === 'dining');

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteExtra(id);
        onDelete(id);
      } catch (error) {
        console.error('Failed to delete dining extra:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Frei':
        return 'bg-green-500';
      case 'Anfrage':
        return 'bg-orange-500';
      case 'Ausgebucht':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (diningExtras.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Utensils className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">{t('empty.dining')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {diningExtras.map((dining) => (
        <div
          key={dining.id}
          className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <Utensils className="w-4 h-4" />
                {dining.name}
              </h4>
              {dining.description && (
                <p className="text-xs text-gray-400 mt-1">{dining.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => onEdit(dining)}
                className="p-1.5 hover:bg-gray-500 rounded text-gray-300 hover:text-white"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(dining.id)}
                className="p-1.5 hover:bg-red-500 rounded text-gray-300 hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {dining.date && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Calendar className="w-3 h-3" />
                {new Date(dining.date).toLocaleDateString()}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{t('fields.price')}:</span>
              {dining.price === 0 || dining.is_included ? (
                <span className="text-teal-400 font-semibold">
                  {t('labels.included')}
                </span>
              ) : (
                <span className="text-white font-semibold">
                  €{dining.price.toFixed(2)}
                </span>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-600">
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs text-white ${getStatusColor(
                  dining.status
                )}`}
              >
                {t(`statuses.${dining.status}`)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
