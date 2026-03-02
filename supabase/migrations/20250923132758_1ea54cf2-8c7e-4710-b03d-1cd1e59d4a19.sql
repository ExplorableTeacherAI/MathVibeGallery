-- Update RLS policies to require authentication for write operations
-- Keep read operations public as this appears to be a content gallery application

-- Articles table - Require auth for write operations
DROP POLICY IF EXISTS "Anyone can create articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can update articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can delete articles" ON public.articles;

CREATE POLICY "Authenticated users can create articles" 
ON public.articles 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles" 
ON public.articles 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete articles" 
ON public.articles 
FOR DELETE 
TO authenticated
USING (true);

-- Images table - Require auth for write operations
DROP POLICY IF EXISTS "Anyone can create images" ON public.images;
DROP POLICY IF EXISTS "Anyone can update images" ON public.images;
DROP POLICY IF EXISTS "Anyone can delete images" ON public.images;

CREATE POLICY "Authenticated users can create images" 
ON public.images 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update images" 
ON public.images 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete images" 
ON public.images 
FOR DELETE 
TO authenticated
USING (true);

-- Categories table - Require auth for write operations
DROP POLICY IF EXISTS "Anyone can create categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON public.categories;

CREATE POLICY "Authenticated users can create categories" 
ON public.categories 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories" 
ON public.categories 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete categories" 
ON public.categories 
FOR DELETE 
TO authenticated
USING (true);

-- Tags table - Require auth for write operations
DROP POLICY IF EXISTS "Anyone can create tags" ON public.tags;
DROP POLICY IF EXISTS "Anyone can update tags" ON public.tags;
DROP POLICY IF EXISTS "Anyone can delete tags" ON public.tags;

CREATE POLICY "Authenticated users can create tags" 
ON public.tags 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update tags" 
ON public.tags 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete tags" 
ON public.tags 
FOR DELETE 
TO authenticated
USING (true);

-- Subject Area table - Require auth for write operations
DROP POLICY IF EXISTS "Anyone can create subject_area" ON public.subject_area;
DROP POLICY IF EXISTS "Anyone can update subject_area" ON public.subject_area;
DROP POLICY IF EXISTS "Anyone can delete subject_area" ON public.subject_area;

CREATE POLICY "Authenticated users can create subject_area" 
ON public.subject_area 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update subject_area" 
ON public.subject_area 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete subject_area" 
ON public.subject_area 
FOR DELETE 
TO authenticated
USING (true);

-- Image Tags table - Require auth for write operations
DROP POLICY IF EXISTS "Anyone can create image_tags" ON public.image_tags;
DROP POLICY IF EXISTS "Anyone can update image_tags" ON public.image_tags;
DROP POLICY IF EXISTS "Anyone can delete image_tags" ON public.image_tags;

CREATE POLICY "Authenticated users can create image_tags" 
ON public.image_tags 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update image_tags" 
ON public.image_tags 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete image_tags" 
ON public.image_tags 
FOR DELETE 
TO authenticated
USING (true);