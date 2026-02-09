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
  const [formData, setFormData] = useState({
    status_hin: departure.status_hin || 'Frei',
    status_rueck: departure.status_rueck || 'Frei',
    buchung_bis_datum: departure.buchung_bis_datum || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
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
    } catch (error) {
      console.error('Error updating departure status:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-teal-600" />
          {t('tripData.departureStatus')}
        </h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary text-sm"
        >
          <Save className="w-4 h-4" />
          {t('actions.save')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            <Calendar className="w-4 h-4 inline mr-1" />
            {t('tripData.bookingDeadline')}
          </label>
          <input
            type="date"
            value={formData.buchung_bis_datum}
            onChange={(e) => setFormData({ ...formData, buchung_bis_datum: e.target.value })}
            className="input"
          />
        </div>
      </div>
    </div>
  );
}
