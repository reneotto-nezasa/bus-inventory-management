import { useTranslation } from 'react-i18next';
import { X, Armchair, Table, Bath, ChefHat, User, UserCircle, DoorOpen, Minus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { SEAT_TYPE_OPTIONS, type SeatType, type SeatStatus } from '../../types';

interface SeatTypeSelectorProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onSelect: (type: SeatType) => void;
  onStatusChange: (status: SeatStatus) => void;
  onClose: () => void;
  currentType?: SeatType;
  currentStatus?: SeatStatus;
}

const TYPE_ICONS: Partial<Record<SeatType, React.ElementType>> = {
  empty: Trash2,
  sitzplatz: Armchair,
  sitzplatz_rueckwaerts: Armchair,
  sitzplatz_gang: Armchair,
  sitzplatz_fenster: Armchair,
  tisch: Table,
  wc: Bath,
  kueche: ChefHat,
  fahrer: User,
  reiseleiter: UserCircle,
  einstieg: DoorOpen,
  holm: Minus,
  aufgang: ArrowUp,
  abgang: ArrowDown,
};

export function SeatTypeSelector({
  isOpen,
  position,
  onSelect,
  onStatusChange,
  onClose,
  currentType,
  currentStatus,
}: SeatTypeSelectorProps) {
  const { t } = useTranslation(['seatmaps', 'common']);

  if (!isOpen) return null;

  const statusOptions: { value: SeatStatus; label: string; color: string }[] = [
    { value: 'available', label: t('common:status.available'), color: 'bg-teal-500' },
    { value: 'booked', label: t('common:status.booked'), color: 'bg-emerald-500' },
    { value: 'blocked', label: t('common:filters.blocked'), color: 'bg-red-500' },
  ];

  const isSeatType = currentType?.startsWith('sitzplatz');

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-2 min-w-56 overflow-hidden"
        style={{
          left: Math.min(position.x, window.innerWidth - 240),
          top: Math.min(position.y, window.innerHeight - 400),
        }}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-900">{t('selectType')}</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
          {SEAT_TYPE_OPTIONS.map((option) => {
            const Icon = TYPE_ICONS[option.value] || Armchair;
            const isSelected = currentType === option.value;

            return (
              <button
                key={option.value}
                onClick={() => onSelect(option.value)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors
                  ${isSelected
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-700 hover:bg-slate-50'}
                `}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{t(`seatTypes.${option.value}`, { defaultValue: option.label })}</span>
                {isSelected && (
                  <span className="ml-auto text-teal-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isSeatType && (
          <div className="border-t border-slate-100 mt-1 pt-2">
            <div className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t('properties.status')}
            </div>
            {statusOptions.map((status) => (
              <button
                key={status.value}
                onClick={() => onStatusChange(status.value)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors
                  ${currentStatus === status.value
                    ? 'bg-slate-50'
                    : 'hover:bg-slate-50'}
                `}
              >
                <span className={`w-3 h-3 rounded-full ${status.color}`} />
                <span className="text-slate-700">{status.label}</span>
                {currentStatus === status.value && (
                  <span className="ml-auto text-teal-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
