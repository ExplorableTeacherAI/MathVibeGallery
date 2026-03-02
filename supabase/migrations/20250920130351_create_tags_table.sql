-- Create a table for storing tags with categories
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view tags" 
ON public.tags 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create tags" 
ON public.tags 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update tags" 
ON public.tags 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete tags" 
ON public.tags 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_tags_name ON public.tags(tag_name);
CREATE INDEX idx_tags_category ON public.tags(category);

-- Insert some sample tag categories
INSERT INTO public.tags (tag_name, category) VALUES
  ('Nature', 'General'),
  ('Portrait', 'Photography'),
  ('Landscape', 'Photography'),
  ('Architecture', 'Photography'),
  ('Street', 'Photography'),
  ('Abstract', 'Art'),
  ('Digital', 'Art'),
  ('Painting', 'Art'),
  ('Black & White', 'Style'),
  ('Color', 'Style'),
  ('Vintage', 'Style'),
  ('Modern', 'Style');