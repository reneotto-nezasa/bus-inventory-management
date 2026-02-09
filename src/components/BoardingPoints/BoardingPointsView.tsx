import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, CheckCircle, XCircle, Filter, Clock, Plus, Edit2, Trash2 } from 'lucide-react';
import type { BoardingPoint, TransferCostCategory } from '../../types';
import { BoardingPointForm } from './BoardingPointForm';

interface BoardingPointsViewProps {
  boardingPoints: BoardingPoint[];
  transferCostCategories: TransferCostCategory[];
  onUpdateBoardingPoint: (id: string, updates: Partial<BoardingPoint>) => Promise<void>;
  onCreateBoardingPoint: (data: Partial<BoardingPoint>) => Promise<void>;
  onDeleteBoardingPoint: (id: string) => Promise<void>;
}

export function BoardingPointsView({
  boardingPoints,
  transferCostCategories,
  onUpdateBoardingPoint,
  onCreateBoardingPoint,
  onDeleteBoardingPoint,
}: BoardingPointsViewProps) {
  const { t } = useTranslation(['boarding', 'common']);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set(['1']));
  const [assignedTimes, setAssignedTimes] = useState<Record<string, string>>({ '1': '10:00' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'freigegeben' | 'gesperrt'>('all');
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBoardingPoint, setEditingBoardingPoint] = useState<BoardingPoint | undefined>();

  const filteredBoardingPoints = useMemo(() => {
    let filtered = boardingPoints;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((bp) =>
        bp.ort.toLowerCase().includes(query) ||
        bp.stelle.toLowerCase().includes(query) ||
        bp.plz.toLowerCase().includes(query) ||
        bp.code.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((bp) => bp.status === statusFilter);
    }

    if (showOnlyAssigned) {
      filtered = filtered.filter((bp) => assignedIds.has(bp.id));
    }

    return filtered;
  }, [boardingPoints, searchQuery, statusFilter, showOnlyAssigned, assignedIds]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredBoardingPoints.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBoardingPoints.map(bp => bp.id)));
    }
  };

  const handleToggleAssignment = (id: string) => {
    setAssignedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setAssignedTimes((times) => {
          const newTimes = { ...times };
          delete newTimes[id];
          return newTimes;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleTimeChange = (id: string, time: string) => {
    setAssignedTimes((prev) => ({ ...prev, [id]: time }));
  };

  const handleApprove = async () => {
    for (const id of selectedIds) {
      await onUpdateBoardingPoint(id, { status: 'freigegeben' });
    }
    setSelectedIds(new Set());
  };

  const handleBlock = async () => {
    for (const id of selectedIds) {
      await onUpdateBoardingPoint(id, { status: 'gesperrt' });
    }
    setSelectedIds(new Set());
  };

  const handleEdit = (boardingPoint: BoardingPoint) => {
    setEditingBoardingPoint(boardingPoint);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingBoardingPoint(undefined);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: Partial<BoardingPoint>) => {
    if (editingBoardingPoint) {
      await onUpdateBoardingPoint(editingBoardingPoint.id, data);
    } else {
      await onCreateBoardingPoint(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      await onDeleteBoardingPoint(id);
    }
  };

  const approvedCount = boardingPoints.filter(bp => bp.status === 'freigegeben').length;
  const blockedCount = boardingPoints.filter(bp => bp.status === 'gesperrt').length;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="badge badge-success">{approvedCount} {t('common:filters.active')}</span>
              <span className="badge badge-danger">{blockedCount} {t('common:filters.blocked')}</span>
            </div>
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              {t('common:actions.create')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(['all', 'freigegeben', 'gesperrt'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? t('common:filters.all') : status === 'freigegeben' ? t('common:filters.active') : t('common:filters.blocked')}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showOnlyAssigned}
              onChange={() => setShowOnlyAssigned(!showOnlyAssigned)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            {t('assignedOnly')}
          </label>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {selectedIds.size > 0 && (
              <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between">
                <span className="text-sm text-teal-800">
                  {t('selection.selected', { count: selectedIds.size })}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={handleApprove} className="btn btn-primary py-1.5 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    {t('common:actions.approve')}
                  </button>
                  <button onClick={handleBlock} className="btn btn-danger py-1.5 text-sm">
                    <XCircle className="w-4 h-4" />
                    {t('common:actions.block')}
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="btn btn-ghost py-1.5 text-sm"
                  >
                    {t('common:actions.clear')}
                  </button>
                </div>
              </div>
            )}

            {filteredBoardingPoints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{t('empty.title')}</h3>
                <p className="text-slate-500">
                  {searchQuery ? t('empty.searchHint') : t('empty.noData')}
                </p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="w-12 px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === filteredBoardingPoints.length && filteredBoardingPoints.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                      </th>
                      <th className="w-12 px-4 py-3"></th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('table.location')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('table.address')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('table.time')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('table.code')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('table.status')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBoardingPoints.map((bp) => {
                      const isAssigned = assignedIds.has(bp.id);
                      const isSelected = selectedIds.has(bp.id);
                      const time = assignedTimes[bp.id] || '';

                      return (
                        <tr
                          key={bp.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'
                          } ${bp.status === 'gesperrt' ? 'opacity-60' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(bp.id)}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleAssignment(bp.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isAssigned
                                  ? 'bg-teal-100 text-teal-600 hover:bg-teal-200'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                              title={isAssigned ? t('actions.removeFromRoute') : t('actions.addToRoute')}
                            >
                              <MapPin className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{bp.ort}</div>
                            <div className="text-sm text-slate-500">{bp.plz}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{bp.stelle}</td>
                          <td className="px-4 py-3">
                            {isAssigned ? (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <input
                                  type="time"
                                  value={time}
                                  onChange={(e) => handleTimeChange(bp.id, e.target.value)}
                                  className="input py-1 px-2 w-28"
                                />
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-sm bg-slate-100 px-2 py-1 rounded text-slate-700">
                              {bp.code}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${
                              bp.status === 'freigegeben' ? 'badge-success' : 'badge-danger'
                            }`}>
                              {bp.status === 'freigegeben' ? t('common:filters.active') : t('common:filters.blocked')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(bp)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                                title={t('common:actions.edit')}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(bp.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-slate-600 hover:text-red-600"
                                title={t('common:actions.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="w-72 bg-white border-l border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {t('routeConfig.title')}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('routeConfig.direction')}</label>
              <select className="select w-full">
                <option>{t('routeConfig.outbound')}</option>
                <option>{t('routeConfig.return')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('routeConfig.transferCost')}</label>
              <select className="select w-full">
                <option value="">{t('routeConfig.none')}</option>
                {transferCostCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.amount.toFixed(2)} EUR)
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-3">{t('routeSummary.title')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('routeSummary.assignedPoints')}</span>
                  <span className="font-medium text-slate-900">{assignedIds.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('routeSummary.totalPoints')}</span>
                  <span className="font-medium text-slate-900">{boardingPoints.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <BoardingPointForm
          boardingPoint={editingBoardingPoint}
          transferCostCategories={transferCostCategories}
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
