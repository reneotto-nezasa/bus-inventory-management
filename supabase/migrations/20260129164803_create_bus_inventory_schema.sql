/*
  # Bus Inventory Management Schema

  1. New Tables
    - `seat_maps` - Stores seat map configurations
      - `id` (uuid, primary key)
      - `bezeichnung` (text) - Name/designation of the seat map
      - `art` (text) - Type: BUS or SCHIFF
      - `orientierung` (text) - Orientation: 'Rechts -> Links' or 'Links -> Rechts'
      - `sitzplaetze_mit_reihenbezeichnung` (boolean) - Whether to show row labels
      - `zoomfaktor` (integer) - Zoom factor
      - `rastergroesse` (integer) - Grid size in pixels
      - `rows_count` (integer) - Number of rows
      - `cols_count` (integer) - Number of columns
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `seats` - Individual seat elements in a seat map
      - `id` (uuid, primary key)
      - `seat_map_id` (uuid, foreign key)
      - `row_index` (integer) - Row position in grid
      - `col_index` (integer) - Column position in grid
      - `seat_type` (text) - Type of element
      - `label` (text) - Display label (e.g., "1A", "12D")
      - `status` (text) - available, booked, blocked
      - `block` (text) - Block designation
      - `reihe` (integer) - Row number for labeling
      - `platz` (text) - Seat position letter
      - `passenger_name` (text) - Assigned passenger name
      - `booking_ref` (text) - Booking reference

    - `transfer_cost_categories` - Configurable transfer cost categories
      - `id` (uuid, primary key)
      - `name` (text) - Category name
      - `amount` (decimal) - Cost amount
      - `sort_order` (integer)

    - `boarding_points` - Boarding point locations
      - `id` (uuid, primary key)
      - `idbuspro` (text) - External ID
      - `ort` (text) - City name
      - `stelle` (text) - Stop location
      - `plz` (text) - Postal code
      - `art` (text) - Type: BUS or SCHIFF
      - `code` (text) - Short code
      - `status` (text) - freigegeben or gesperrt
      - `transfer_cost_category_id` (uuid, foreign key)

    - `trips` - Trip information
      - `id` (uuid, primary key)
      - `code` (text) - Trip code
      - `text` (text) - Trip name/description
      - `termin` (date) - Start date
      - `bis` (date) - End date
      - `abpreis` (decimal) - Base price
      - `status_hin` (text) - Outbound status
      - `status_rueck` (text) - Return status

    - `bus_transports` - Bus transport entries linked to trips
      - `id` (uuid, primary key)
      - `trip_id` (uuid, foreign key)
      - `idbuspro` (text) - External ID
      - `unterart` (text) - Subtype
      - `termin` (date) - Transport date
      - `bis` (date) - End date
      - `richtung` (text) - Direction: HIN or RUECK
      - `sitzplan` (boolean) - Has seat map
      - `status` (text)
      - `text` (text)
      - `preis` (decimal)
      - `gruppe` (text)
      - `seat_map_id` (uuid, foreign key)

    - `boarding_point_assignments` - Links boarding points to transports
      - `id` (uuid, primary key)
      - `bus_transport_id` (uuid, foreign key)
      - `boarding_point_id` (uuid, foreign key)
      - `zeit` (time) - Pickup time
      - `is_active` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create seat_maps table
CREATE TABLE IF NOT EXISTS seat_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bezeichnung text NOT NULL,
  art text NOT NULL DEFAULT 'BUS' CHECK (art IN ('BUS', 'SCHIFF')),
  orientierung text NOT NULL DEFAULT 'Rechts -> Links',
  sitzplaetze_mit_reihenbezeichnung boolean NOT NULL DEFAULT true,
  zoomfaktor integer NOT NULL DEFAULT 1,
  rastergroesse integer NOT NULL DEFAULT 30,
  rows_count integer NOT NULL DEFAULT 12,
  cols_count integer NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE seat_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on seat_maps"
  ON seat_maps
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create seats table
CREATE TABLE IF NOT EXISTS seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_map_id uuid NOT NULL REFERENCES seat_maps(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  col_index integer NOT NULL,
  seat_type text NOT NULL DEFAULT 'empty',
  label text DEFAULT '',
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  block text DEFAULT '',
  reihe integer,
  platz text DEFAULT '',
  passenger_name text,
  booking_ref text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(seat_map_id, row_index, col_index)
);

ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on seats"
  ON seats
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create transfer cost categories table
CREATE TABLE IF NOT EXISTS transfer_cost_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transfer_cost_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on transfer_cost_categories"
  ON transfer_cost_categories
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create boarding_points table
CREATE TABLE IF NOT EXISTS boarding_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idbuspro text,
  ort text NOT NULL,
  stelle text NOT NULL,
  plz text NOT NULL,
  art text NOT NULL DEFAULT 'BUS' CHECK (art IN ('BUS', 'SCHIFF')),
  code text NOT NULL,
  status text NOT NULL DEFAULT 'freigegeben' CHECK (status IN ('freigegeben', 'gesperrt')),
  transfer_cost_category_id uuid REFERENCES transfer_cost_categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE boarding_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on boarding_points"
  ON boarding_points
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  text text NOT NULL,
  termin date NOT NULL,
  bis date NOT NULL,
  abpreis decimal(10,2) NOT NULL DEFAULT 0,
  status_hin text NOT NULL DEFAULT 'Offen',
  status_rueck text NOT NULL DEFAULT 'Offen',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on trips"
  ON trips
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create bus_transports table
CREATE TABLE IF NOT EXISTS bus_transports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  idbuspro text,
  unterart text NOT NULL DEFAULT 'BUS',
  termin date NOT NULL,
  bis date NOT NULL,
  richtung text NOT NULL CHECK (richtung IN ('HIN', 'RUECK')),
  sitzplan boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Offen',
  text text NOT NULL,
  preis decimal(10,2) NOT NULL DEFAULT 0,
  gruppe text DEFAULT 'Busreise',
  seat_map_id uuid REFERENCES seat_maps(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bus_transports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on bus_transports"
  ON bus_transports
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create boarding_point_assignments table
CREATE TABLE IF NOT EXISTS boarding_point_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_transport_id uuid NOT NULL REFERENCES bus_transports(id) ON DELETE CASCADE,
  boarding_point_id uuid NOT NULL REFERENCES boarding_points(id) ON DELETE CASCADE,
  zeit time,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(bus_transport_id, boarding_point_id)
);

ALTER TABLE boarding_point_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on boarding_point_assignments"
  ON boarding_point_assignments
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seats_seat_map_id ON seats(seat_map_id);
CREATE INDEX IF NOT EXISTS idx_bus_transports_trip_id ON bus_transports(trip_id);
CREATE INDEX IF NOT EXISTS idx_bus_transports_seat_map_id ON bus_transports(seat_map_id);
CREATE INDEX IF NOT EXISTS idx_boarding_point_assignments_transport ON boarding_point_assignments(bus_transport_id);
CREATE INDEX IF NOT EXISTS idx_boarding_point_assignments_point ON boarding_point_assignments(boarding_point_id);