import { useTranslation } from 'react-i18next';
import { Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import type { Trip } from '../../types';

interface TripDetailsProps {
  trip: Trip;
}

export function TripDetails({ trip }: TripDetailsProps) {
  const { t, i18n } = useTranslation(['trips', 'common']);

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <code className="text-sm font-medium bg-slate-100 px-2 py-1 rounded">{trip.code}</code>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{trip.text}</h2>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">{t('details.startingFrom')}</p>
          <p className="text-2xl font-bold text-teal-600">{trip.abpreis.toFixed(2)} EUR</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Calendar className="w-4 h-4" />
            {t('details.departure')}
          </div>
          <p className="font-medium text-slate-900">{formatDate(trip.termin)}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Calendar className="w-4 h-4" />
            {t('details.return')}
          </div>
          <p className="font-medium text-slate-900">{formatDate(trip.bis)}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <ArrowRight className="w-4 h-4" />
            {t('details.outboundStatus')}
          </div>
          <span className={`badge ${
            trip.status_hin === 'Buchungsstop' ? 'badge-danger' : 'badge-success'
          }`}>
            {trip.status_hin === 'Buchungsstop' ? t('common:status.closed') : t('common:status.open')}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <ArrowLeft className="w-4 h-4" />
            {t('details.returnStatus')}
          </div>
          <span className={`badge ${
            trip.status_rueck === 'Buchungsstop' ? 'badge-danger' : 'badge-success'
          }`}>
            {trip.status_rueck === 'Buchungsstop' ? t('common:status.closed') : t('common:status.open')}
          </span>
        </div>
      </div>
    </div>
  );
}
