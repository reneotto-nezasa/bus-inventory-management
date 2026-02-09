/*
  # Passenger Info for Seat Assignments

  ## Changes Made
  
  ### 1. Seat Assignments - Extended Passenger Information
    - `booking_reference` - Booking reference code (e.g., BK-2024-1234)
    - `accommodation_type` - Type of accommodation (e.g., "Rubindeck Zweibettkabine")
    - `passenger_email` - Contact email for the passenger
    - `passenger_phone` - Contact phone number for the passenger
  
  ## Purpose
  These fields enable detailed passenger tracking and support for:
  - Comprehensive passenger information display in seat reassignment views
  - Contact information for communication purposes
  - Accommodation type tracking for coordinated booking management
  
  ## Security
    - All existing RLS policies remain in effect
    - No new security concerns introduced
*/

-- Seat Assignments: Add extended passenger information fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seat_assignments' AND column_name = 'booking_reference'
  ) THEN
    ALTER TABLE seat_assignments ADD COLUMN booking_reference VARCHAR(50) DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seat_assignments' AND column_name = 'accommodation_type'
  ) THEN
    ALTER TABLE seat_assignments ADD COLUMN accommodation_type VARCHAR(100) DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seat_assignments' AND column_name = 'passenger_email'
  ) THEN
    ALTER TABLE seat_assignments ADD COLUMN passenger_email VARCHAR(255) DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seat_assignments' AND column_name = 'passenger_phone'
  ) THEN
    ALTER TABLE seat_assignments ADD COLUMN passenger_phone VARCHAR(50) DEFAULT NULL;
  END IF;
END $$;