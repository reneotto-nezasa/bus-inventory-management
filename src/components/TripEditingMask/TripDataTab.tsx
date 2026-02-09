import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, DollarSign, Save } from 'lucide-react';
import type { Trip, TripTag } from '../../types';
import { supabase } from '../../lib/supabase';
import { ClassificationTagsSection } from './ClassificationTagsSection';
import { DepartureStatusSection } from './DepartureStatusSection';
import { TourGuideManagementSection } from './TourGuideManagementSection';

interface TripDataTabProps {
  trip: Trip;
  onUpdate: (id: string, updates: Partial<Trip>) => Promise<void>;
}

export function TripDataTab({ trip, onUpdate }: TripDataTabProps) {
  const { t } = useTranslation('trips');

  const [editMode, setEditMode] = useState(false);
  const [tripTags, setTripTags] = useState<TripTag[]>([]);
  const [formData, setFormData] = useState({
    text: trip.text,
    code: trip.code,
    termin: trip.termin,
    bis: trip.bis,
    abpreis: trip.abpreis,
    status_hin: trip.status_hin,
    status_rueck: trip.status_rueck,
  });

  useEffect(() => {
    fetchTripTags();
  }, [trip.id]);

  const fetchTripTags = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_tags')
        .select('*')
        .eq('trip_id', trip.id)
        .order('dimension', { ascending: true });

      if (error) throw error;
      setTripTags(data || []);
    } catch (error) {
      console.error('Error fetching trip tags:', error);
    }
  };

  const handleSave = async () => {
    await onUpdate(trip.id, formData);
    setEditMode(false);
  };

  const handleAddDeparture = async () => {
    await createTripDeparture(trip.id, {
      start_date: trip.termin,
      end_date: trip.bis,
      status_hin: 'Frei',
      status_rueck: 'Frei',
    });
  };

  const departures = trip.trip_departures || [];
  const currentDeparture = departures[0];

  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            {t('tripData.title')}
          </h3>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="btn-ghost text-sm"
            >
              {t('actions.edit')}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(false)}
                className="btn-ghost text-sm"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="btn-primary text-sm flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                {t('actions.save')}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('tripData.tripName')}
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            ) : (
              <p className="text-white text-lg font-medium">{trip.text}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('tripData.tripCode')}
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            ) : (
              <p className="text-white font-mono bg-gray-700 px-3 py-2 rounded inline-block">{trip.code}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('tripData.basePrice')}
            </label>
            {editMode ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.abpreis}
                  onChange={(e) => setFormData({ ...formData, abpreis: Number(e.target.value) })}
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            ) : (
              <p className="text-white flex items-center gap-1 text-lg font-semibold">
                <DollarSign className="w-5 h-5 text-teal-400" />
                {trip.abpreis.toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('tripData.startDate')}
            </label>
            {editMode ? (
              <input
                type="date"
                value={formData.termin}
                onChange={(e) => setFormData({ ...formData, termin: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            ) : (
              <p className="text-white">{new Date(trip.termin).toLocaleDateString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('tripData.endDate')}
            </label>
            {editMode ? (
              <input
                type="date"
                value={formData.bis}
                onChange={(e) => setFormData({ ...formData, bis: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            ) : (
              <p className="text-white">{new Date(trip.bis).toLocaleDateString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('tripData.statusOutbound')}
            </label>
            {editMode ? (
              <select
                value={formData.status_hin}
                onChange={(e) => setFormData({ ...formData, status_hin: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="Frei">{t('status.frei')}</option>
                <option value="Offen">{t('status.offen')}</option>
                <option value="Geschlossen">{t('status.geschlossen')}</option>
                <option value="Bestätigt">{t('status.bestaetigt')}</option>
              </select>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30">
                {trip.status_hin}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('tripData.statusReturn')}
            </label>
            {editMode ? (
              <select
                value={formData.status_rueck}
                onChange={(e) => setFormData({ ...formData, status_rueck: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="Frei">{t('status.frei')}</option>
                <option value="Offen">{t('status.offen')}</option>
                <option value="Geschlossen">{t('status.geschlossen')}</option>
                <option value="Bestätigt">{t('status.bestaetigt')}</option>
              </select>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30">
                {trip.status_rueck}
              </span>
            )}
          </div>
        </div>
      </div>

      <ClassificationTagsSection
        tripId={trip.id}
        tags={tripTags}
        onTagsUpdate={fetchTripTags}
      />

      {currentDeparture && (
        <DepartureStatusSection
          departure={currentDeparture}
          onUpdate={fetchTripTags}
        />
      )}

      {currentDeparture && (
        <TourGuideManagementSection
          tripDepartureId={currentDeparture.id}
          busTransports={trip.bus_transports || []}
          onUpdate={fetchTripTags}
        />
      )}
    </div>
  );
}
