/*
  # Trip Configuration Extensions - Tags, Status, and Booking Deadline

  1. New Tables
    - `trip_tags`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, foreign key to trips)
      - `dimension` (text) - Category of the tag (trip_type, category, region, etc.)
      - `value` (text) - The actual tag value
      - `created_at` (timestamp)
      - UNIQUE constraint on (trip_id, dimension, value)

  2. Schema Changes
    - Extend `trip_departures` table:
      - `status_hin` (text) - Outbound status (Frei, W, Anfrage)
      - `status_rueck` (text) - Return status (Frei, W, Anfrage)
      - `buchung_bis_datum` (date) - Booking deadline

  3. Security
    - Enable RLS on trip_tags table
    - Add policies for authenticated users to manage trip tags
*/

-- Create trip_tags table
CREATE TABLE IF NOT EXISTS trip_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  dimension text NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_trip_tag UNIQUE (trip_id, dimension, value)
);

-- Add status and booking deadline columns to trip_departures
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_departures' AND column_name = 'status_hin'
  ) THEN
    ALTER TABLE trip_departures ADD COLUMN status_hin text DEFAULT 'Frei' CHECK (status_hin IN ('Frei', 'W', 'Anfrage'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_departures' AND column_name = 'status_rueck'
  ) THEN
    ALTER TABLE trip_departures ADD COLUMN status_rueck text DEFAULT 'Frei' CHECK (status_rueck IN ('Frei', 'W', 'Anfrage'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_departures' AND column_name = 'buchung_bis_datum'
  ) THEN
    ALTER TABLE trip_departures ADD COLUMN buchung_bis_datum date;
  END IF;
END $$;

-- Enable RLS on trip_tags
ALTER TABLE trip_tags ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view trip tags
CREATE POLICY "Authenticated users can view trip tags"
  ON trip_tags FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert trip tags
CREATE POLICY "Authenticated users can insert trip tags"
  ON trip_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to delete trip tags
CREATE POLICY "Authenticated users can delete trip tags"
  ON trip_tags FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trip_tags_trip_id ON trip_tags(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_tags_dimension ON trip_tags(dimension);
