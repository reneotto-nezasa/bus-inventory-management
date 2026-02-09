import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bus, Plus, ArrowLeft, ArrowUpDown, ChevronRight } from 'lucide-react';
import { TripEditingMask } from '../TripEditingMask';
import { TripForm } from './TripForm';
import { useTrips } from '../../hooks';
import type { Trip } from '../../types';

interface TripViewProps {
  trips: Trip[];
}

type SortField = 'text' | 'code' | 'termin' | 'abpreis';
type SortDirection = 'asc' | 'desc';

export function TripView({ trips }: TripViewProps) {
  const { t, i18n } = useTranslation(['trips', 'common']);
  const { updateTrip, createTrip, refetch } = useTrips();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [sortField, setSortField] = useState<SortField>('termin');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredTrips = useMemo(() => {
    let result = trips;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(trip =>
        trip.code.toLowerCase().includes(query) ||
        trip.text.toLowerCase().includes(query)
      );
    }

    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'text':
          comparison = a.text.localeCompare(b.text);
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'termin':
          comparison = new Date(a.termin).getTime() - new Date(b.termin).getTime();
          break;
        case 'abpreis':
          comparison = a.abpreis - b.abpreis;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [trips, searchQuery, sortField, sortDirection]);

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateTrip = () => {
    setEditingTrip(null);
    setShowTripForm(true);
  };

  const handleFormSubmit = async (data: Partial<Trip>) => {
    if (editingTrip) {
      await updateTrip(editingTrip.id, data);
    } else {
      await createTrip(data);
    }
    await refetch();
    setShowTripForm(false);
    setEditingTrip(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Frei':
        return 'badge-success';
      case 'W':
      case 'Anfrage':
        return 'badge-warning';
      case 'Geschlossen':
      case 'Buchungsstop':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  };

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (selectedTrip) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedTrip(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-slate-900">{selectedTrip.text}</h1>
                  <code className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                    {selectedTrip.code}
                  </code>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {formatDate(selectedTrip.termin)} - {formatDate(selectedTrip.bis)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <TripEditingMask
            trip={selectedTrip}
            onUpdate={updateTrip}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
          </div>
          <button
            onClick={handleCreateTrip}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            {t('actions.create')}
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {filteredTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Bus className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-1">
              {searchQuery ? t('empty.noMatch') : t('empty.noData')}
            </h3>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <SortableHeader
                      label={t('tripData.tripCode')}
                      field="code"
                      currentSort={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label={t('tripData.tripName')}
                      field="text"
                      currentSort={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label={t('tripData.startDate')}
                      field="termin"
                      currentSort={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t('tripData.endDate')}
                    </th>
                    <SortableHeader
                      label={t('tripData.basePrice')}
                      field="abpreis"
                      currentSort={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t('tripData.statusOutbound')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Transports
                    </th>
                    <th className="py-3 px-4 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrips.map((trip) => (
                    <tr
                      key={trip.id}
                      onClick={() => setSelectedTrip(trip)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <code className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {trip.code}
                        </code>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-medium text-slate-900">{trip.text}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm text-slate-600">{formatDate(trip.termin)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">{formatDate(trip.bis)}</span>
                          <span className="text-xs text-slate-400">
                            ({getDuration(trip.termin, trip.bis)}d)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-medium text-slate-900">
                          {trip.abpreis.toLocaleString(i18n.language === 'de' ? 'de-DE' : 'en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`badge ${getStatusBadge(trip.status_hin)}`}>
                          {trip.status_hin}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Bus className="w-3.5 h-3.5" />
                          <span>{trip.bus_transports?.length || 0}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showTripForm && (
        <TripForm
          trip={editingTrip}
          onClose={() => {
            setShowTripForm(false);
            setEditingTrip(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentSort: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}

function SortableHeader({ label, field, currentSort, onSort }: SortableHeaderProps) {
  const isActive = currentSort === field;
  return (
    <th
      className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${isActive ? 'text-teal-600' : 'text-slate-300'}`} />
      </div>
    </th>
  );
}
