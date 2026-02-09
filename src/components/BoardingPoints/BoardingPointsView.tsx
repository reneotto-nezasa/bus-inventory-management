import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Plus, ArrowUpDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import type { BoardingPoint, TransferCostCategory } from '../../types';
import { BoardingPointDetail } from './BoardingPointDetail';

interface BoardingPointsViewProps {
  boardingPoints: BoardingPoint[];
  transferCostCategories: TransferCostCategory[];
  onUpdateBoardingPoint: (id: string, updates: Partial<BoardingPoint>) => Promise<void>;
  onCreateBoardingPoint: (data: Partial<BoardingPoint>) => Promise<void>;
  onDeleteBoardingPoint: (id: string) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
}

type SortField = 'code' | 'ort' | 'plz' | 'art' | 'status';
type SortDirection = 'asc' | 'desc';

export function BoardingPointsView({
  boardingPoints,
  transferCostCategories,
  onUpdateBoardingPoint,
  onCreateBoardingPoint,
  onDeleteBoardingPoint,
  onToggleStatus,
}: BoardingPointsViewProps) {
  const { t } = useTranslation(['boarding', 'common']);
  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState<BoardingPoint | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'freigegeben' | 'gesperrt'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('ort');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'ort':
          comparison = a.ort.localeCompare(b.ort);
          break;
        case 'plz':
          comparison = a.plz.localeCompare(b.plz);
          break;
        case 'art':
          comparison = a.art.localeCompare(b.art);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [boardingPoints, searchQuery, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  const handleBulkApprove = async () => {
    for (const id of selectedIds) {
      await onUpdateBoardingPoint(id, { status: 'freigegeben' });
    }
    setSelectedIds(new Set());
  };

  const handleBulkBlock = async () => {
    for (const id of selectedIds) {
      await onUpdateBoardingPoint(id, { status: 'gesperrt' });
    }
    setSelectedIds(new Set());
  };

  const handleCreate = () => {
    setSelectedBoardingPoint(null);
    setIsCreating(true);
  };

  const handleRowClick = (bp: BoardingPoint) => {
    setIsCreating(false);
    setSelectedBoardingPoint(bp);
  };

  const handleBack = () => {
    setSelectedBoardingPoint(null);
    setIsCreating(false);
  };

  const handleSave = async (data: Partial<BoardingPoint>) => {
    if (isCreating) {
      await onCreateBoardingPoint(data);
    } else if (selectedBoardingPoint) {
      await onUpdateBoardingPoint(selectedBoardingPoint.id, data);
    }
    setSelectedBoardingPoint(null);
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    await onDeleteBoardingPoint(id);
    setSelectedBoardingPoint(null);
  };

  const approvedCount = boardingPoints.filter(bp => bp.status === 'freigegeben').length;
  const blockedCount = boardingPoints.filter(bp => bp.status === 'gesperrt').length;

  if (selectedBoardingPoint || isCreating) {
    return (
      <BoardingPointDetail
        boardingPoint={isCreating ? undefined : selectedBoardingPoint!}
        transferCostCategories={transferCostCategories}
        onSave={handleSave}
        onDelete={handleDelete}
        onToggleStatus={onToggleStatus}
        onBack={handleBack}
      />
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
          <div className="flex items-center gap-3">
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
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
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
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {selectedIds.size > 0 && (
          <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-teal-800">
              {t('selection.selected', { count: selectedIds.size })}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={handleBulkApprove} className="btn btn-primary py-1.5 text-sm">
                <CheckCircle className="w-4 h-4" />
                {t('common:actions.approve')}
              </button>
              <button onClick={handleBulkBlock} className="btn btn-danger py-1.5 text-sm">
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
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-600 mb-1">{t('empty.title')}</h3>
            <p className="text-sm text-slate-400">
              {searchQuery ? t('empty.searchHint') : t('empty.noData')}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-12 py-3 px-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredBoardingPoints.length && filteredBoardingPoints.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </th>
                    <SortableHeader label={t('form.code')} field="code" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                    <SortableHeader label={t('table.location')} field="ort" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t('form.postalCode')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t('table.address')}
                    </th>
                    <SortableHeader label={t('form.type')} field="art" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t('form.transferCategory')}
                    </th>
                    <SortableHeader label={t('table.status')} field="status" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                    <th className="py-3 px-4 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBoardingPoints.map((bp) => {
                    const isSelected = selectedIds.has(bp.id);
                    return (
                      <tr
                        key={bp.id}
                        className={`transition-colors cursor-pointer group ${
                          isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'
                        } ${bp.status === 'gesperrt' ? 'opacity-60' : ''}`}
                      >
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(bp.id)}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                        </td>
                        <td className="py-3.5 px-4" onClick={() => handleRowClick(bp)}>
                          <code className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {bp.code}
                          </code>
                        </td>
                        <td className="py-3.5 px-4" onClick={() => handleRowClick(bp)}>
                          <span className="text-sm font-medium text-slate-900">{bp.ort}</span>
                        </td>
                        <td className="py-3.5 px-4" onClick={() => handleRowClick(bp)}>
                          <span className="text-sm text-slate-600">{bp.plz}</span>
                        </td>
                        <td className="py-3.5 px-4" onClick={() => handleRowClick(bp)}>
                          <span className="text-sm text-slate-600 truncate max-w-[200px] block">{bp.stelle}</span>
                        </td>
                        <td className="py-3.5 px-4" onClick={() => handleRowClick(bp)}>
                          <span className="badge badge-info">{bp.art}</span>
                        </td>
                        <td className="py-3.5 px-4" onClick={() => handleRowClick(bp)}>
                          {bp.transfer_cost_category ? (
                            <span className="text-sm text-slate-600">
                              {bp.transfer_cost_category.name}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4" onClick={() => handleRowClick(bp)}>
                          <span className={`badge ${bp.status === 'freigegeben' ? 'badge-success' : 'badge-danger'}`}>
                            {bp.status === 'freigegeben' ? t('common:filters.active') : t('common:filters.blocked')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4" onClick={() => handleRowClick(bp)}>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
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
