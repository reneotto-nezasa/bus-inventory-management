/*
  # Boarding Point Refinements & Seat Plan Management

  ## Changes Made
  
  ### 1. Boarding Point Assignments - Schedule Support (C3)
    - `pickup_time` - Optional pickup time for each boarding point (HH:MM format)
    - `pickup_note` - Optional note for the boarding point pickup
  
  ### 2. Boarding Points Master Data (C4)
    - `postal_code` - Postal code for enriched display format
    - `street_address` - Street address for detailed location info
    - `description` - Additional descriptive information
  
  ### 3. Seat Assignments - Passenger Preferences (D4)
    - `preference_text` - Free text describing passenger preference
    - `preference_type` - Category: position, companion, accessibility, other
  
  ### 4. Seats - Blocking Support (D2)
    - `is_blocked` - Flag to mark seat as blocked/unavailable
    - `block_reason` - Optional reason for blocking the seat
  
  ### 5. Bus Transports - Seat Plan Assignment (D3)
    - `seat_map_id` - Reference to assigned seat map from library
    - `seat_plan_note` - Optional note about seat plan assignment
  
  ## Security
    - All existing RLS policies remain in effect
*/

-- Boarding Point Assignments: Add schedule fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boarding_point_assignments' AND column_name = 'pickup_time'
  ) THEN
    ALTER TABLE boarding_point_assignments ADD COLUMN pickup_time TIME DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boarding_point_assignments' AND column_name = 'pickup_note'
  ) THEN
    ALTER TABLE boarding_point_assignments ADD COLUMN pickup_note TEXT DEFAULT NULL;
  END IF;
END $$;

-- Boarding Points: Add master data enrichment fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boarding_points' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE boarding_points ADD COLUMN postal_code VARCHAR(10) DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boarding_points' AND column_name = 'street_address'
  ) THEN
    ALTER TABLE boarding_points ADD COLUMN street_address TEXT DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boarding_points' AND column_name = 'description'
  ) THEN
    ALTER TABLE boarding_points ADD COLUMN description TEXT DEFAULT NULL;
  END IF;
END $$;

-- Seat Assignments: Add preference fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seat_assignments' AND column_name = 'preference_text'
  ) THEN
    ALTER TABLE seat_assignments ADD COLUMN preference_text TEXT DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seat_assignments' AND column_name = 'preference_type'
  ) THEN
    ALTER TABLE seat_assignments ADD COLUMN preference_type VARCHAR(50) DEFAULT NULL;
  END IF;
END $$;

-- Seats: Add blocking fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seats' AND column_name = 'is_blocked'
  ) THEN
    ALTER TABLE seats ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seats' AND column_name = 'block_reason'
  ) THEN
    ALTER TABLE seats ADD COLUMN block_reason VARCHAR(100) DEFAULT NULL;
  END IF;
END $$;

-- Bus Transports: Add seat plan assignment fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bus_transports' AND column_name = 'seat_map_id'
  ) THEN
    ALTER TABLE bus_transports ADD COLUMN seat_map_id UUID REFERENCES seat_maps(id) DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bus_transports' AND column_name = 'seat_plan_note'
  ) THEN
    ALTER TABLE bus_transports ADD COLUMN seat_plan_note TEXT DEFAULT NULL;
  END IF;
END $$;