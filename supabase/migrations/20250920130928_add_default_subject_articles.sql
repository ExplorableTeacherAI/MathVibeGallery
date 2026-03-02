-- Add default value 'mathematics' to subject field in articles table
ALTER TABLE public.articles 
ALTER COLUMN subject SET DEFAULT 'mathematics';