-- Create categories table and establish relationship with tags table

-- Step 1: Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to categories
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update categories" 
ON public.categories 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete categories" 
ON public.categories 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates on categories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_categories_name ON public.categories(name);

-- Step 2: Insert existing categories from tags table
INSERT INTO public.categories (name, description) 
SELECT DISTINCT 
  category as name,
  'Category for ' || category || ' related tags' as description
FROM public.tags 
WHERE category IS NOT NULL AND category != '';

-- Step 3: Add category_id column to tags table
ALTER TABLE public.tags ADD COLUMN category_id UUID;

-- Step 4: Update tags table to reference categories
UPDATE public.tags 
SET category_id = (
  SELECT c.id 
  FROM public.categories c 
  WHERE c.name = public.tags.category
);

-- Step 5: Add foreign key constraint
ALTER TABLE public.tags 
ADD CONSTRAINT fk_tags_category_id 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- Step 6: Add index on category_id for better performance
CREATE INDEX idx_tags_category_id ON public.tags(category_id);

-- Step 7: Remove the old category column (after data migration)
ALTER TABLE public.tags DROP COLUMN category;

-- Step 8: Make category_id NOT NULL (since all tags should have a category)
ALTER TABLE public.tags ALTER COLUMN category_id SET NOT NULL;

-- Update the foreign key constraint to CASCADE on delete for better data integrity
ALTER TABLE public.tags DROP CONSTRAINT fk_tags_category_id;
ALTER TABLE public.tags 
ADD CONSTRAINT fk_tags_category_id 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;