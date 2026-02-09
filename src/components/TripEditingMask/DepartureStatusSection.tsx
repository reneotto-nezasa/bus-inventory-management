import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Calendar, Save } from 'lucide-react';
import type { TripDeparture } from '../../types';
import { supabase } from '../../lib/supabase';

interface DepartureStatusSectionProps {
  departure: TripDeparture;
  onUpdate: () => void;
}

export function DepartureStatusSection({ departure, onUpdate }: DepartureStatusSectionProps) {
  const { t } = useTranslation('trips');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    status_hin: departure.status_hin || 'Frei',
    status_rueck: departure.status_rueck || 'Frei',
    buchung_bis_datum: departure.buchung_bis_datum || '',
  });

  const handleSave = async () => {
    try {
      await supabase
        .from('trip_departures')
        .update({
          status_hin: formData.status_hin,
          status_rueck: formData.status_rueck,
          buchung_bis_datum: formData.buchung_bis_datum || null,
        })
        .eq('id', departure.id);
      onUpdate();
      setEditMode(false);
    } catch (error) {
      console.error('Error updating departure status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Frei':
        return 'bg-green-900/30 border-green-700 text-green-300';
      case 'W':
        return 'bg-yellow-900/30 border-yellow-700 text-yellow-300';
      case 'Anfrage':
        return 'bg-orange-900/30 border-orange-700 text-orange-300';
      default:
        return 'bg-gray-700 border-gray-600 text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Frei':
        return t('tripData.status.frei');
      case 'W':
        return t('tripData.status.warteliste');
      case 'Anfrage':
        return t('tripData.status.anfrage');
      default:
        return status;
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg font-semibold text-white">
            {t('tripData.departureStatus')}
          </h3>
        </div>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {t('tripData.statusOutbound')}
          </label>
          {editMode ? (
            <select
              value={formData.status_hin}
              onChange={(e) => setFormData({ ...formData, status_hin: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="Frei">{t('tripData.status.frei')}</option>
              <option value="W">{t('tripData.status.warteliste')}</option>
              <option value="Anfrage">{t('tripData.status.anfrage')}</option>
            </select>
          ) : (
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(departure.status_hin)}`}>
              {getStatusLabel(departure.status_hin)}
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {t('tripData.statusReturn')}
          </label>
          {editMode ? (
            <select
              value={formData.status_rueck}
              onChange={(e) => setFormData({ ...formData, status_rueck: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="Frei">{t('tripData.status.frei')}</option>
              <option value="W">{t('tripData.status.warteliste')}</option>
              <option value="Anfrage">{t('tripData.status.anfrage')}</option>
            </select>
          ) : (
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(departure.status_rueck)}`}>
              {getStatusLabel(departure.status_rueck)}
            </span>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            {t('tripData.bookingDeadline')}
          </label>
          {editMode ? (
            <input
              type="date"
              value={formData.buchung_bis_datum}
              onChange={(e) => setFormData({ ...formData, buchung_bis_datum: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          ) : (
            <p className="text-white">
              {departure.buchung_bis_datum
                ? new Date(departure.buchung_bis_datum).toLocaleDateString()
                : t('tripData.noDeadline')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
