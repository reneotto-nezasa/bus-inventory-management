/*
  # Extend Tour Guide Assignments

  ## Changes Made
  
  ### 1. Tour Guide Assignments - Extended Fields
    - `gender` - Gender of tour guide (male, female, other)
    - `code` - Short code/abbreviation for tour guide
    - `phone` - Contact phone number
    - `email` - Contact email address
    - `assigned_seat_id` - Reference to specific seat assigned to tour guide
  
  ## Purpose
  These fields enable comprehensive tour guide management:
  - Full contact information for communication
  - Seat assignment integration with blocking
  - Gender tracking for proper addressing
  - Code/abbreviation for compact display
  
  ## Security
    - All existing RLS policies remain in effect
    - Foreign key constraint to seats table with proper cascading
*/

-- Tour Guide Assignments: Add extended fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tour_guide_assignments' AND column_name = 'gender'
  ) THEN
    ALTER TABLE tour_guide_assignments ADD COLUMN gender VARCHAR(10) DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tour_guide_assignments' AND column_name = 'code'
  ) THEN
    ALTER TABLE tour_guide_assignments ADD COLUMN code VARCHAR(20) DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tour_guide_assignments' AND column_name = 'phone'
  ) THEN
    ALTER TABLE tour_guide_assignments ADD COLUMN phone VARCHAR(50) DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tour_guide_assignments' AND column_name = 'email'
  ) THEN
    ALTER TABLE tour_guide_assignments ADD COLUMN email VARCHAR(255) DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tour_guide_assignments' AND column_name = 'assigned_seat_id'
  ) THEN
    ALTER TABLE tour_guide_assignments ADD COLUMN assigned_seat_id UUID REFERENCES seats(id) ON DELETE SET NULL DEFAULT NULL;
  END IF;
END $$;