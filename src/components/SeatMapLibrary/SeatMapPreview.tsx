import type { Seat, SeatStatus } from '../../types';

interface SeatMapPreviewProps {
  seats: Seat[];
  rowsCount: number;
  colsCount: number;
  bezeichnung: string;
}

const STATUS_COLORS: Record<SeatStatus, string> = {
  available: 'bg-teal-500',
  booked: 'bg-emerald-500',
  blocked: 'bg-red-500',
};

export function SeatMapPreview({
  seats,
  rowsCount,
  colsCount,
  bezeichnung,
}: SeatMapPreviewProps) {
  const cellSize = 14;

  const getSeat = (row: number, col: number): Seat | null => {
    return seats.find((s) => s.row_index === row && s.col_index === col) || null;
  };

  return (
    <div className="flex flex-col items-center">
      <h4 className="text-sm font-semibold text-slate-700 mb-3 text-center">{bezeichnung}</h4>
      <div
        className="bg-white border border-slate-200 rounded-lg p-2 shadow-sm"
        style={{ borderRadius: '12px 12px 6px 6px' }}
      >
        <div className="bg-slate-700 rounded-t-lg h-4 mb-1 flex items-center justify-center">
          <span className="text-[8px] text-slate-400">FRONT</span>
        </div>
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${colsCount}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rowsCount}, ${cellSize}px)`,
          }}
        >
          {Array.from({ length: rowsCount }).map((_, rowIndex) =>
            Array.from({ length: colsCount }).map((_, colIndex) => {
              const seat = getSeat(rowIndex, colIndex);
              const isEmpty = !seat || seat.seat_type === 'empty';
              const isSeat = seat?.seat_type?.startsWith('sitzplatz');

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  style={{ width: cellSize, height: cellSize }}
                  className={`
                    rounded-sm text-[5px] flex items-center justify-center font-bold
                    ${isEmpty ? 'bg-slate-100' : ''}
                    ${isSeat ? `${STATUS_COLORS[seat.status]} text-white` : ''}
                    ${!isEmpty && !isSeat ? 'bg-slate-300' : ''}
                  `}
                >
                  {isSeat && seat.label && (
                    <span>{seat.label}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="bg-slate-200 rounded-b-md h-3 mt-1" />
      </div>
    </div>
  );
}
