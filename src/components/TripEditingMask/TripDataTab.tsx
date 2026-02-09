import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Save, Plus, Loader2 } from 'lucide-react';
import type { Trip, TripTag } from '../../types';
import { supabase } from '../../lib/supabase';
import { ClassificationTagsSection } from './ClassificationTagsSection';
import { DepartureStatusSection } from './DepartureStatusSection';
import { TourGuideManagementSection } from './TourGuideManagementSection';
import { useTrips } from '../../hooks';

interface TripDataTabProps {
  trip: Trip;
  onUpdate: (id: string, updates: Partial<Trip>) => Promise<void>;
}

export function TripDataTab({ trip, onUpdate }: TripDataTabProps) {
  const { t } = useTranslation('trips');
  const { createTripDeparture } = useTrips();

  const [tripTags, setTripTags] = useState<TripTag[]>([]);
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
    setFormData({
      text: trip.text,
      code: trip.code,
      termin: trip.termin,
      bis: trip.bis,
      abpreis: trip.abpreis,
      status_hin: trip.status_hin,
      status_rueck: trip.status_rueck,
    });
  }, [trip.id]);

  useEffect(() => {
    fetchTripTags();
  }, [trip.id]);

  useEffect(() => {
    const departures = trip.trip_departures || [];
    if (departures.length > 0 && !selectedDepartureId) {
      setSelectedDepartureId(departures[0].id);
    }
  }, [trip.trip_departures, selectedDepartureId]);

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
    setSaving(true);
    try {
      await onUpdate(trip.id, formData);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDeparture = async () => {
    const newDeparture = await createTripDeparture(trip.id, {
      start_date: trip.termin,
      end_date: trip.bis,
      status_hin: 'Frei',
      status_rueck: 'Frei',
    });
    if (newDeparture) {
      setSelectedDepartureId(newDeparture.id);
    }
  };

  const departures = trip.trip_departures || [];
  const currentDeparture = departures.find(d => d.id === selectedDepartureId) || departures[0];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            {t('tripData.title')}
          </h3>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary text-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {t('actions.save')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('tripData.tripName')}
            </label>
            <input
              type="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('tripData.tripCode')}
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('tripData.basePrice')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">EUR</span>
              <input
                type="number"
                step="0.01"
                value={formData.abpreis}
                onChange={(e) => setFormData({ ...formData, abpreis: Number(e.target.value) })}
                className="input pl-12"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('tripData.startDate')}
            </label>
            <input
              type="date"
              value={formData.termin}
              onChange={(e) => setFormData({ ...formData, termin: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('tripData.endDate')}
            </label>
            <input
              type="date"
              value={formData.bis}
              onChange={(e) => setFormData({ ...formData, bis: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('tripData.statusOutbound')}
            </label>
            <select
              value={formData.status_hin}
              onChange={(e) => setFormData({ ...formData, status_hin: e.target.value })}
              className="select w-full"
            >
              <option value="Frei">{t('tripData.status.frei')}</option>
              <option value="W">{t('tripData.status.warteliste')}</option>
              <option value="Anfrage">{t('tripData.status.anfrage')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('tripData.statusReturn')}
            </label>
            <select
              value={formData.status_rueck}
              onChange={(e) => setFormData({ ...formData, status_rueck: e.target.value })}
              className="select w-full"
            >
              <option value="Frei">{t('tripData.status.frei')}</option>
              <option value="W">{t('tripData.status.warteliste')}</option>
              <option value="Anfrage">{t('tripData.status.anfrage')}</option>
            </select>
          </div>
        </div>
      </div>

      <ClassificationTagsSection
        tripId={trip.id}
        tags={tripTags}
        onTagsUpdate={fetchTripTags}
      />

      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            {t('tripData.departures')}
          </h3>
          <button
            onClick={handleAddDeparture}
            className="btn btn-secondary text-sm"
          >
            <Plus className="w-4 h-4" />
            {t('tripData.addDeparture')}
          </button>
        </div>

        {departures.length === 0 ? (
          <p className="text-slate-500 text-sm">{t('tripData.noDepartures')}</p>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('actions.select')} {t('tripData.departures')}
            </label>
            <select
              value={selectedDepartureId || ''}
              onChange={(e) => setSelectedDepartureId(e.target.value)}
              className="select w-full"
            >
              {departures.map((departure) => (
                <option key={departure.id} value={departure.id}>
                  {departure.code || `${new Date(departure.start_date).toLocaleDateString()} - ${departure.end_date ? new Date(departure.end_date).toLocaleDateString() : t('tripData.noDeadline')}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

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
