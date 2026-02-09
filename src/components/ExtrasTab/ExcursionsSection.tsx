import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Calendar, MapPin } from 'lucide-react';
import type { TripExtra } from '../../types';
import { useExtras } from '../../hooks';

interface ExcursionsSectionProps {
  extras: TripExtra[];
  onEdit: (extra: TripExtra) => void;
  onDelete: (id: string) => void;
}

export function ExcursionsSection({ extras, onEdit, onDelete }: ExcursionsSectionProps) {
  const { t } = useTranslation('extras');
  const { deleteExtra } = useExtras();

  const excursions = extras.filter((extra) => extra.type === 'excursion');

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteExtra(id);
        onDelete(id);
      } catch (error) {
        console.error('Failed to delete excursion:', error);
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
        return 'bg-slate-200';
    }
  };

  if (excursions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">{t('empty.excursions')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {excursions.map((excursion) => (
        <div
          key={excursion.id}
          className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="text-slate-900 font-semibold">{excursion.name}</h4>
              {excursion.description && (
                <p className="text-xs text-slate-500 mt-1">{excursion.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => onEdit(excursion)}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(excursion.id)}
                className="p-1.5 hover:bg-red-50 rounded text-slate-600 hover:text-slate-900"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {excursion.date && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-3 h-3" />
                {new Date(excursion.date).toLocaleDateString()}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{t('fields.price')}:</span>
              <span className="text-slate-900 font-semibold">
                €{excursion.price.toFixed(2)}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-300 flex items-center justify-between">
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs text-white ${getStatusColor(
                  excursion.status
                )}`}
              >
                {t(`statuses.${excursion.status}`)}
              </span>
              {excursion.is_included && (
                <span className="text-xs text-teal-600 font-medium">
                  {t('labels.included')}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
