/*
  # Add Boarding Point Surcharges System

  1. New Tables
    - `boarding_point_surcharges`
      - Stores surcharge amounts per boarding point and transfer cost category
      - Fields: id, boarding_point_id, transfer_cost_category_id, amount, created_at, updated_at
      - Unique constraint on (boarding_point_id, transfer_cost_category_id)

  2. Extended Tables
    - `boarding_point_assignments`
      - Add surcharge_amount (DECIMAL) - resolved surcharge for this assignment

  3. Security
    - Enable RLS on boarding_point_surcharges
    - Add permissive policies for authenticated and anonymous users

  4. Indexes
    - Performance indexes on foreign keys
    - Unique index on boarding_point_id + transfer_cost_category_id combination
*/

-- Create boarding_point_surcharges table
CREATE TABLE IF NOT EXISTS boarding_point_surcharges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boarding_point_id uuid NOT NULL REFERENCES boarding_points(id) ON DELETE CASCADE,
  transfer_cost_category_id uuid NOT NULL REFERENCES transfer_cost_categories(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(boarding_point_id, transfer_cost_category_id)
);

-- Extend boarding_point_assignments table with surcharge_amount
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boarding_point_assignments' AND column_name = 'surcharge_amount'
  ) THEN
    ALTER TABLE boarding_point_assignments ADD COLUMN surcharge_amount DECIMAL(10,2);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_boarding_point_surcharges_boarding_point_id ON boarding_point_surcharges(boarding_point_id);
CREATE INDEX IF NOT EXISTS idx_boarding_point_surcharges_transfer_cost_category_id ON boarding_point_surcharges(transfer_cost_category_id);

-- Enable Row Level Security
ALTER TABLE boarding_point_surcharges ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for boarding_point_surcharges
CREATE POLICY "Allow all operations on boarding_point_surcharges for authenticated users"
  ON boarding_point_surcharges FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on boarding_point_surcharges for anon users"
  ON boarding_point_surcharges FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);