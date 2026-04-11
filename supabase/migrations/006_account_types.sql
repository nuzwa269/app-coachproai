-- ============================================================
--  CoachPro AI — Account Type Foundation
--  Migration: 006_account_types.sql
--
--  Adds a dedicated account_type model while keeping legacy role-based
--  subscriber data backward-compatible.
-- ============================================================

-- ============================================================
--  ENUM: account_type
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'account_type'
  ) THEN
    CREATE TYPE public.account_type AS ENUM (
      'free',
      'subscriber'
    );
  END IF;
END $$;

COMMENT ON TYPE public.account_type IS
  'Commercial account type. free uses limited starter credits, subscriber is paid credit buyer.';


-- ============================================================
--  COLUMN: profiles.account_type
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'account_type'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN account_type public.account_type NOT NULL DEFAULT 'free';
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.account_type IS
  'Account commercial type. Separate from RBAC role.';


-- ============================================================
--  BACKFILL: preserve legacy subscriber-role behavior
-- ============================================================
UPDATE public.profiles
SET account_type = 'subscriber'
WHERE role = 'subscriber'
  AND account_type <> 'subscriber';


-- ============================================================
--  INDEX: profiles(account_type)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_account_type
  ON public.profiles (account_type);


-- ============================================================
--  HELPER FUNCTION: is_subscriber(user_id)
--  Uses account_type first, with legacy role fallback.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_subscriber(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND (
        account_type = 'subscriber'
        OR role = 'subscriber'
      )
  );
$$;

COMMENT ON FUNCTION public.is_subscriber IS
  'Returns true for paid subscriber accounts. Supports legacy role-based subscriber rows.';