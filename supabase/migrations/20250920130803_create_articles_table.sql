-- Create a table for storing articles
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  year INTEGER NOT NULL,
  subject TEXT NOT NULL,
  subject_area TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view articles" 
ON public.articles 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create articles" 
ON public.articles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update articles" 
ON public.articles 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete articles" 
ON public.articles 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_articles_title ON public.articles(title);
CREATE INDEX idx_articles_year ON public.articles(year);
CREATE INDEX idx_articles_subject ON public.articles(subject);
CREATE INDEX idx_articles_subject_area ON public.articles(subject_area);

-- Add constraint to ensure year is reasonable (e.g., between 1900 and current year + 10)
ALTER TABLE public.articles ADD CONSTRAINT check_year_range 
CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10);