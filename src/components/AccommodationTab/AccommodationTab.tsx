import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Hotel, Plus, LayoutGrid, List } from 'lucide-react';
import type { Trip, TripDeparture, Accommodation } from '../../types';
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

  const selectedDeparture = trip.trip_departures?.[0];

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
        <div className="text-center text-gray-400 py-8">
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
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Hotel className="w-6 h-6 text-teal-400" />
            {t('title')}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {trip.text} - {new Date(selectedDeparture.termin).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-700 rounded p-1">
            <button
              onClick={() => setViewMode('structured')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'structured'
                  ? 'bg-teal-500 text-white'
                  : 'text-gray-400 hover:text-white'
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
                  : 'text-gray-400 hover:text-white'
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

      {loading ? (
        <div className="text-center text-gray-400 py-8">
          <p className="text-sm">Loading...</p>
        </div>
      ) : accommodations.length === 0 ? (
        <div className="card text-center py-12">
          <Hotel className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-semibold text-white mb-2">{t('empty.title')}</h3>
          <p className="text-gray-400 mb-6">{t('empty.subtitle')}</p>
          <button onClick={handleAddAccommodation} className="btn-primary mx-auto">
            {t('actions.add')}
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'structured' ? (
            <StructuredView
              accommodations={accommodations}
              onEdit={handleEditAccommodation}
              onDelete={async (id) => {
                setAccommodations((prev) => prev.filter((a) => a.id !== id));
              }}
            />
          ) : (
            <FlatListView
              accommodations={accommodations}
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
