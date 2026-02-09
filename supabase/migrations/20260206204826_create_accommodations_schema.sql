/*
  # Create Accommodations Schema

  1. New Tables
    - `hotel_partners`
      - Stores hotel partner information with BusPro ID reference
      - Fields: id, idbuspro (unique), name, city, address, timestamps
    
    - `accommodations`
      - Stores accommodation options for trip departures
      - Fields: id, trip_departure_id, code, name, description, room_type, price, currency
      - Occupancy: belegung_min, belegung_max
      - Meal plan, dates (checkin_date, checkout_date, nights)
      - Status (Frei/Anfrage), is_composite flag
      - Ship-specific: deck_name, amenities
      - sort_order for display ordering
    
    - `composite_accommodation_hotels`
      - Stores hotel components for composite accommodations (e.g., Vor-/Nachprogramm)
      - Fields: id, accommodation_id, hotel_partner_id, hotel_name (denormalized)
      - Dates: checkin_date, checkout_date, nights
      - meal_plan, sort_order

  2. Security
    - Enable RLS on all tables
    - Add permissive policies for authenticated and anonymous users

  3. Indexes
    - Performance indexes on foreign keys and lookup fields
    - Unique constraint on hotel_partners.idbuspro

  4. Notes
    - Supports both simple and composite accommodations
    - Flexible schema for bus trips, ship cruises, and combined programs
    - Room types: DZ, EZ, Suite, Zweibettkabine, Alleinbenutzung
    - Meal plans: VP, UEF, LP (Vollpension, Übernachtung mit Frühstück, Laut Programm)
    - Status values: Frei (Available), Anfrage (On Request)
*/

-- Create hotel_partners table
CREATE TABLE IF NOT EXISTS hotel_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idbuspro TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  address TEXT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create accommodations table
CREATE TABLE IF NOT EXISTS accommodations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_departure_id uuid NOT NULL REFERENCES trip_departures(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  belegung_min INT DEFAULT 1,
  belegung_max INT DEFAULT 2,
  meal_plan TEXT,
  checkin_date DATE,
  checkout_date DATE,
  nights INT,
  status TEXT DEFAULT 'Frei' CHECK (status IN ('Frei', 'Anfrage')),
  is_composite BOOLEAN DEFAULT false,
  deck_name TEXT,
  amenities TEXT,
  sort_order INT DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create composite_accommodation_hotels table
CREATE TABLE IF NOT EXISTS composite_accommodation_hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id uuid NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  hotel_partner_id TEXT NOT NULL,
  hotel_name TEXT,
  checkin_date DATE,
  checkout_date DATE,
  nights INT,
  meal_plan TEXT,
  sort_order INT DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hotel_partners_idbuspro ON hotel_partners(idbuspro);
CREATE INDEX IF NOT EXISTS idx_accommodations_trip_departure_id ON accommodations(trip_departure_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_deck_name ON accommodations(deck_name);
CREATE INDEX IF NOT EXISTS idx_accommodations_status ON accommodations(status);
CREATE INDEX IF NOT EXISTS idx_accommodations_room_type ON accommodations(room_type);
CREATE INDEX IF NOT EXISTS idx_composite_accommodation_hotels_accommodation_id ON composite_accommodation_hotels(accommodation_id);

-- Enable Row Level Security
ALTER TABLE hotel_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE composite_accommodation_hotels ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for hotel_partners
CREATE POLICY "Allow all operations on hotel_partners for authenticated users"
  ON hotel_partners FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on hotel_partners for anon users"
  ON hotel_partners FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for accommodations
CREATE POLICY "Allow all operations on accommodations for authenticated users"
  ON accommodations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on accommodations for anon users"
  ON accommodations FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for composite_accommodation_hotels
CREATE POLICY "Allow all operations on composite_accommodation_hotels for authenticated users"
  ON composite_accommodation_hotels FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on composite_accommodation_hotels for anon users"
  ON composite_accommodation_hotels FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);