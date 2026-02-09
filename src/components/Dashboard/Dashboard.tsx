import { useTranslation } from 'react-i18next';
import {
  Grid3X3,
  MapPin,
  Bus,
  Calendar,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { SeatMap, BoardingPoint, Trip } from '../../types';

interface DashboardProps {
  seatMaps: SeatMap[];
  boardingPoints: BoardingPoint[];
  trips: Trip[];
  onNavigate: (page: 'seatmaps' | 'boarding' | 'trips') => void;
  onCreateSeatMap: () => void;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
  viewAllLabel: string;
}

function StatCard({ title, value, icon: Icon, color, onClick, viewAllLabel }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="card p-6 text-left hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm text-slate-500 group-hover:text-teal-600 transition-colors">
        <span>{viewAllLabel}</span>
        <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
}

function QuickAction({ title, description, icon: Icon, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all text-left group"
    >
      <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-teal-100 transition-colors">
        <Icon className="w-5 h-5 text-slate-600 group-hover:text-teal-600" />
      </div>
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </button>
  );
}

interface RecentItemProps {
  title: string;
  subtitle: string;
  time: string;
  type: 'seatmap' | 'trip';
  onClick: () => void;
}

function RecentItem({ title, subtitle, time, type, onClick }: RecentItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-lg transition-colors text-left w-full"
    >
      <div className={`p-2 rounded-lg ${type === 'seatmap' ? 'bg-sky-100' : 'bg-emerald-100'}`}>
        {type === 'seatmap' ? (
          <Grid3X3 className="w-4 h-4 text-sky-600" />
        ) : (
          <Bus className="w-4 h-4 text-emerald-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{title}</p>
        <p className="text-sm text-slate-500 truncate">{subtitle}</p>
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">{time}</span>
    </button>
  );
}

export function Dashboard({
  seatMaps,
  boardingPoints,
  trips,
  onNavigate,
  onCreateSeatMap,
}: DashboardProps) {
  const { t } = useTranslation(['dashboard', 'common']);
  const activeBoardingPoints = boardingPoints.filter(bp => bp.status === 'freigegeben').length;
  const recentSeatMaps = seatMaps.slice(0, 5);
  const recentTrips = trips.slice(0, 3);

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return t('common:time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('common:time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('common:time.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-slate-500 mt-1">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t('stats.seatMaps')}
            value={seatMaps.length}
            icon={Grid3X3}
            color="bg-sky-500"
            onClick={() => onNavigate('seatmaps')}
            viewAllLabel={t('common:actions.viewAll')}
          />
          <StatCard
            title={t('stats.activeBoardingPoints')}
            value={activeBoardingPoints}
            icon={MapPin}
            color="bg-emerald-500"
            onClick={() => onNavigate('boarding')}
            viewAllLabel={t('common:actions.viewAll')}
          />
          <StatCard
            title={t('stats.totalTrips')}
            value={trips.length}
            icon={Bus}
            color="bg-amber-500"
            onClick={() => onNavigate('trips')}
            viewAllLabel={t('common:actions.viewAll')}
          />
          <StatCard
            title={t('stats.transportsToday')}
            value={trips.reduce((acc, trip) => acc + (trip.bus_transports?.length || 0), 0)}
            icon={Calendar}
            color="bg-rose-500"
            onClick={() => onNavigate('trips')}
            viewAllLabel={t('common:actions.viewAll')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('quickActions.title')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickAction
                  title={t('quickActions.createSeatMap')}
                  description={t('quickActions.createSeatMapDesc')}
                  icon={Plus}
                  onClick={onCreateSeatMap}
                />
                <QuickAction
                  title={t('quickActions.manageBoarding')}
                  description={t('quickActions.manageBoardingDesc')}
                  icon={MapPin}
                  onClick={() => onNavigate('boarding')}
                />
                <QuickAction
                  title={t('quickActions.viewTrips')}
                  description={t('quickActions.viewTripsDesc')}
                  icon={Bus}
                  onClick={() => onNavigate('trips')}
                />
                <QuickAction
                  title={t('quickActions.fleetOverview')}
                  description={t('quickActions.fleetOverviewDesc')}
                  icon={TrendingUp}
                  onClick={() => onNavigate('seatmaps')}
                />
              </div>
            </div>

            <div className="card">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">{t('recentSeatMaps.title')}</h2>
                  <button
                    onClick={() => onNavigate('seatmaps')}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    {t('common:actions.viewAll')}
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {recentSeatMaps.length > 0 ? (
                  recentSeatMaps.map((seatMap) => (
                    <RecentItem
                      key={seatMap.id}
                      title={seatMap.bezeichnung}
                      subtitle={`${seatMap.rows_count} ${t('common:units.rows')}, ${seatMap.cols_count} ${t('common:units.columns')}`}
                      time={formatRelativeTime(seatMap.updated_at)}
                      type="seatmap"
                      onClick={() => onNavigate('seatmaps')}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <Grid3X3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>{t('recentSeatMaps.empty')}</p>
                    <button
                      onClick={onCreateSeatMap}
                      className="mt-2 text-teal-600 hover:text-teal-700 font-medium"
                    >
                      {t('recentSeatMaps.createFirst')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="card">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">{t('recentTrips.title')}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {recentTrips.length > 0 ? (
                  recentTrips.map((trip) => (
                    <RecentItem
                      key={trip.id}
                      title={trip.code}
                      subtitle={trip.text}
                      time={formatRelativeTime(trip.created_at)}
                      type="trip"
                      onClick={() => onNavigate('trips')}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <Bus className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>{t('recentTrips.empty')}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('systemStatus.title')}</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{t('systemStatus.database')}</span>
                  <span className="badge badge-success">{t('common:status.connected')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{t('systemStatus.syncStatus')}</span>
                  <span className="badge badge-success">{t('common:status.upToDate')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{t('systemStatus.lastRefresh')}</span>
                  <span className="text-sm text-slate-500">{t('common:time.justNow')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
