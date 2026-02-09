import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Grid3X3, MoreVertical, Edit2, Trash2, Copy } from 'lucide-react';
import { SeatMapPreview } from './SeatMapPreview';
import { supabase } from '../../lib/supabase';
import type { SeatMap, Seat } from '../../types';

export interface Template {
  id: string;
  bezeichnung: string;
  art: 'BUS' | 'SCHIFF';
  rows_count: number;
  cols_count: number;
}

const TEMPLATES: Template[] = [
  { id: 'tpl-1', bezeichnung: 'Standard Bus (44+1)', art: 'BUS', rows_count: 10, cols_count: 5 },
  { id: 'tpl-2', bezeichnung: 'Large Bus (49+2)', art: 'BUS', rows_count: 14, cols_count: 5 },
  { id: 'tpl-3', bezeichnung: 'Extra Large Bus (57+2)', art: 'BUS', rows_count: 16, cols_count: 5 },
  { id: 'tpl-4', bezeichnung: 'Cruise Ship - Emerald Deck', art: 'SCHIFF', rows_count: 20, cols_count: 8 },
  { id: 'tpl-5', bezeichnung: 'Cruise Ship - Ruby Deck', art: 'SCHIFF', rows_count: 20, cols_count: 8 },
  { id: 'tpl-6', bezeichnung: 'Cruise Ship - Diamond Deck', art: 'SCHIFF', rows_count: 20, cols_count: 8 },
];

interface SeatMapLibraryProps {
  seatMaps: SeatMap[];
  onSelectSeatMap: (seatMap: SeatMap) => void;
  onCreateFromTemplate: (template: Template) => void;
  onCreateNew: () => void;
  onDelete: (seatMap: SeatMap) => void;
}

export function SeatMapLibrary({
  seatMaps,
  onSelectSeatMap,
  onCreateFromTemplate,
  onCreateNew,
  onDelete,
}: SeatMapLibraryProps) {
  const { t, i18n } = useTranslation(['seatmaps', 'common']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeatMap, setSelectedSeatMap] = useState<SeatMap | null>(null);
  const [previewSeats, setPreviewSeats] = useState<Seat[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'BUS' | 'SCHIFF'>('all');

  const filteredSeatMaps = useMemo(() => {
    let filtered = seatMaps;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sm =>
        sm.bezeichnung.toLowerCase().includes(query) ||
        sm.art.toLowerCase().includes(query)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(sm => sm.art === filterType);
    }

    return filtered;
  }, [seatMaps, searchQuery, filterType]);

  useEffect(() => {
    async function fetchSeats() {
      if (!selectedSeatMap) {
        setPreviewSeats([]);
        return;
      }

      const { data } = await supabase
        .from('seats')
        .select('*')
        .eq('seat_map_id', selectedSeatMap.id)
        .order('row_index')
        .order('col_index');

      setPreviewSeats(data || []);
    }

    fetchSeats();
  }, [selectedSeatMap]);

  const handleSeatMapSelect = (seatMap: SeatMap) => {
    setSelectedSeatMap(seatMap);
    setActiveDropdown(null);
  };

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="btn btn-secondary"
            >
              {t('actions.useTemplate')}
            </button>
            <button onClick={onCreateNew} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              <span>{t('actions.newSeatMap')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('filters.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(['all', 'BUS', 'SCHIFF'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterType === type
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'all' ? t('common:filters.all') : type === 'BUS' ? t('filters.bus') : t('filters.ship')}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {filteredSeatMaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Grid3X3 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{t('empty.title')}</h3>
              <p className="text-slate-500 mb-4">
                {searchQuery ? t('empty.searchHint') : t('empty.createHint')}
              </p>
              <button onClick={onCreateNew} className="btn btn-primary">
                <Plus className="w-4 h-4" />
                {t('actions.createSeatMap')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSeatMaps.map((seatMap) => (
                <div
                  key={seatMap.id}
                  onClick={() => handleSeatMapSelect(seatMap)}
                  className={`card p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedSeatMap?.id === seatMap.id
                      ? 'ring-2 ring-teal-500 border-teal-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {seatMap.bezeichnung}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {t('card.rowsCols', { rows: seatMap.rows_count, cols: seatMap.cols_count })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${
                        seatMap.art === 'BUS' ? 'badge-info' : 'badge-neutral'
                      }`}>
                        {seatMap.art}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === seatMap.id ? null : seatMap.id);
                          }}
                          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>

                        {activeDropdown === seatMap.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(null);
                              }}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-32">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectSeatMap(seatMap);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                {t('common:actions.edit')}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                {t('common:actions.duplicate')}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(t('confirmDelete'))) {
                                    onDelete(seatMap);
                                  }
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                {t('common:actions.delete')}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    {t('card.updated')} {formatDate(seatMap.updated_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSeatMap && (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">{t('preview.title')}</h3>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <SeatMapPreview
                seats={previewSeats}
                rowsCount={selectedSeatMap.rows_count}
                colsCount={selectedSeatMap.cols_count}
                bezeichnung={selectedSeatMap.bezeichnung}
              />
            </div>
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => onSelectSeatMap(selectedSeatMap)}
                className="btn btn-primary w-full"
              >
                <Edit2 className="w-4 h-4" />
                {t('actions.openInEditor')}
              </button>
            </div>
          </div>
        )}
      </div>

      {showTemplates && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowTemplates(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-white rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">{t('templates.title')}</h2>
              <p className="text-sm text-slate-500">{t('templates.subtitle')}</p>
            </div>
            <div className="max-h-96 overflow-auto p-4">
              <div className="grid gap-3">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      onCreateFromTemplate(template);
                      setShowTemplates(false);
                    }}
                    className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Grid3X3 className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{template.bezeichnung}</p>
                      <p className="text-sm text-slate-500">
                        {t('card.rowsCols', { rows: template.rows_count, cols: template.cols_count })}
                      </p>
                    </div>
                    <span className={`badge ${
                      template.art === 'BUS' ? 'badge-info' : 'badge-neutral'
                    }`}>
                      {template.art}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowTemplates(false)}
                className="btn btn-secondary"
              >
                {t('common:actions.cancel')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
