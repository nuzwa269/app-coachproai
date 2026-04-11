-- ============================================================
--  CoachPro AI — Enforce credit_purchases relationships
--  Migration: 007_enforce_credit_purchase_relationships.sql
--
--  Ensures foreign keys are present/correct for relational queries.
--  Includes orphan cleanup to allow FK validation in production.
-- ============================================================

-- ============================================================
--  CLEANUP: remove orphan rows that would block FK validation
-- ============================================================
WITH deleted_orphan_users AS (
  DELETE FROM public.credit_purchases cp
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = cp.user_id
  )
  RETURNING cp.id
),
deleted_orphan_packs AS (
  DELETE FROM public.credit_purchases cp
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.credit_packs pk
    WHERE pk.id = cp.pack_id
  )
  RETURNING cp.id
)
SELECT
  (SELECT COUNT(*) FROM deleted_orphan_users) AS deleted_user_orphans,
  (SELECT COUNT(*) FROM deleted_orphan_packs) AS deleted_pack_orphans;

-- ============================================================
--  FK: credit_purchases.user_id -> profiles.id (ON DELETE CASCADE)
-- ============================================================
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Drop any incorrect FK bound to user_id.
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t
      ON t.oid = c.conrelid
    JOIN pg_namespace n
      ON n.oid = t.relnamespace
    JOIN pg_attribute a
      ON a.attrelid = t.oid
     AND a.attnum = ANY (c.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'credit_purchases'
      AND c.contype = 'f'
      AND a.attname = 'user_id'
      AND pg_get_constraintdef(c.oid) NOT LIKE 'FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE%'
  LOOP
    EXECUTE format('ALTER TABLE public.credit_purchases DROP CONSTRAINT %I', constraint_name);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t
      ON t.oid = c.conrelid
    JOIN pg_namespace n
      ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'credit_purchases'
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) LIKE 'FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE%'
  ) THEN
    ALTER TABLE public.credit_purchases
      ADD CONSTRAINT credit_purchases_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE
      NOT VALID;

    ALTER TABLE public.credit_purchases
      VALIDATE CONSTRAINT credit_purchases_user_id_fkey;
  END IF;
END $$;

-- ============================================================
--  FK: credit_purchases.pack_id -> credit_packs.id
-- ============================================================
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Drop any incorrect FK bound to pack_id.
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t
      ON t.oid = c.conrelid
    JOIN pg_namespace n
      ON n.oid = t.relnamespace
    JOIN pg_attribute a
      ON a.attrelid = t.oid
     AND a.attnum = ANY (c.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'credit_purchases'
      AND c.contype = 'f'
      AND a.attname = 'pack_id'
      AND pg_get_constraintdef(c.oid) NOT LIKE 'FOREIGN KEY (pack_id) REFERENCES public.credit_packs(id)%'
  LOOP
    EXECUTE format('ALTER TABLE public.credit_purchases DROP CONSTRAINT %I', constraint_name);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t
      ON t.oid = c.conrelid
    JOIN pg_namespace n
      ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'credit_purchases'
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) LIKE 'FOREIGN KEY (pack_id) REFERENCES public.credit_packs(id)%'
  ) THEN
    ALTER TABLE public.credit_purchases
      ADD CONSTRAINT credit_purchases_pack_id_fkey
      FOREIGN KEY (pack_id)
      REFERENCES public.credit_packs(id)
      NOT VALID;

    ALTER TABLE public.credit_purchases
      VALIDATE CONSTRAINT credit_purchases_pack_id_fkey;
  END IF;
END $$;

-- ============================================================
--  Helpful index for pack-based joins/filters
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_credit_purchases_pack_id
  ON public.credit_purchases (pack_id);
