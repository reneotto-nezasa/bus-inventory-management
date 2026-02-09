import { SeatCell } from './SeatCell';
import type { Seat } from '../../types';

interface SeatGridProps {
  seats: Seat[];
  rowsCount: number;
  colsCount: number;
  selectedSeat: { row: number; col: number } | null;
  onSeatClick: (row: number, col: number) => void;
  cellSize: number;
  bezeichnung: string;
}

export function SeatGrid({
  seats,
  rowsCount,
  colsCount,
  selectedSeat,
  onSeatClick,
  cellSize,
}: SeatGridProps) {
  const getSeat = (row: number, col: number): Seat | null => {
    return seats.find((s) => s.row_index === row && s.col_index === col) || null;
  };

  return (
    <div className="inline-block">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
        <div className="bg-slate-800 rounded-t-xl h-8 mb-2 flex items-center justify-center">
          <span className="text-xs text-slate-400 font-medium">FRONT</span>
        </div>
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${colsCount}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rowsCount}, ${cellSize}px)`,
          }}
        >
          {Array.from({ length: rowsCount }).map((_, rowIndex) =>
            Array.from({ length: colsCount }).map((_, colIndex) => {
              const seat = getSeat(rowIndex, colIndex);
              const isSelected =
                selectedSeat?.row === rowIndex && selectedSeat?.col === colIndex;

              return (
                <SeatCell
                  key={`${rowIndex}-${colIndex}`}
                  seat={seat}
                  rowIndex={rowIndex}
                  colIndex={colIndex}
                  isSelected={isSelected}
                  onClick={() => onSeatClick(rowIndex, colIndex)}
                  cellSize={cellSize}
                />
              );
            })
          )}
        </div>
        <div className="bg-slate-200 rounded-b-lg h-6 mt-2 flex items-center justify-center">
          <span className="text-xs text-slate-500 font-medium">REAR</span>
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-teal-500" />
          <span className="text-xs text-slate-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-xs text-slate-600">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-xs text-slate-600">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-300" />
          <span className="text-xs text-slate-600">Facility</span>
        </div>
      </div>
    </div>
  );
}
