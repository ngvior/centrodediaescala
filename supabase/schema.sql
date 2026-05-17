-- Escala Supabase schema: structure, grants, RLS and RPC only.
-- Fixture data lives in supabase/seed.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT professionals_identity_key UNIQUE (first_name, last_name, role)
);

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  schedule_info TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  event_date TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.interview_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_name TEXT NOT NULL,
  patient_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONTACTED', 'CONFIRMED', 'REJECTED')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_group TEXT NOT NULL,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'TEXT' CHECK (setting_type IN ('TEXT', 'IMAGE_URL', 'LINK', 'RICHTEXT', 'JSON')),
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.home_objectives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.interview_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT interview_rate_limits_ip_window_key UNIQUE (ip_hash, window_start)
);

CREATE INDEX IF NOT EXISTS professionals_active_order_idx ON public.professionals (is_active, order_index);
CREATE INDEX IF NOT EXISTS activities_active_order_idx ON public.activities (is_active, order_index);
CREATE INDEX IF NOT EXISTS events_published_created_idx ON public.events (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS interview_requests_status_created_idx ON public.interview_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS site_settings_key_idx ON public.site_settings (setting_key);
CREATE INDEX IF NOT EXISTS home_objectives_active_order_idx ON public.home_objectives (is_active, order_index);
CREATE INDEX IF NOT EXISTS gallery_items_active_order_idx ON public.gallery_items (is_active, order_index);
CREATE INDEX IF NOT EXISTS interview_rate_limits_ip_window_idx ON public.interview_rate_limits (ip_hash, window_start DESC);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth write access for professionals" ON public.professionals;
DROP POLICY IF EXISTS "Public read access for professionals" ON public.professionals;
CREATE POLICY "Public read access for professionals"
  ON public.professionals FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Auth write access for activities" ON public.activities;
DROP POLICY IF EXISTS "Public read access for activities" ON public.activities;
CREATE POLICY "Public read access for activities"
  ON public.activities FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Auth write access for events" ON public.events;
DROP POLICY IF EXISTS "Public read access for events" ON public.events;
CREATE POLICY "Public read access for events"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "Auth write access for site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public read access for site_settings" ON public.site_settings;
CREATE POLICY "Public read access for site_settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read access for home_objectives" ON public.home_objectives;
CREATE POLICY "Public read access for home_objectives"
  ON public.home_objectives FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Public read access for gallery_items" ON public.gallery_items;
CREATE POLICY "Public read access for gallery_items"
  ON public.gallery_items FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- No anon/authenticated policies are defined for interview_requests or
-- interview_rate_limits. Browser/Data API inserts are denied by missing grants
-- and by RLS; future Server Actions write with the server-only service role.
DROP POLICY IF EXISTS "Public insert access for interview_requests" ON public.interview_requests;
DROP POLICY IF EXISTS "Auth read/write access for interview_requests" ON public.interview_requests;
DROP POLICY IF EXISTS "Auth update access for interview_requests" ON public.interview_requests;
DROP POLICY IF EXISTS "Auth delete access for interview_requests" ON public.interview_requests;

REVOKE ALL ON TABLE public.professionals FROM anon, authenticated;
REVOKE ALL ON TABLE public.activities FROM anon, authenticated;
REVOKE ALL ON TABLE public.events FROM anon, authenticated;
REVOKE ALL ON TABLE public.site_settings FROM anon, authenticated;
REVOKE ALL ON TABLE public.home_objectives FROM anon, authenticated;
REVOKE ALL ON TABLE public.gallery_items FROM anon, authenticated;
REVOKE ALL ON TABLE public.interview_requests FROM anon, authenticated;
REVOKE ALL ON TABLE public.interview_rate_limits FROM anon, authenticated;

GRANT SELECT ON TABLE public.professionals TO anon, authenticated;
GRANT SELECT ON TABLE public.activities TO anon, authenticated;
GRANT SELECT ON TABLE public.events TO anon, authenticated;
GRANT SELECT ON TABLE public.site_settings TO anon, authenticated;
GRANT SELECT ON TABLE public.home_objectives TO anon, authenticated;
GRANT SELECT ON TABLE public.gallery_items TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.professionals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.activities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.site_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.home_objectives TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.gallery_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.interview_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.interview_rate_limits TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

CREATE OR REPLACE FUNCTION public.increment_interview_rate_limit(
  p_ip_hash TEXT,
  p_window_start TIMESTAMP WITH TIME ZONE,
  p_max_requests INTEGER
)
RETURNS TABLE (allowed BOOLEAN, request_count INTEGER)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_count INTEGER;
BEGIN
  IF p_ip_hash IS NULL OR length(trim(p_ip_hash)) = 0 THEN
    RAISE EXCEPTION 'ip_hash is required';
  END IF;

  IF p_max_requests IS NULL OR p_max_requests < 1 THEN
    RAISE EXCEPTION 'p_max_requests must be greater than 0';
  END IF;

  INSERT INTO public.interview_rate_limits (ip_hash, window_start, request_count)
  VALUES (p_ip_hash, p_window_start, 1)
  ON CONFLICT (ip_hash, window_start)
  DO UPDATE SET
    request_count = public.interview_rate_limits.request_count + 1,
    updated_at = timezone('utc'::text, now())
  RETURNING public.interview_rate_limits.request_count INTO next_count;

  RETURN QUERY SELECT next_count <= p_max_requests, next_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_interview_rate_limit(TEXT, TIMESTAMP WITH TIME ZONE, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_interview_rate_limit(TEXT, TIMESTAMP WITH TIME ZONE, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_interview_rate_limit(TEXT, TIMESTAMP WITH TIME ZONE, INTEGER) TO service_role;
