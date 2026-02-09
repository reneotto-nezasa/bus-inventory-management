import type { SeatMap } from './seatmap';
import type { BoardingPointAssignment } from './boarding';

export interface TripTag {
  id: string;
  trip_id: string;
  dimension: string;
  value: string;
  created_at: string;
}

export interface TourGuideAssignment {
  id: string;
  trip_departure_id: string;
  name: string | null;
  first_name: string | null;
  gender: 'male' | 'female' | 'other' | null;
  code: string | null;
  phone: string | null;
  email: string | null;
  assigned_seat_id: string | null;
  created_at: string;
}

export interface TripDeparture {
  id: string;
  trip_id: string;
  start_date: string;
  end_date: string | null;
  code: string | null;
  buchung_bis_datum: string | null;
  status_hin: string;
  status_rueck: string;
  created_at: string;
  updated_at: string;
  tour_guide_assignments?: TourGuideAssignment[];
  transport_groups?: TransportGroup[];
}

export interface TransportGroup {
  id: string;
  trip_departure_id: string;
  label: string;
  sort_order: number;
  created_at: string;
  transport_group_members?: TransportGroupMember[];
}

export interface TransportGroupMember {
  id: string;
  transport_group_id: string;
  bus_transport_id: string;
  bus_transport?: BusTransport;
}

export interface BusTransport {
  id: string;
  trip_id: string;
  trip_departure_id: string | null;
  idbuspro: string | null;
  unterart: 'BUS' | 'PKW';
  termin: string;
  bis: string;
  richtung: 'HIN' | 'RUECK';
  sitzplan: boolean;
  status: string;
  text: string;
  preis: number;
  gruppe: string;
  seat_map_id: string | null;
  seat_plan_note: string | null;
  hinweis_stamm: string | null;
  transfer_cost_category_id: string | null;
  parent_transport_id: string | null;
  seat_map?: SeatMap | null;
  boarding_point_assignments?: BoardingPointAssignment[];
  continuation_legs?: BusTransport[];
}

export interface Trip {
  id: string;
  code: string;
  text: string;
  termin: string;
  bis: string;
  abpreis: number;
  status_hin: string;
  status_rueck: string;
  bus_transports?: BusTransport[];
  trip_departures?: TripDeparture[];
  trip_tags?: TripTag[];
}
