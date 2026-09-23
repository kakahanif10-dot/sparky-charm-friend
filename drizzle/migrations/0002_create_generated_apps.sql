CREATE TABLE public.generated_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled app',
  description text,
  prompt text NOT NULL DEFAULT '',
  entry text NOT NULL DEFAULT 'index.html',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.generated_app_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.generated_apps(id) ON DELETE CASCADE,
  path text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_id, path)
);

CREATE INDEX generated_apps_user_idx ON public.generated_apps (user_id, updated_at DESC);
CREATE INDEX generated_app_files_app_idx ON public.generated_app_files (app_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_apps TO authenticated;
GRANT ALL ON public.generated_apps TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_app_files TO authenticated;
GRANT ALL ON public.generated_app_files TO service_role;

ALTER TABLE public.generated_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_app_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own apps" ON public.generated_apps
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own app files" ON public.generated_app_files
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.generated_apps a WHERE a.id = app_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.generated_apps a WHERE a.id = app_id AND a.user_id = auth.uid()));