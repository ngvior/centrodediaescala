-- Gallery category administration: the marker column that lets a category
-- reactivation restore exactly what its deactivation hid, and the database-level
-- guard against a blank category name.
--
-- HAND-RUN. This project has no supabase/config.toml and does not use the
-- Supabase CLI migration runner. Apply this file yourself in the SQL editor or
-- through psql. The filename follows the CLI's `YYYYMMDDHHMMSS_name.sql` format
-- so the files keep lexicographic order and `supabase migration repair` can
-- adopt the history later without renaming anything.
--
-- IDEMPOTENT. `ADD COLUMN IF NOT EXISTS` plus a `pg_constraint` guard, so a
-- re-run is a no-op. Nothing here deletes, rewrites, or backfills any row.
--
-- ORDER. Apply this migration BEFORE deploying the code, and unlike the
-- catch-all-label migration this one is strict: the admin gallery read names
-- `hidden_by_category` in its select list, so code deployed against a database
-- without the column makes `/admin/galeria` fail on every load.
--
-- The matching structure lives in `supabase/schema.sql` (which bootstraps a
-- fresh environment); the fixture that exercises restore lives in
-- `supabase/seed.sql`.

-- NOT NULL with a DEFAULT is safe on a populated table here: since Postgres 11
-- a non-volatile default is stored in the catalogue instead of rewriting every
-- row, so this takes a brief ACCESS EXCLUSIVE lock and returns immediately.
--
-- false is the correct backfill value by construction. The marker means "this
-- photo was hidden by its category being deactivated"; no cascade has ever run,
-- so no existing row was.
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS hidden_by_category BOOLEAN NOT NULL DEFAULT false;

-- Postgres has no ADD CONSTRAINT IF NOT EXISTS, hence the guard.
--
-- Declared ONCE, not twice. The declare-twice idiom governs columns, where
-- `ADD COLUMN IF NOT EXISTS` exists; an inline column CHECK inside CREATE TABLE
-- would take an auto-generated name that this `conname` probe could never
-- match, so the guard would add a second, duplicate constraint on every fresh
-- environment. Exact precedent: `gallery_items_dimensions_positive`.
--
-- The write action rejects a blank name too, but `service_role` writes to this
-- table directly, so the rule belongs in the schema as well.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'gallery_categories_name_not_blank'
      AND conrelid = 'public.gallery_categories'::regclass
  ) THEN
    ALTER TABLE public.gallery_categories
      ADD CONSTRAINT gallery_categories_name_not_blank CHECK (btrim(name) <> '');
  END IF;
END $$;
