/*
  # Create Extras and Discounts Schema

  1. New Tables
    - `trip_extras`
      - Stores optional extras for trip departures (excursions, dining, insurance)
      - Fields: id, trip_departure_id, type, name, description, price, currency
      - Date, status (Frei/Anfrage/Ausgebucht), is_included flag
      - sort_order for display ordering
      - Types: excursion, dining, insurance
    
    - `early_bird_discounts`
      - Stores early booking discount configurations per trip departure
      - Fields: id, trip_departure_id, travel_date_from, travel_date_to
      - booking_deadline, discount_value, discount_type (flat/percent)
      - description, timestamps

  2. Table Alterations
    - Extend `bus_transports` with discount support flags:
      - fruehbucher (early bird eligible)
      - altersermaessigung (age discount eligible)

  3. Security
    - Enable RLS on new tables
    - Add permissive policies for authenticated and anonymous users

  4. Indexes
    - Performance indexes on foreign keys and type fields

  5. Notes
    - Supports multiple extra types: excursions, dining, insurance
    - Status values: Frei (Available), Anfrage (On Request), Ausgebucht (Sold Out)
    - Discount types: flat (fixed amount), percent (percentage)
    - Early bird discounts can have date ranges for travel period
*/

-- Create trip_extras table
CREATE TABLE IF NOT EXISTS trip_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_departure_id uuid NOT NULL REFERENCES trip_departures(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('excursion', 'dining', 'insurance')),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  date DATE,
  status TEXT DEFAULT 'Frei' CHECK (status IN ('Frei', 'Anfrage', 'Ausgebucht')),
  is_included BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create early_bird_discounts table
CREATE TABLE IF NOT EXISTS early_bird_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_departure_id uuid NOT NULL REFERENCES trip_departures(id) ON DELETE CASCADE,
  travel_date_from DATE,
  travel_date_to DATE,
  booking_deadline DATE NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  discount_type TEXT DEFAULT 'flat' CHECK (discount_type IN ('flat', 'percent')),
  description TEXT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Extend bus_transports table with discount flags
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bus_transports' AND column_name = 'fruehbucher'
  ) THEN
    ALTER TABLE bus_transports ADD COLUMN fruehbucher BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bus_transports' AND column_name = 'altersermaessigung'
  ) THEN
    ALTER TABLE bus_transports ADD COLUMN altersermaessigung BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_extras_trip_departure_id ON trip_extras(trip_departure_id);
CREATE INDEX IF NOT EXISTS idx_trip_extras_type ON trip_extras(type);
CREATE INDEX IF NOT EXISTS idx_trip_extras_status ON trip_extras(status);
CREATE INDEX IF NOT EXISTS idx_early_bird_discounts_trip_departure_id ON early_bird_discounts(trip_departure_id);
CREATE INDEX IF NOT EXISTS idx_early_bird_discounts_booking_deadline ON early_bird_discounts(booking_deadline);

-- Enable Row Level Security
ALTER TABLE trip_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_bird_discounts ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for trip_extras
CREATE POLICY "Allow all operations on trip_extras for authenticated users"
  ON trip_extras FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on trip_extras for anon users"
  ON trip_extras FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for early_bird_discounts
CREATE POLICY "Allow all operations on early_bird_discounts for authenticated users"
  ON early_bird_discounts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on early_bird_discounts for anon users"
  ON early_bird_discounts FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);