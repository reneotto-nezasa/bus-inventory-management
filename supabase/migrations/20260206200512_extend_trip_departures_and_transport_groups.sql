/*
  # Extend Trip Management with Departures and Transport Groups

  1. New Tables
    - `trip_departures` (Termin)
      - Stores multiple departure dates for each trip
      - Each departure owns services independently
      - Fields: id, trip_id, start_date, end_date, code, booking_deadline, status_hin, status_rueck
    
    - `transport_groups` (Gruppeneinteilung)
      - Named route groups that bundle bus services
      - Linked to specific trip departures
      - Fields: id, trip_departure_id, label, sort_order
    
    - `transport_group_members`
      - Junction table linking transport groups to bus transports (n:m relationship)
      - A bus can serve multiple groups
      - Fields: id, transport_group_id, bus_transport_id
      - Unique constraint on (transport_group_id, bus_transport_id)
    
    - `tour_guide_assignments`
      - Tour guide information per trip departure
      - Fields: id, trip_departure_id, name, first_name, gender, code

  2. Extended Tables
    - `bus_transports`
      - Add trip_departure_id (FK to trip_departures, nullable for migration)
      - Add unterart (varchar, default 'BUS') - values: BUS, PKW
      - Add hinweis_stamm (text, nullable) - internal notes
      - Add transfer_cost_category_id (FK to transfer_cost_categories, nullable)

  3. Security
    - Enable RLS on all new tables
    - Add permissive policies for authenticated and anonymous users

  4. Indexes
    - Performance indexes on all foreign keys
    - Index on sort_order for efficient ordering
*/

-- Create trip_departures table
CREATE TABLE IF NOT EXISTS trip_departures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  code varchar(50),
  booking_deadline date,
  status_hin varchar(50) DEFAULT 'Frei',
  status_rueck varchar(50) DEFAULT 'Frei',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transport_groups table
CREATE TABLE IF NOT EXISTS transport_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_departure_id uuid NOT NULL REFERENCES trip_departures(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create transport_group_members junction table
CREATE TABLE IF NOT EXISTS transport_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transport_group_id uuid NOT NULL REFERENCES transport_groups(id) ON DELETE CASCADE,
  bus_transport_id uuid NOT NULL REFERENCES bus_transports(id) ON DELETE CASCADE,
  UNIQUE(transport_group_id, bus_transport_id)
);

-- Create tour_guide_assignments table
CREATE TABLE IF NOT EXISTS tour_guide_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_departure_id uuid NOT NULL REFERENCES trip_departures(id) ON DELETE CASCADE,
  name varchar(100),
  first_name varchar(100),
  gender varchar(20),
  code varchar(50),
  created_at timestamptz DEFAULT now()
);

-- Extend bus_transports table with new columns
DO $$
BEGIN
  -- Add trip_departure_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bus_transports' AND column_name = 'trip_departure_id'
  ) THEN
    ALTER TABLE bus_transports ADD COLUMN trip_departure_id uuid REFERENCES trip_departures(id) ON DELETE CASCADE;
  END IF;

  -- Add unterart with default 'BUS'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bus_transports' AND column_name = 'unterart'
  ) THEN
    ALTER TABLE bus_transports ADD COLUMN unterart varchar(20) DEFAULT 'BUS';
  END IF;

  -- Add hinweis_stamm for internal notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bus_transports' AND column_name = 'hinweis_stamm'
  ) THEN
    ALTER TABLE bus_transports ADD COLUMN hinweis_stamm text;
  END IF;

  -- Add transfer_cost_category_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bus_transports' AND column_name = 'transfer_cost_category_id'
  ) THEN
    ALTER TABLE bus_transports ADD COLUMN transfer_cost_category_id uuid REFERENCES transfer_cost_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_departures_trip_id ON trip_departures(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_departures_start_date ON trip_departures(start_date);
CREATE INDEX IF NOT EXISTS idx_transport_groups_trip_departure_id ON transport_groups(trip_departure_id);
CREATE INDEX IF NOT EXISTS idx_transport_groups_sort_order ON transport_groups(sort_order);
CREATE INDEX IF NOT EXISTS idx_transport_group_members_group_id ON transport_group_members(transport_group_id);
CREATE INDEX IF NOT EXISTS idx_transport_group_members_transport_id ON transport_group_members(bus_transport_id);
CREATE INDEX IF NOT EXISTS idx_tour_guide_assignments_trip_departure_id ON tour_guide_assignments(trip_departure_id);
CREATE INDEX IF NOT EXISTS idx_bus_transports_trip_departure_id ON bus_transports(trip_departure_id);
CREATE INDEX IF NOT EXISTS idx_bus_transports_transfer_cost_category_id ON bus_transports(transfer_cost_category_id);

-- Enable Row Level Security
ALTER TABLE trip_departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_guide_assignments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for trip_departures
CREATE POLICY "Allow all operations on trip_departures for authenticated users"
  ON trip_departures FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on trip_departures for anon users"
  ON trip_departures FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for transport_groups
CREATE POLICY "Allow all operations on transport_groups for authenticated users"
  ON transport_groups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on transport_groups for anon users"
  ON transport_groups FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for transport_group_members
CREATE POLICY "Allow all operations on transport_group_members for authenticated users"
  ON transport_group_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on transport_group_members for anon users"
  ON transport_group_members FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for tour_guide_assignments
CREATE POLICY "Allow all operations on tour_guide_assignments for authenticated users"
  ON tour_guide_assignments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on tour_guide_assignments for anon users"
  ON tour_guide_assignments FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);