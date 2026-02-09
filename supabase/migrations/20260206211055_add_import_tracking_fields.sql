/*
  # Add Import Tracking Fields

  1. Changes to boarding_points
    - Add `idbuspro` column for BusPro ID matching during imports
    - Add `needs_enrichment` flag for placeholder records

  2. Changes to hotel_partners
    - Add `needs_enrichment` flag for placeholder records

  3. Purpose
    - Enable matching and updating records during data imports
    - Track placeholder records that need manual enrichment
    - Support incremental data migration from BusPro system
*/

-- Add import tracking fields to boarding_points
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boarding_points' AND column_name = 'idbuspro'
  ) THEN
    ALTER TABLE boarding_points ADD COLUMN idbuspro TEXT;
    CREATE INDEX IF NOT EXISTS idx_boarding_points_idbuspro ON boarding_points(idbuspro);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boarding_points' AND column_name = 'needs_enrichment'
  ) THEN
    ALTER TABLE boarding_points ADD COLUMN needs_enrichment BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add needs_enrichment flag to hotel_partners
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hotel_partners' AND column_name = 'needs_enrichment'
  ) THEN
    ALTER TABLE hotel_partners ADD COLUMN needs_enrichment BOOLEAN DEFAULT false;
  END IF;
END $$;
