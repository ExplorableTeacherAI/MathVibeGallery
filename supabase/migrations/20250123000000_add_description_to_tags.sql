-- Add description column to tags table
-- This migration adds a description field to provide more context for each tag

-- Step 1: Add description column to tags table
ALTER TABLE public.tags ADD COLUMN description TEXT;

-- Step 2: Add a comment to the column for documentation
COMMENT ON COLUMN public.tags.description IS 'Optional description providing more context about the tag';

-- Step 3: Create an index on description for text search if needed in the future
-- (Optional - uncomment if you plan to search by description)
-- CREATE INDEX idx_tags_description ON public.tags USING GIN(to_tsvector('english', description));