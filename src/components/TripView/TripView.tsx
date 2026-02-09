import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bus, Calendar, ChevronRight } from 'lucide-react';
import { TripEditingMask } from '../TripEditingMask';
import { useTrips } from '../../hooks';
import type { Trip } from '../../types';

interface TripViewProps {
  trips: Trip[];
}

export function TripView({ trips }: TripViewProps) {
  const { t, i18n } = useTranslation(['trips', 'common']);
  const { updateTrip } = useTrips();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrips = useMemo(() => {
    if (!searchQuery) return trips;
    const query = searchQuery.toLowerCase();
    return trips.filter(trip =>
      trip.code.toLowerCase().includes(query) ||
      trip.text.toLowerCase().includes(query)
    );
  }, [trips, searchQuery]);

  useEffect(() => {
    if (trips.length > 0 && !selectedTrip) {
      setSelectedTrip(trips[0]);
    }
  }, [trips, selectedTrip]);

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 bg-white border-r border-slate-200 overflow-auto">
          {filteredTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Bus className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">
                {searchQuery ? t('empty.noMatch') : t('empty.noData')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTrip(trip)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedTrip?.id === trip.id
                      ? 'bg-teal-50 border-l-2 border-teal-500'
                      : 'hover:bg-slate-50 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded">
                      {trip.code}
                    </code>
                    <ChevronRight className={`w-4 h-4 transition-colors ${
                      selectedTrip?.id === trip.id ? 'text-teal-500' : 'text-slate-300'
                    }`} />
                  </div>
                  <h3 className="font-medium text-slate-900 mb-1 line-clamp-1">{trip.text}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(trip.termin)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bus className="w-3 h-3" />
                      {trip.bus_transports?.length || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedTrip ? (
          <div className="flex-1 overflow-hidden bg-gray-800">
            <TripEditingMask
              trip={selectedTrip}
              onUpdate={updateTrip}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <Bus className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-1">{t('selectTrip.title')}</h3>
              <p className="text-gray-400">{t('selectTrip.hint')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
