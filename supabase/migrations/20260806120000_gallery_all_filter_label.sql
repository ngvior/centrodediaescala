-- Gallery catch-all filter label: the setting behind the public gallery's
-- "Todas" chip.
--
-- HAND-RUN. This project has no supabase/config.toml and does not use the
-- Supabase CLI migration runner. Apply this file yourself in the SQL editor or
-- through psql. The filename follows the CLI's `YYYYMMDDHHMMSS_name.sql` format
-- so the files keep lexicographic order and `supabase migration repair` can
-- adopt the history later without renaming anything.
--
-- IDEMPOTENT. `DO NOTHING`, not `DO UPDATE`: once the row exists, this file must
-- never touch its value again. The label is admin-editable from Configuración,
-- and a re-run that overwrote it would silently undo the client's edit.
--
-- ADDITIVE. Nothing here is deleted or rewritten. In particular
-- `gallery_filter_labels` KEEPS its row and its current value: the code stops
-- reading it, which is a separate thing from removing it.
--
-- ORDER. Apply this migration BEFORE deploying the code. The public page
-- tolerates a missing row — the setting is registered as not required and the
-- code falls back to "Todas" — but the ADMIN side does not: `updateSiteSetting`
-- is a bare `UPDATE ... WHERE setting_key = $1`, and Postgres reports no error
-- for an UPDATE that matched zero rows. Without this row, the new Configuración
-- control would report a successful save and store nothing.
--
-- No structure changes here, so `supabase/schema.sql` is deliberately NOT
-- touched: that file is structure only. The matching fixture row lives in
-- `supabase/seed.sql`, which is the fixture source for a fresh environment.

INSERT INTO public.site_settings (setting_group, setting_key, setting_value, setting_type, description)
VALUES ('GALERIA', 'gallery_all_filter_label', 'Todas', 'TEXT',
        'Texto del filtro que muestra todas las fotos de la galería.')
ON CONFLICT (setting_key) DO NOTHING;
