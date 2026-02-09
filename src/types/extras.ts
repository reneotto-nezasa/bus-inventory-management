export type ExtraType = 'excursion' | 'dining' | 'insurance';

export type ExtraStatus = 'Frei' | 'Anfrage' | 'Ausgebucht';

export type DiscountType = 'flat' | 'percent';

export interface TripExtra {
  id: string;
  trip_departure_id: string;
  type: ExtraType;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  date: string | null;
  status: ExtraStatus;
  is_included: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EarlyBirdDiscount {
  id: string;
  trip_departure_id: string;
  travel_date_from: string | null;
  travel_date_to: string | null;
  booking_deadline: string;
  discount_value: number;
  discount_type: DiscountType;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripExtraFormData {
  type: ExtraType;
  name: string;
  description: string;
  price: number;
  currency: string;
  date: string;
  status: ExtraStatus;
  is_included: boolean;
  sort_order: number;
}

export interface EarlyBirdDiscountFormData {
  travel_date_from: string;
  travel_date_to: string;
  booking_deadline: string;
  discount_value: number;
  discount_type: DiscountType;
  description: string;
}

export const EXTRA_TYPES: { value: ExtraType; label: string }[] = [
  { value: 'excursion', label: 'Excursion' },
  { value: 'dining', label: 'Dining' },
  { value: 'insurance', label: 'Insurance' },
];

export const EXTRA_STATUSES: { value: ExtraStatus; label: string }[] = [
  { value: 'Frei', label: 'Available' },
  { value: 'Anfrage', label: 'On Request' },
  { value: 'Ausgebucht', label: 'Sold Out' },
];

export const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
  { value: 'flat', label: 'Fixed Amount' },
  { value: 'percent', label: 'Percentage' },
];
