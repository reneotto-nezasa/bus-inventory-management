import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Loader2 } from 'lucide-react';
import type { Trip } from '../../types';

interface TripFormProps {
  trip?: Trip | null;
  onClose: () => void;
  onSubmit: (data: Partial<Trip>) => Promise<void>;
}

export function TripForm({ trip, onClose, onSubmit }: TripFormProps) {
  const { t } = useTranslation('trips');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: trip?.code || '',
    text: trip?.text || '',
    termin: trip?.termin || new Date().toISOString().split('T')[0],
    bis: trip?.bis || new Date().toISOString().split('T')[0],
    abpreis: trip?.abpreis || 0,
    status_hin: trip?.status_hin || 'Frei',
    status_rueck: trip?.status_rueck || 'Frei',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save trip:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {trip ? t('actions.edit') : t('actions.create')}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                {t('tripData.tripName')} *
              </label>
              <input
                type="text"
                required
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="input w-full"
                placeholder="z.B. Grandhotel Pupp in Karlsbad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                {t('tripData.tripCode')} *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input w-full"
                placeholder="z.B. 3544406"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                {t('tripData.basePrice')} *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.abpreis}
                  onChange={(e) => setFormData({ ...formData, abpreis: Number(e.target.value) })}
                  className="input w-full pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                {t('tripData.startDate')} *
              </label>
              <input
                type="date"
                required
                value={formData.termin}
                onChange={(e) => setFormData({ ...formData, termin: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                {t('tripData.endDate')} *
              </label>
              <input
                type="date"
                required
                value={formData.bis}
                onChange={(e) => setFormData({ ...formData, bis: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                {t('tripData.statusOutbound')}
              </label>
              <select
                value={formData.status_hin}
                onChange={(e) => setFormData({ ...formData, status_hin: e.target.value })}
                className="select w-full"
              >
                <option value="Frei">Frei</option>
                <option value="W">W (Waitlist)</option>
                <option value="Buchungsstop">Buchungsstop</option>
                <option value="Anfrage">Anfrage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                {t('tripData.statusReturn')}
              </label>
              <select
                value={formData.status_rueck}
                onChange={(e) => setFormData({ ...formData, status_rueck: e.target.value })}
                className="select w-full"
              >
                <option value="Frei">Frei</option>
                <option value="W">W (Waitlist)</option>
                <option value="Buchungsstop">Buchungsstop</option>
                <option value="Anfrage">Anfrage</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('actions.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('actions.save')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
