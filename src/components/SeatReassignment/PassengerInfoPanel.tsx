import { useTranslation } from 'react-i18next';
import { X, User, Mail, Phone, Home, MapPin, Calendar, Info } from 'lucide-react';
import type { SeatAssignment } from '../../types';

interface PassengerInfoPanelProps {
  assignment: SeatAssignment | null;
  onClose: () => void;
}

export function PassengerInfoPanel({ assignment, onClose }: PassengerInfoPanelProps) {
  const { t } = useTranslation('seatmaps');

  if (!assignment) {
    return (
      <div className="w-full lg:w-80 bg-gray-700 border-t lg:border-t-0 lg:border-l border-gray-600 flex flex-col max-h-64 lg:max-h-none">
        <div className="p-3 sm:p-4 border-b border-gray-600 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{t('passenger.details')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-400">
            <User className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('passenger.selectSeat')}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="w-full lg:w-80 bg-gray-700 border-t lg:border-t-0 lg:border-l border-gray-600 flex flex-col max-h-64 lg:max-h-none">
      <div className="p-3 sm:p-4 border-b border-gray-600 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{t('passenger.details')}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-teal-400" />
            <h4 className="text-lg font-bold text-white">{assignment.passenger_name}</h4>
          </div>
          {assignment.seat && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-3 h-3" />
              <span>Seat {assignment.seat.label}</span>
            </div>
          )}
        </div>

        {assignment.booking_reference && (
          <div className="inline-block px-3 py-1 bg-teal-500 bg-opacity-20 border border-teal-500 rounded text-teal-400 text-sm">
            {t('passenger.bookingRef')}: {assignment.booking_reference}
          </div>
        )}

        {assignment.accommodation_type && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase">
              <Home className="w-3 h-3" />
              {t('passenger.accommodation')}
            </div>
            <p className="text-white text-sm pl-5">{assignment.accommodation_type}</p>
          </div>
        )}

        {(assignment.preference_text || assignment.preference_type) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase">
              <Info className="w-3 h-3" />
              {t('preference.title')}
            </div>
            <div className="pl-5 space-y-2">
              {assignment.preference_type && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-500 bg-opacity-20 border border-blue-500 rounded text-blue-400 text-xs">
                    {t(`preference.${assignment.preference_type}`)}
                  </span>
                </div>
              )}
              {assignment.preference_text && (
                <p className="text-white text-sm italic">{assignment.preference_text}</p>
              )}
            </div>
          </div>
        )}

        {(assignment.passenger_email || assignment.passenger_phone) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase">
              {t('passenger.contact')}
            </div>
            <div className="pl-5 space-y-2">
              {assignment.passenger_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <a
                    href={`mailto:${assignment.passenger_email}`}
                    className="text-teal-400 hover:text-teal-300 truncate"
                  >
                    {assignment.passenger_email}
                  </a>
                </div>
              )}
              {assignment.passenger_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <a
                    href={`tel:${assignment.passenger_phone}`}
                    className="text-teal-400 hover:text-teal-300"
                  >
                    {assignment.passenger_phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1 pt-4 border-t border-gray-600">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase">
            <Calendar className="w-3 h-3" />
            {t('passenger.seatHistory')}
          </div>
          <p className="text-gray-300 text-xs pl-5">
            {t('passenger.assignedOn')} {formatDate(assignment.updated_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
