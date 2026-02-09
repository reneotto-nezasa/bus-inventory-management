import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Hotel, Plus, LayoutGrid, List, Filter, X } from 'lucide-react';
import type { Trip, TripDeparture, Accommodation, RoomType, AccommodationStatus } from '../../types';
import { useAccommodations } from '../../hooks';
import { StructuredView } from './StructuredView';
import { FlatListView } from './FlatListView';
import { AccommodationForm } from './AccommodationForm';

interface AccommodationTabProps {
  trip: Trip;
}

type ViewMode = 'structured' | 'flatList';

export function AccommodationTab({ trip }: AccommodationTabProps) {
  const { t } = useTranslation('accommodations');
  const { fetchAccommodationsForDeparture } = useAccommodations();
  const [viewMode, setViewMode] = useState<ViewMode>('structured');
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterDeck, setFilterDeck] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<AccommodationStatus | ''>('');
  const [filterRoomType, setFilterRoomType] = useState<RoomType | ''>('');

  const selectedDeparture = trip.trip_departures?.[0];

  const filteredAccommodations = useMemo(() => {
    return accommodations.filter((acc) => {
      if (filterDeck && acc.deck_name !== filterDeck) return false;
      if (filterStatus && acc.status !== filterStatus) return false;
      if (filterRoomType && acc.room_type !== filterRoomType) return false;
      return true;
    });
  }, [accommodations, filterDeck, filterStatus, filterRoomType]);

  const uniqueDecks = useMemo(() => {
    const decks = new Set(accommodations.map((a) => a.deck_name).filter(Boolean));
    return Array.from(decks).sort();
  }, [accommodations]);

  const hasActiveFilters = filterDeck || filterStatus || filterRoomType;

  const clearFilters = () => {
    setFilterDeck('');
    setFilterStatus('');
    setFilterRoomType('');
  };

  useEffect(() => {
    const loadAccommodations = async () => {
      if (!selectedDeparture) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchAccommodationsForDeparture(selectedDeparture.id);
        setAccommodations(data);
      } catch (error) {
        console.error('Failed to load accommodations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccommodations();
  }, [selectedDeparture, fetchAccommodationsForDeparture]);

  const handleAddAccommodation = () => {
    setEditingAccommodation(null);
    setShowForm(true);
  };

  const handleEditAccommodation = (accommodation: Accommodation) => {
    setEditingAccommodation(accommodation);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAccommodation(null);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingAccommodation(null);
    if (selectedDeparture) {
      const data = await fetchAccommodationsForDeparture(selectedDeparture.id);
      setAccommodations(data);
    }
  };

  if (!selectedDeparture) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-500 py-8">
          <Hotel className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No departure selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Hotel className="w-6 h-6 text-teal-600" />
            {t('title')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {trip.text} - {new Date(selectedDeparture.termin).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded p-1">
            <button
              onClick={() => setViewMode('structured')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'structured'
                  ? 'bg-teal-500 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title={t('viewModes.structured')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('flatList')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'flatList'
                  ? 'bg-teal-500 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title={t('viewModes.flatList')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button onClick={handleAddAccommodation} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('actions.add')}
          </button>
        </div>
      </div>

      {accommodations.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-600" />
              {t('filters.title')}
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn-ghost text-xs flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                {t('filters.clearAll')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                {t('filters.deck')}
              </label>
              <select
                value={filterDeck}
                onChange={(e) => setFilterDeck(e.target.value)}
                className="select w-full"
              >
                <option value="">{t('filters.all')}</option>
                {uniqueDecks.map((deck) => (
                  <option key={deck} value={deck}>
                    {deck}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                {t('filters.status')}
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as AccommodationStatus | '')}
                className="select w-full"
              >
                <option value="">{t('filters.all')}</option>
                <option value="Frei">{t('statuses.Frei')}</option>
                <option value="Anfrage">{t('statuses.Anfrage')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                {t('filters.roomType')}
              </label>
              <select
                value={filterRoomType}
                onChange={(e) => setFilterRoomType(e.target.value as RoomType | '')}
                className="select w-full"
              >
                <option value="">{t('filters.all')}</option>
                <option value="DZ">{t('roomTypes.dz')}</option>
                <option value="EZ">{t('roomTypes.ez')}</option>
                <option value="Suite">{t('roomTypes.suite')}</option>
                <option value="Zweibettkabine">{t('roomTypes.zweibettkabine')}</option>
                <option value="Alleinbenutzung">{t('roomTypes.alleinbenutzung')}</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 text-xs text-slate-500">
              {t('filters.showing')} {filteredAccommodations.length} {t('filters.of')} {accommodations.length}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center text-slate-500 py-8">
          <p className="text-sm">Loading...</p>
        </div>
      ) : accommodations.length === 0 ? (
        <div className="card text-center py-12">
          <Hotel className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('empty.title')}</h3>
          <p className="text-slate-500 mb-6">{t('empty.subtitle')}</p>
          <button onClick={handleAddAccommodation} className="btn-primary mx-auto">
            {t('actions.add')}
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'structured' ? (
            <StructuredView
              accommodations={filteredAccommodations}
              onEdit={handleEditAccommodation}
              onDelete={async (id) => {
                setAccommodations((prev) => prev.filter((a) => a.id !== id));
              }}
            />
          ) : (
            <FlatListView
              accommodations={filteredAccommodations}
              onEdit={handleEditAccommodation}
              onDelete={async (id) => {
                setAccommodations((prev) => prev.filter((a) => a.id !== id));
              }}
            />
          )}
        </>
      )}

      {showForm && selectedDeparture && (
        <AccommodationForm
          tripDepartureId={selectedDeparture.id}
          accommodation={editingAccommodation}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
