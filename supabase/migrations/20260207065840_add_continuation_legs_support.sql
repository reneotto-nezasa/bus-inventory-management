/*
  # Add Continuation Legs Support to Bus Transports

  1. Schema Changes
    - Extend `bus_transports` table:
      - `parent_transport_id` (uuid, nullable) - References parent transport for continuation legs
      - Self-referencing foreign key to support transport chains

  2. Notes
    - Continuation legs (Weiterfahrt) inherit the seat plan from their parent transport
    - Multiple continuation legs can be added to a single outbound transport
    - Return transports (RUECK) should not have continuation legs
*/

-- Add parent_transport_id column to bus_transports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bus_transports' AND column_name = 'parent_transport_id'
  ) THEN
    ALTER TABLE bus_transports ADD COLUMN parent_transport_id uuid REFERENCES bus_transports(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for faster lookups of continuation legs
CREATE INDEX IF NOT EXISTS idx_bus_transports_parent_id ON bus_transports(parent_transport_id);
