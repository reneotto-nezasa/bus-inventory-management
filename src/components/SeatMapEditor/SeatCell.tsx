import {
  User,
  Coffee,
  Bath,
  Utensils,
  CircleUser,
  DoorOpen,
  Minus,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import type { Seat, SeatType, SeatStatus } from '../../types';

interface SeatCellProps {
  seat: Seat | null;
  rowIndex: number;
  colIndex: number;
  isSelected: boolean;
  onClick: () => void;
  cellSize: number;
}

const TYPE_ICONS: Partial<Record<SeatType, React.ElementType>> = {
  fahrer: User,
  reiseleiter: CircleUser,
  wc: Bath,
  kueche: Utensils,
  tisch: Coffee,
  einstieg: DoorOpen,
  holm: Minus,
  aufgang: ArrowUp,
  abgang: ArrowDown,
};

const STATUS_BG_COLORS: Record<SeatStatus, string> = {
  available: 'bg-teal-500 hover:bg-teal-600',
  booked: 'bg-emerald-500 hover:bg-emerald-600',
  blocked: 'bg-red-500 hover:bg-red-600',
};

function isSeatType(type: SeatType): boolean {
  return type.startsWith('sitzplatz');
}

export function SeatCell({ seat, isSelected, onClick, cellSize }: SeatCellProps) {
  const isEmpty = !seat || seat.seat_type === 'empty';
  const Icon = seat ? TYPE_ICONS[seat.seat_type] : null;
  const showAsColoredSeat = seat && isSeatType(seat.seat_type);

  return (
    <button
      onClick={onClick}
      style={{ width: cellSize, height: cellSize }}
      className={`
        rounded-md cursor-pointer transition-all flex items-center justify-center text-xs font-medium
        ${isEmpty ? 'bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300' : ''}
        ${showAsColoredSeat ? `${STATUS_BG_COLORS[seat.status]} text-white shadow-sm` : ''}
        ${!isEmpty && !showAsColoredSeat ? 'bg-slate-300 hover:bg-slate-400 text-slate-600' : ''}
        ${isSelected ? 'ring-2 ring-amber-400 ring-offset-2' : ''}
      `}
    >
      {seat && seat.seat_type !== 'empty' && (
        <>
          {showAsColoredSeat ? (
            <span className="font-bold text-[10px]">{seat.label}</span>
          ) : Icon ? (
            <Icon className="w-4 h-4" />
          ) : (
            <span>{seat.seat_type.charAt(0).toUpperCase()}</span>
          )}
        </>
      )}
    </button>
  );
}
