import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Trash2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { SeatGrid } from './SeatGrid';
import { SeatTypeSelector } from './SeatTypeSelector';
import { PropertiesPanel } from './PropertiesPanel';
import type { SeatMap, Seat, SeatType, SeatStatus } from '../../types';

interface SeatMapEditorProps {
  seatMap: SeatMap | null;
  seats: Seat[];
  onUpdateSeatMap: (updates: Partial<SeatMap>) => void;
  onChangeSeatType: (row: number, col: number, type: SeatType, label?: string) => void;
  onChangeSeatStatus: (row: number, col: number, status: SeatStatus) => void;
  onUpdateSeat: (row: number, col: number, updates: Partial<Seat>) => void;
  onSave: () => void;
  onDelete: () => void;
  onBack: () => void;
}

function generateSeatLabel(row: number, col: number): string {
  const seatRow = Math.floor(row / 2) + 1;
  const letters = ['D', 'C', '', 'B', 'A'];
  const letter = letters[col] || String.fromCharCode(65 + col);
  if (!letter) return '';
  return `${seatRow}${letter}`;
}

export function SeatMapEditor({
  seatMap,
  seats,
  onUpdateSeatMap,
  onChangeSeatType,
  onChangeSeatStatus,
  onUpdateSeat,
  onSave,
  onDelete,
  onBack,
}: SeatMapEditorProps) {
  const { t } = useTranslation(['seatmaps', 'common']);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showProperties, setShowProperties] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  const selectedSeat = selectedCell
    ? seats.find((s) => s.row_index === selectedCell.row && s.col_index === selectedCell.col) || null
    : null;

  const handleSeatClick = useCallback((row: number, col: number, event?: React.MouseEvent) => {
    setSelectedCell({ row, col });

    if (event) {
      setSelectorPosition({ x: event.clientX, y: event.clientY });
      setSelectorOpen(true);
    }
  }, []);

  const handleTypeSelect = useCallback((type: SeatType) => {
    if (!selectedCell || !seatMap) return;

    const label = type.startsWith('sitzplatz')
      ? generateSeatLabel(selectedCell.row, selectedCell.col)
      : '';

    onChangeSeatType(selectedCell.row, selectedCell.col, type, label);
    setSelectorOpen(false);
  }, [selectedCell, seatMap, onChangeSeatType]);

  const handleStatusChange = useCallback((status: SeatStatus) => {
    if (!selectedCell) return;
    onChangeSeatStatus(selectedCell.row, selectedCell.col, status);
    setSelectorOpen(false);
  }, [selectedCell, onChangeSeatStatus]);

  const handleSeatUpdate = useCallback((updates: Partial<Seat>) => {
    if (!selectedCell) return;
    onUpdateSeat(selectedCell.row, selectedCell.col, updates);
  }, [selectedCell, onUpdateSeat]);

  const cellSize = seatMap ? Math.round(32 * zoom) : 32;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoom(1);

  if (!seatMap) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-500">
          <p className="mb-4">{t('editor.noSeatMap')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="btn btn-ghost p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <input
                type="text"
                value={seatMap.bezeichnung}
                onChange={(e) => onUpdateSeatMap({ bezeichnung: e.target.value })}
                className="text-xl font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded px-2 -ml-2"
              />
              <p className="text-sm text-slate-500 ml-0.5">
                {seatMap.art} - {seatMap.rows_count} {t('common:units.rows')} x {seatMap.cols_count} {t('common:units.columns')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mr-2">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-white rounded transition-colors"
                title={t('editor.zoomOut')}
              >
                <ZoomOut className="w-4 h-4 text-slate-600" />
              </button>
              <span className="px-2 text-sm text-slate-600 min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-white rounded transition-colors"
                title={t('editor.zoomIn')}
              >
                <ZoomIn className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={handleZoomReset}
                className="p-2 hover:bg-white rounded transition-colors"
                title={t('editor.resetZoom')}
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <button
              onClick={onDelete}
              className="btn btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common:actions.delete')}</span>
            </button>
            <button onClick={onSave} className="btn btn-primary">
              <Save className="w-4 h-4" />
              <span>{t('common:actions.save')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div
          ref={gridRef}
          className="flex-1 overflow-auto p-8 scrollbar-thin"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCell(null);
              setSelectorOpen(false);
            }
          }}
        >
          <div className="flex justify-center">
            <SeatGrid
              seats={seats}
              rowsCount={seatMap.rows_count}
              colsCount={seatMap.cols_count}
              selectedSeat={selectedCell}
              onSeatClick={(row, col) => {
                const rect = gridRef.current?.getBoundingClientRect();
                const cellX = (rect?.left || 0) + col * cellSize + cellSize;
                const cellY = (rect?.top || 0) + row * cellSize + cellSize;
                handleSeatClick(row, col, { clientX: cellX, clientY: cellY } as React.MouseEvent);
              }}
              cellSize={cellSize}
              bezeichnung={seatMap.bezeichnung}
            />
          </div>
        </div>

        {showProperties && (
          <PropertiesPanel
            selectedSeat={selectedSeat}
            onUpdate={handleSeatUpdate}
            onClose={() => setShowProperties(false)}
          />
        )}

        {!showProperties && (
          <button
            onClick={() => setShowProperties(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-secondary shadow-lg"
          >
            {t('properties.title')}
          </button>
        )}
      </div>

      <SeatTypeSelector
        isOpen={selectorOpen}
        position={selectorPosition}
        onSelect={handleTypeSelect}
        onStatusChange={handleStatusChange}
        onClose={() => setSelectorOpen(false)}
        currentType={selectedSeat?.seat_type}
        currentStatus={selectedSeat?.status}
      />
    </div>
  );
}
