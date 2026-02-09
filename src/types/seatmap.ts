export type SeatType =
  | 'empty'
  | 'sitzplatz'
  | 'sitzplatz_rueckwaerts'
  | 'sitzplatz_gang'
  | 'sitzplatz_fenster'
  | 'tisch'
  | 'wc'
  | 'kueche'
  | 'fahrer'
  | 'reiseleiter'
  | 'einstieg'
  | 'holm'
  | 'aufgang'
  | 'abgang';

export type SeatStatus = 'available' | 'booked' | 'blocked';

export interface Seat {
  id: string;
  seat_map_id: string;
  row_index: number;
  col_index: number;
  seat_type: SeatType;
  label: string;
  status: SeatStatus;
  block: string;
  reihe: number | null;
  platz: string;
  passenger_name: string | null;
  booking_ref: string | null;
  is_blocked: boolean;
  block_reason: string | null;
  seat_assignment?: SeatAssignment;
}

export interface SeatAssignment {
  id: string;
  seat_id: string;
  bus_transport_id: string;
  passenger_name: string;
  booking_reference: string | null;
  accommodation_type: string | null;
  passenger_email: string | null;
  passenger_phone: string | null;
  preferences: string | null;
  preference_text: string | null;
  preference_type: 'position' | 'companion' | 'accessibility' | 'other' | null;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  seat?: Seat;
}

export interface UnassignedPassenger {
  id: string;
  name: string;
  booking_reference: string | null;
  preferences?: string | null;
  preference_text?: string | null;
  preference_type?: 'position' | 'companion' | 'accessibility' | 'other' | null;
  accommodation_type?: string | null;
  passenger_email?: string | null;
  passenger_phone?: string | null;
}

export interface BulkAssignmentSuggestion {
  passenger_id: string;
  passenger_name: string;
  suggested_seat_id: string;
  suggested_seat_label: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  conflicts: string[];
}

export interface SeatOperation {
  id: string;
  type: 'assign' | 'free' | 'move' | 'block' | 'unblock' | 'bulk_assign';
  timestamp: string;
  seatId: string;
  seatLabel: string;
  passengerName?: string;
  fromSeatId?: string;
  fromSeatLabel?: string;
  toSeatId?: string;
  toSeatLabel?: string;
  blockReason?: string;
  bulkAssignments?: Array<{ seatId: string; seatLabel: string; passengerName: string }>;
}

export interface SeatMap {
  id: string;
  bezeichnung: string;
  art: 'BUS' | 'SCHIFF';
  orientierung: string;
  sitzplaetze_mit_reihenbezeichnung: boolean;
  zoomfaktor: number;
  rastergroesse: number;
  rows_count: number;
  cols_count: number;
  created_at: string;
  updated_at: string;
  seats?: Seat[];
}

export interface SeatTypeOption {
  value: SeatType;
  label: string;
  icon?: string;
}

export const SEAT_TYPE_OPTIONS: SeatTypeOption[] = [
  { value: 'empty', label: 'Löschen' },
  { value: 'sitzplatz', label: 'Sitzplatz' },
  { value: 'sitzplatz_rueckwaerts', label: 'Sitzplatz (Rückwärts)' },
  { value: 'sitzplatz_gang', label: 'Sitzplatz (zum Gang)' },
  { value: 'sitzplatz_fenster', label: 'Sitzplatz (zum Fenster)' },
  { value: 'tisch', label: 'Tisch' },
  { value: 'wc', label: 'WC' },
  { value: 'kueche', label: 'Küche' },
  { value: 'fahrer', label: 'Fahrer' },
  { value: 'reiseleiter', label: 'Reiseleiter' },
  { value: 'einstieg', label: 'Einstieg' },
  { value: 'holm', label: 'Holm' },
  { value: 'aufgang', label: 'Aufgang' },
  { value: 'abgang', label: 'Abgang' },
];

export const STATUS_COLORS: Record<SeatStatus, string> = {
  available: '#0000FF',
  booked: '#00FF00',
  blocked: '#FF0000',
};
