-- Refactor images table to relate to articles and use proper tag relationships
-- This migration modifies the images table to:
-- 1. Add foreign key relationship to articles table
-- 2. Remove the tags TEXT[] column 
-- 3. Create a junction table for images-tags many-to-many relationship
-- 4. Remove redundant title column (since images will be related to articles)

-- Step 1: Add article_id foreign key to images table
ALTER TABLE public.images 
ADD COLUMN article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE;

-- Step 2: Create junction table for images-tags many-to-many relationship
CREATE TABLE public.image_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(image_id, tag_id)
);

-- Enable Row Level Security for image_tags
ALTER TABLE public.image_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for image_tags table
CREATE POLICY "Anyone can view image_tags" 
ON public.image_tags 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create image_tags" 
ON public.image_tags 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update image_tags" 
ON public.image_tags 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete image_tags" 
ON public.image_tags 
FOR DELETE 
USING (true);

-- Add indexes for better performance
CREATE INDEX idx_image_tags_image_id ON public.image_tags(image_id);
CREATE INDEX idx_image_tags_tag_id ON public.image_tags(tag_id);

-- Step 3: Remove the old tags column and its index
DROP INDEX IF EXISTS idx_images_tags;
ALTER TABLE public.images DROP COLUMN IF EXISTS tags;

-- Step 4: Remove the title column since images will be related to articles
-- (Articles already have titles, so image titles become redundant)
ALTER TABLE public.images DROP COLUMN IF EXISTS title;

-- Step 5: Add index for the new article_id foreign key
CREATE INDEX idx_images_article_id ON public.images(article_id);

-- Step 6: Add constraint to ensure article_id is not null for new records
-- (We'll allow existing records to have null article_id for backward compatibility)
-- ALTER TABLE public.images ALTER COLUMN article_id SET NOT NULL;
-- Commented out to allow gradual migration - uncomment if you want to enforce this constraint