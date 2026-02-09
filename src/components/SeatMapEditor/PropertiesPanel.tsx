import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { Seat } from '../../types';

interface PropertiesPanelProps {
  selectedSeat: Seat | null;
  onUpdate: (updates: Partial<Seat>) => void;
  onClose: () => void;
}

export function PropertiesPanel({ selectedSeat, onUpdate, onClose }: PropertiesPanelProps) {
  const { t } = useTranslation(['seatmaps', 'common']);

  return (
    <div className="w-72 bg-white border-l border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">{t('properties.title')}</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!selectedSeat || selectedSeat.seat_type === 'empty' ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto bg-slate-100 rounded-xl flex items-center justify-center mb-3">
              <span className="text-2xl text-slate-400">?</span>
            </div>
            <p className="text-sm text-slate-500">
              {t('properties.selectSeat')}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-slate-50 rounded-lg p-4">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                {t('properties.seatLabel')}
              </label>
              <div className="text-2xl font-bold text-teal-600">
                {selectedSeat.label || '-'}
              </div>
              <span className="text-xs text-slate-500">
                {t('properties.type')}: {t(`seatTypes.${selectedSeat.seat_type}`, { defaultValue: selectedSeat.seat_type.replace('_', ' ') })}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('properties.block')}
              </label>
              <input
                type="text"
                value={selectedSeat.block || ''}
                onChange={(e) => onUpdate({ block: e.target.value })}
                placeholder="e.g., A, B, VIP"
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('properties.row')}
                </label>
                <input
                  type="number"
                  value={selectedSeat.reihe || ''}
                  onChange={(e) => onUpdate({ reihe: parseInt(e.target.value) || null })}
                  placeholder="1"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('properties.position')}
                </label>
                <input
                  type="text"
                  value={selectedSeat.platz || ''}
                  onChange={(e) => onUpdate({ platz: e.target.value })}
                  placeholder="A"
                  className="input"
                />
              </div>
            </div>

            {selectedSeat.passenger_name && (
              <div className="border-t border-slate-200 pt-5">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">{t('properties.passengerInfo')}</h4>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="font-medium text-emerald-900">{selectedSeat.passenger_name}</p>
                  {selectedSeat.booking_ref && (
                    <p className="text-sm text-emerald-700 mt-0.5">
                      {t('properties.bookingRef')}: {selectedSeat.booking_ref}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-5">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">{t('properties.status')}</h4>
              <div className="flex gap-2">
                <span className={`badge ${
                  selectedSeat.status === 'available' ? 'badge-info' :
                  selectedSeat.status === 'booked' ? 'badge-success' : 'badge-danger'
                }`}>
                  {selectedSeat.status === 'available' ? t('common:status.available') :
                   selectedSeat.status === 'booked' ? t('common:status.booked') : t('common:filters.blocked')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
