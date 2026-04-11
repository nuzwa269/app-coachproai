-- ============================================================
--  CoachPro AI — Phase 1 Access, Roles & Account Types
--  Migration: 008_phase1_access_roles_account_types.sql
--
--  Goals:
--  - profiles.role effective values: user | admin | super_admin
--  - profiles.account_type values: free | subscriber
--  - safe defaults for existing and new users
--  - backward compatibility for legacy role='subscriber'
-- ============================================================

-- ============================================================
-- ENUM: account_type
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'account_type'
  ) THEN
    CREATE TYPE public.account_type AS ENUM ('free', 'subscriber');
  END IF;
END $$;

-- ============================================================
-- COLUMN: profiles.account_type
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'account_type'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN account_type public.account_type;
  END IF;
END $$;

-- ============================================================
-- COLUMN: profiles.role (create only if missing)
-- If missing, create with existing user_role enum when available.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'role'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) THEN
      ALTER TABLE public.profiles
        ADD COLUMN role public.user_role;
    ELSE
      CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'super_admin');
      ALTER TABLE public.profiles
        ADD COLUMN role public.user_role;
    END IF;
  END IF;
END $$;

-- ============================================================
-- DATA BACKFILL + NORMALIZATION
-- - Legacy role='subscriber' becomes:
--   role='user' + account_type='subscriber'
-- ============================================================
UPDATE public.profiles
SET account_type = 'subscriber'
WHERE role::text = 'subscriber'
  AND (account_type IS NULL OR account_type::text <> 'subscriber');

UPDATE public.profiles
SET role = 'user'
WHERE role::text = 'subscriber';

UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL;

UPDATE public.profiles
SET account_type = 'free'
WHERE account_type IS NULL;

-- ============================================================
-- DEFAULTS + NOT NULL
-- ============================================================
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'user',
  ALTER COLUMN account_type SET DEFAULT 'free';

ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN account_type SET NOT NULL;

-- ============================================================
-- CONSTRAINT: enforce effective Phase 1 role values
-- (keeps compatibility even if enum still contains legacy labels)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_phase1_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_phase1_check
      CHECK (role::text IN ('user', 'admin', 'super_admin'))
      NOT VALID;

    ALTER TABLE public.profiles
      VALIDATE CONSTRAINT profiles_role_phase1_check;
  END IF;
END $$;

-- ============================================================
-- GUARDRAIL TRIGGER: keep backward compatibility for legacy writes
-- - If legacy code sends role='subscriber', map to:
--   role='user' and account_type='subscriber'
-- - Prevent admin/super_admin from being subscriber account_type
-- ============================================================
CREATE OR REPLACE FUNCTION public.normalize_profile_access_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS NULL THEN
    NEW.role := 'user';
  END IF;

  IF NEW.account_type IS NULL THEN
    NEW.account_type := 'free';
  END IF;

  IF NEW.role::text = 'subscriber' THEN
    NEW.role := 'user';
    NEW.account_type := 'subscriber';
  END IF;

  IF NEW.role::text IN ('admin', 'super_admin') AND NEW.account_type::text = 'subscriber' THEN
    NEW.account_type := 'free';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_profiles_access_defaults'
  ) THEN
    CREATE TRIGGER set_profiles_access_defaults
      BEFORE INSERT OR UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_access_fields();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles (account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
