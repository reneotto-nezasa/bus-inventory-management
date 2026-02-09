import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Info } from 'lucide-react';
import type { UnassignedPassenger, SeatAssignment } from '../../types';

interface UnassignedPassengersPanelProps {
  transportId: string;
  assignments: SeatAssignment[];
  onSelectPassenger: (passenger: UnassignedPassenger) => void;
  selectedPassenger: UnassignedPassenger | null;
}

export function UnassignedPassengersPanel({
  transportId,
  assignments,
  onSelectPassenger,
  selectedPassenger,
}: UnassignedPassengersPanelProps) {
  const { t } = useTranslation('seatmaps');
  const [unassignedPassengers, setUnassignedPassengers] = useState<UnassignedPassenger[]>([]);

  useEffect(() => {
    const mockPassengers: UnassignedPassenger[] = [
      {
        id: '1',
        name: 'Max Mustermann',
        booking_reference: 'BK-2024-1001',
        preference_text: 'Window seat preferred',
        preference_type: 'position',
        accommodation_type: 'Rubindeck Zweibettkabine',
        passenger_email: 'max.mustermann@example.com',
        passenger_phone: '+49 171 1234567'
      },
      {
        id: '2',
        name: 'Anna Schmidt',
        booking_reference: 'BK-2024-1002',
        preference_text: 'With Thomas Wagner',
        preference_type: 'companion',
        accommodation_type: 'Smaragddeck Einzelkabine',
        passenger_email: 'anna.schmidt@example.com',
        passenger_phone: '+49 171 2345678'
      },
      {
        id: '3',
        name: 'Peter Mueller',
        booking_reference: 'BK-2024-1003',
        accommodation_type: 'Rubindeck Zweibettkabine',
        passenger_email: 'peter.mueller@example.com'
      },
      {
        id: '4',
        name: 'Laura Weber',
        booking_reference: 'BK-2024-1004',
        preference_text: 'Wheelchair accessible',
        preference_type: 'accessibility',
        accommodation_type: 'Saphirdeck Barrierefreie Kabine',
        passenger_email: 'laura.weber@example.com',
        passenger_phone: '+49 171 3456789'
      },
      {
        id: '5',
        name: 'Thomas Wagner',
        booking_reference: 'BK-2024-1005',
        accommodation_type: 'Smaragddeck Einzelkabine',
        passenger_email: 'thomas.wagner@example.com',
        passenger_phone: '+49 171 4567890'
      },
    ];

    const assignedPassengerNames = new Set(assignments.map((a) => a.passenger_name));
    const unassigned = mockPassengers.filter((p) => !assignedPassengerNames.has(p.name));

    setUnassignedPassengers(unassigned);
  }, [transportId, assignments]);

  return (
    <div className="w-full lg:w-80 bg-gray-700 border-t lg:border-t-0 lg:border-l border-gray-600 flex flex-col max-h-64 lg:max-h-none">
      <div className="p-3 sm:p-4 border-b border-gray-600">
        <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-400" />
          {t('reassignment.unassigned')}
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          {unassignedPassengers.length} {unassignedPassengers.length === 1 ? 'passenger' : 'passengers'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {unassignedPassengers.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">All passengers assigned</p>
          </div>
        ) : (
          <div className="space-y-2">
            {unassignedPassengers.map((passenger) => {
              const isSelected = selectedPassenger?.id === passenger.id;
              return (
                <button
                  key={passenger.id}
                  onClick={() => onSelectPassenger(passenger)}
                  className={`w-full p-3 rounded transition-all text-left ${
                    isSelected
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{passenger.name}</p>
                    {passenger.preference_text && (
                      <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                  {passenger.booking_reference && (
                    <p className="text-xs opacity-80 mt-1">
                      Ref: {passenger.booking_reference}
                    </p>
                  )}
                  {passenger.preference_text && (
                    <p className="text-xs italic opacity-70 mt-1">
                      {passenger.preference_text}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
