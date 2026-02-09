import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Trip } from '../../types';
import { TripDataTab } from './TripDataTab';
import { TransportTab } from './TransportTab';
import { BoardingPointsTab } from './BoardingPointsTab';
import { GroupAssignmentTab } from './GroupAssignmentTab';
import { AccommodationTab } from '../AccommodationTab';
import { ExtrasTab } from '../ExtrasTab';

interface TripEditingMaskProps {
  trip: Trip;
  onUpdate: (id: string, updates: Partial<Trip>) => Promise<void>;
}

type TabType = 'tripData' | 'transport' | 'boardingPoints' | 'groupAssignment' | 'accommodation' | 'extras';

export function TripEditingMask({ trip, onUpdate }: TripEditingMaskProps) {
  const { t } = useTranslation('trips');
  const [activeTab, setActiveTab] = useState<TabType>('tripData');
  const [selectedTransportId, setSelectedTransportId] = useState<string | null>(null);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'tripData', label: t('tabs.tripData') },
    { key: 'transport', label: t('tabs.transport') },
    { key: 'boardingPoints', label: t('tabs.boardingPoints') },
    { key: 'groupAssignment', label: t('tabs.groupAssignment') },
    { key: 'accommodation', label: t('tabs.accommodation') },
    { key: 'extras', label: t('tabs.extras') },
  ];

  const handleTransportSelect = (transportId: string | null) => {
    setSelectedTransportId(transportId);
    if (transportId) {
      setActiveTab('boardingPoints');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-700">
        <div className="flex space-x-1 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-6 py-3 font-medium text-sm border-b-2 transition-colors
                ${
                  activeTab === tab.key
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'tripData' && (
          <TripDataTab trip={trip} onUpdate={onUpdate} />
        )}
        {activeTab === 'transport' && (
          <TransportTab trip={trip} onSelectTransport={handleTransportSelect} />
        )}
        {activeTab === 'boardingPoints' && (
          <BoardingPointsTab trip={trip} selectedTransportId={selectedTransportId} />
        )}
        {activeTab === 'groupAssignment' && (
          <GroupAssignmentTab trip={trip} />
        )}
        {activeTab === 'accommodation' && (
          <AccommodationTab trip={trip} />
        )}
        {activeTab === 'extras' && (
          <ExtrasTab trip={trip} />
        )}
      </div>
    </div>
  );
}
