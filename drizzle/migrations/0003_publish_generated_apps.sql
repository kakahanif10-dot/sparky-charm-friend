ALTER TABLE public.generated_apps
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS generated_apps_slug_key ON public.generated_apps (slug) WHERE slug IS NOT NULL;

-- Published apps are readable by anyone so they can be served at a public URL.
DROP POLICY IF EXISTS "Published apps are publicly readable" ON public.generated_apps;
CREATE POLICY "Published apps are publicly readable"
ON public.generated_apps
FOR SELECT
TO anon, authenticated
USING (published = true);

DROP POLICY IF EXISTS "Files of published apps are publicly readable" ON public.generated_app_files;
CREATE POLICY "Files of published apps are publicly readable"
ON public.generated_app_files
FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.generated_apps a
  WHERE a.id = generated_app_files.app_id AND a.published = true
));

GRANT SELECT ON public.generated_apps TO anon;
GRANT SELECT ON public.generated_app_files TO anon;