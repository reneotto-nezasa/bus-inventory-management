export type RoomType = 'DZ' | 'EZ' | 'Suite' | 'Zweibettkabine' | 'Alleinbenutzung';

export type MealPlan = 'VP' | 'UEF' | 'LP';

export type AccommodationStatus = 'Frei' | 'Anfrage';

export interface HotelPartner {
  id: string;
  idbuspro: string;
  name: string;
  city: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Accommodation {
  id: string;
  trip_departure_id: string;
  code: string | null;
  name: string;
  description: string | null;
  room_type: RoomType | null;
  price: number;
  currency: string;
  belegung_min: number;
  belegung_max: number;
  meal_plan: MealPlan | null;
  checkin_date: string | null;
  checkout_date: string | null;
  nights: number | null;
  status: AccommodationStatus;
  is_composite: boolean;
  deck_name: string | null;
  amenities: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  composite_hotels?: CompositeAccommodationHotel[];
}

export interface CompositeAccommodationHotel {
  id: string;
  accommodation_id: string;
  hotel_partner_id: string;
  hotel_name: string | null;
  checkin_date: string | null;
  checkout_date: string | null;
  nights: number | null;
  meal_plan: MealPlan | null;
  sort_order: number;
  created_at: string;
}

export interface AccommodationFormData {
  name: string;
  code: string;
  room_type: RoomType | '';
  price: number;
  currency: string;
  belegung_min: number;
  belegung_max: number;
  meal_plan: MealPlan | '';
  checkin_date: string;
  checkout_date: string;
  nights: number | null;
  status: AccommodationStatus;
  is_composite: boolean;
  deck_name: string;
  amenities: string;
  description: string;
  sort_order: number;
  composite_hotels: CompositeHotelFormData[];
}

export interface CompositeHotelFormData {
  hotel_partner_id: string;
  hotel_name: string;
  checkin_date: string;
  checkout_date: string;
  nights: number | null;
  meal_plan: MealPlan | '';
  sort_order: number;
}

export const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'DZ', label: 'Doppelzimmer' },
  { value: 'EZ', label: 'Einzelzimmer' },
  { value: 'Suite', label: 'Suite' },
  { value: 'Zweibettkabine', label: 'Zweibettkabine' },
  { value: 'Alleinbenutzung', label: 'Alleinbenutzung' },
];

export const MEAL_PLANS: { value: MealPlan; label: string }[] = [
  { value: 'VP', label: 'Vollpension' },
  { value: 'UEF', label: 'Übernachtung mit Frühstück' },
  { value: 'LP', label: 'Laut Programm' },
];

export const DECK_NAMES = [
  'Smaragddeck',
  'Rubindeck',
  'Diamantdeck',
  'Hauptdeck',
  'Oberdeck',
  'Sonnendeck',
];
