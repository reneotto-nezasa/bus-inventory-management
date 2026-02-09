import { useTranslation } from 'react-i18next';
import { Bus, Ship, ArrowRight, ArrowLeft, MapPin, Grid3X3 } from 'lucide-react';
import { SeatMapPreview } from '../SeatMapLibrary/SeatMapPreview';
import type { BusTransport, Seat, SeatMap } from '../../types';

interface TransportCardProps {
  transport: BusTransport;
  seats: Seat[];
  seatMaps: SeatMap[];
  onLinkSeatMap: (transportId: string, seatMapId: string | null) => void;
}

export function TransportCard({
  transport,
  seats,
  seatMaps,
  onLinkSeatMap,
}: TransportCardProps) {
  const { t, i18n } = useTranslation(['trips', 'common']);
  const Icon = transport.unterart === 'BUS' ? Bus : Ship;
  const DirectionIcon = transport.richtung === 'HIN' ? ArrowRight : ArrowLeft;

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const activeAssignments = transport.boarding_point_assignments?.filter(a => a.is_active) || [];

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            transport.unterart === 'BUS' ? 'bg-sky-100' : 'bg-teal-100'
          }`}>
            <Icon className={`w-5 h-5 ${
              transport.unterart === 'BUS' ? 'text-sky-600' : 'text-teal-600'
            }`} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{transport.text}</h4>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{t('transports.group')}: {transport.gruppe}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`badge ${
            transport.richtung === 'HIN' ? 'badge-info' : 'badge-warning'
          }`}>
            <DirectionIcon className="w-3 h-3 mr-1" />
            {transport.richtung === 'HIN' ? t('transports.outbound') : t('transports.return')}
          </span>
          <span className={`badge ${
            transport.status === 'Buchungsstop' ? 'badge-danger' : 'badge-success'
          }`}>
            {transport.status === 'Buchungsstop' ? t('common:status.closed') : t('common:status.open')}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">{t('transports.date')}</p>
            <p className="text-sm font-medium text-slate-900">
              {formatDate(transport.termin)}
              {transport.termin !== transport.bis && (
                <span className="text-slate-400"> - {formatDate(transport.bis)}</span>
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">{t('transports.seatMap')}</p>
            <select
              value={transport.seat_map_id || ''}
              onChange={(e) => onLinkSeatMap(transport.id, e.target.value || null)}
              className="select w-full text-sm py-1.5"
            >
              <option value="">{t('transports.noSeatMap')}</option>
              {seatMaps.map((sm) => (
                <option key={sm.id} value={sm.id}>
                  {sm.bezeichnung}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">{t('transports.boardingPoints')}</p>
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-900">{activeAssignments.length}</span>
              <span className="text-slate-400">{t('transports.assigned')}</span>
            </div>
          </div>
        </div>

        {transport.seat_map && seats.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
              <Grid3X3 className="w-4 h-4" />
              {t('transports.seatLayoutPreview')}
            </div>
            <div className="flex justify-center">
              <SeatMapPreview
                seats={seats}
                rowsCount={transport.seat_map.rows_count}
                colsCount={transport.seat_map.cols_count}
                bezeichnung={transport.seat_map.bezeichnung}
              />
            </div>
          </div>
        )}

        {activeAssignments.length > 0 && (
          <div className="pt-4 border-t border-slate-100 mt-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
              <MapPin className="w-4 h-4" />
              {t('transports.boardingPoints')}
            </div>
            <div className="grid gap-2">
              {activeAssignments.slice(0, 4).map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between text-sm bg-slate-50 px-3 py-2 rounded-lg"
                >
                  <span className="font-medium text-slate-700">
                    {assignment.boarding_point?.ort}
                  </span>
                  <span className="text-slate-500">{assignment.zeit || '-'}</span>
                </div>
              ))}
              {activeAssignments.length > 4 && (
                <p className="text-xs text-slate-400 text-center">
                  {t('transports.more', { count: activeAssignments.length - 4 })}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
