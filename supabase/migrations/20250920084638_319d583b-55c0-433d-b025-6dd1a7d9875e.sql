-- Create a table for storing images with metadata
CREATE TABLE public.images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a gallery app)
CREATE POLICY "Anyone can view images" 
ON public.images 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create images" 
ON public.images 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update images" 
ON public.images 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete images" 
ON public.images 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_images_updated_at
BEFORE UPDATE ON public.images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance on tags
CREATE INDEX idx_images_tags ON public.images USING GIN(tags);