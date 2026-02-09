export interface TransferCostCategory {
  id: string;
  name: string;
  amount: number;
  sort_order: number;
}

export interface BoardingPointSurcharge {
  id: string;
  boarding_point_id: string;
  transfer_cost_category_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
  boarding_point?: BoardingPoint;
  transfer_cost_category?: TransferCostCategory;
}

export interface BoardingPoint {
  id: string;
  idbuspro: string | null;
  ort: string;
  stelle: string;
  plz: string;
  art: 'BUS' | 'SCHIFF';
  code: string;
  status: 'freigegeben' | 'gesperrt';
  transfer_cost_category_id: string | null;
  postal_code: string | null;
  street_address: string | null;
  description: string | null;
  needs_enrichment?: boolean;
  transfer_cost_category?: TransferCostCategory | null;
  boarding_point_surcharges?: BoardingPointSurcharge[];
}

export interface BoardingPointAssignment {
  id: string;
  bus_transport_id: string;
  boarding_point_id: string;
  zeit: string | null;
  is_active: boolean;
  surcharge_amount: number | null;
  pickup_time: string | null;
  pickup_note: string | null;
  direction?: 'outbound' | 'return';
  boarding_point?: BoardingPoint;
}
