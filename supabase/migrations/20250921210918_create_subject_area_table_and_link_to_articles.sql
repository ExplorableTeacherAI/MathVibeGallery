-- Create subject_area table
CREATE TABLE public.subject_area (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subject_area ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view subject_area" 
ON public.subject_area 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create subject_area" 
ON public.subject_area 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update subject_area" 
ON public.subject_area 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete subject_area" 
ON public.subject_area 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_subject_area_updated_at
BEFORE UPDATE ON public.subject_area
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_subject_area_name ON public.subject_area(name);

-- Insert existing subject areas from articles table
INSERT INTO public.subject_area (name)
SELECT DISTINCT subject_area 
FROM public.articles 
WHERE subject_area IS NOT NULL AND subject_area != ''
ON CONFLICT (name) DO NOTHING;

-- Add subject_area_id column to articles table
ALTER TABLE public.articles ADD COLUMN subject_area_id UUID;

-- Update articles table to reference subject_area table
UPDATE public.articles 
SET subject_area_id = sa.id 
FROM public.subject_area sa 
WHERE articles.subject_area = sa.name;

-- Add foreign key constraint
ALTER TABLE public.articles 
ADD CONSTRAINT fk_articles_subject_area 
FOREIGN KEY (subject_area_id) REFERENCES public.subject_area(id) ON DELETE SET NULL;

-- Add index for the foreign key
CREATE INDEX idx_articles_subject_area_id ON public.articles(subject_area_id);

-- Drop the old subject_area column (after data migration)
ALTER TABLE public.articles DROP COLUMN subject_area;

-- Drop the old index that was on the subject_area column
DROP INDEX IF EXISTS idx_articles_subject_area;