ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference text,
  ADD COLUMN IF NOT EXISTS user_role text,
  ADD COLUMN IF NOT EXISTS team_size text,
  ADD COLUMN IF NOT EXISTS building text,
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_theme_preference_check
  CHECK (theme_preference IS NULL OR theme_preference IN ('dark', 'light'));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_building_length_check
  CHECK (building IS NULL OR char_length(building) <= 500);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_role_length_check
  CHECK (user_role IS NULL OR char_length(user_role) <= 60);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_team_size_length_check
  CHECK (team_size IS NULL OR char_length(team_size) <= 40);