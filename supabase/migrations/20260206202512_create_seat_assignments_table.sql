/*
  # Create Seat Assignments Table

  1. New Tables
    - `seat_assignments`
      - Stores passenger assignments to specific seats on bus transports
      - Fields: id, seat_id, bus_transport_id, passenger_name, booking_reference, preferences, assigned_at, created_at, updated_at
      - Unique constraint on (seat_id, bus_transport_id) - one passenger per seat per transport

  2. Security
    - Enable RLS on seat_assignments table
    - Add permissive policies for authenticated and anonymous users

  3. Indexes
    - Performance indexes on foreign keys
    - Unique index on seat_id + bus_transport_id combination

  4. Notes
    - Supports seat reassignment operations
    - Tracks passenger preferences as text field
    - Allows tracking booking references for audit trail
*/

-- Create seat_assignments table
CREATE TABLE IF NOT EXISTS seat_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id uuid NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  bus_transport_id uuid NOT NULL REFERENCES bus_transports(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  booking_reference TEXT,
  preferences TEXT,
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(seat_id, bus_transport_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seat_assignments_seat_id ON seat_assignments(seat_id);
CREATE INDEX IF NOT EXISTS idx_seat_assignments_bus_transport_id ON seat_assignments(bus_transport_id);
CREATE INDEX IF NOT EXISTS idx_seat_assignments_booking_reference ON seat_assignments(booking_reference);

-- Enable Row Level Security
ALTER TABLE seat_assignments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for seat_assignments
CREATE POLICY "Allow all operations on seat_assignments for authenticated users"
  ON seat_assignments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on seat_assignments for anon users"
  ON seat_assignments FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);