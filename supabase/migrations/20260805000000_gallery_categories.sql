-- Gallery categories: relational category records for gallery_items.
--
-- HAND-RUN. This project has no supabase/config.toml and does not use the
-- Supabase CLI migration runner. Apply this file yourself in the SQL editor or
-- through psql. The filename follows the CLI's `YYYYMMDDHHMMSS_name.sql` format
-- so the files keep lexicographic order and `supabase migration repair` can
-- adopt the history later without renaming anything.
--
-- IDEMPOTENT. Every statement is guarded, so re-running the whole file is a
-- no-op. Run it twice against a scratch database before running it anywhere
-- that matters.
--
-- ADDITIVE. Nothing here deletes or rewrites a gallery item beyond setting the
-- new `category_id`, and nothing here touches Storage. Removing the test rows
-- and their `cms-images` objects is a separate hand-off file
-- (`openspec/changes/2026-08-05-gallery-categories-schema/handoff-cleanup.sql`)
-- and is NOT required for this migration to be correct.
--
-- ORDER. Apply this migration BEFORE deploying the code that reads
-- `category_id` and the embedded category. The reverse order 500s the public
-- gallery, because the new select names columns that do not exist yet. The
-- migration itself is safe to run at any time: the currently deployed code
-- ignores both new columns.
--
-- PRECHECK. The backfill below casts `gallery_filter_labels` to `jsonb`. Run
-- this first and confirm it returns exactly one row holding a JSON array. No
-- row means no categories are created (the INSERT selects nothing, which is
-- harmless); a malformed value fails the cast loudly, which is the intended
-- behaviour rather than silently inventing categories.
--
--   SELECT setting_key, setting_type, setting_value
--   FROM public.site_settings
--   WHERE setting_key = 'gallery_filter_labels';

CREATE TABLE IF NOT EXISTS public.gallery_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Uniqueness is case-insensitive and enforced here, not in application code, so
-- `deporte` cannot be added next to `Deporte`. This index MUST exist before the
-- backfill INSERT below: `ON CONFLICT (lower(name))` resolves against exactly
-- this index and errors without it.
CREATE UNIQUE INDEX IF NOT EXISTS gallery_categories_name_lower_key
  ON public.gallery_categories (lower(name));
CREATE INDEX IF NOT EXISTS gallery_categories_active_order_idx
  ON public.gallery_categories (is_active, order_index);

-- RESTRICT, not SET NULL or CASCADE: deleting a category that still has photos
-- is a mistake, and refusing it is more useful than silently unbinding them.
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.gallery_categories(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS gallery_items_category_id_idx
  ON public.gallery_items (category_id);

-- The legacy text stays and is still written on every create and update; it is
-- only allowed to be empty now that the binding carries the meaning. No-op once
-- the column is already nullable.
ALTER TABLE public.gallery_items ALTER COLUMN category DROP NOT NULL;

ALTER TABLE public.gallery_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for gallery_categories" ON public.gallery_categories;
CREATE POLICY "Public read access for gallery_categories"
  ON public.gallery_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

REVOKE ALL ON TABLE public.gallery_categories FROM anon, authenticated;
GRANT SELECT ON TABLE public.gallery_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.gallery_categories TO service_role;

-- Backfill: one category per configured filter label, in the order the setting
-- lists them.
--
-- The labels are read from the live setting rather than hardcoded, because
-- `gallery_filter_labels` is admin-editable and this file runs at an unknown
-- later date. Hardcoding the four names known today would reintroduce exactly
-- the string drift this change exists to remove.
--
-- Position 1 is the catch-all by component contract (`GallerySection` treats
-- `labels[0]` as "show everything"), so `ordinality > 1` skips it. The name
-- guard is deliberately redundant: it keeps the catch-all out even if someone
-- reorders the array. Gaps in `order_index` are harmless, the listing only
-- ever sorts by it.
INSERT INTO public.gallery_categories (name, order_index)
SELECT trim(label.value), (label.ordinality - 2)::int
FROM public.site_settings s,
     jsonb_array_elements_text(s.setting_value::jsonb)
       WITH ORDINALITY AS label(value, ordinality)
WHERE s.setting_key = 'gallery_filter_labels'
  AND label.ordinality > 1
  AND lower(trim(label.value)) <> 'todas'
  AND trim(label.value) <> ''
ON CONFLICT (lower(name)) DO NOTHING;

-- Bind existing photos by their legacy text, trimmed and case-insensitive.
-- An item whose text matches no category keeps `category_id` null, stays
-- readable, and still shows under the catch-all chip through the legacy-text
-- fallback. Already-bound rows are left alone, which is what makes a re-run a
-- no-op.
UPDATE public.gallery_items gi
SET category_id = gc.id
FROM public.gallery_categories gc
WHERE gi.category_id IS NULL
  AND gi.category IS NOT NULL
  AND lower(trim(gi.category)) = lower(trim(gc.name));
