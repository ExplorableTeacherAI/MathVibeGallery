-- Add color field to categories table

-- Add color column to categories table (if it doesn't exist)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color TEXT;

-- Add a default color for existing categories (optional)
UPDATE public.categories SET color = '#6366f1' WHERE color IS NULL;

-- Add index for better performance on color queries (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_categories_color ON public.categories(color);