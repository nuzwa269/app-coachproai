-- ============================================================
--  CoachPro AI — Credit Pack Monetization
--  Migration: 002_credit_packs.sql
--
--  Run this in the Supabase SQL Editor after 001_initial_schema.sql.
-- ============================================================


-- ============================================================
--  UPDATE profiles: replace Stripe/plan columns with credits
-- ============================================================

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS plan,
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS ai_messages_used,
  DROP COLUMN IF EXISTS ai_messages_limit;

ALTER TABLE public.profiles
  ADD COLUMN ai_credits_balance INTEGER NOT NULL DEFAULT 50;

COMMENT ON COLUMN public.profiles.ai_credits_balance IS
  'Current AI credit balance. 50 free starter credits on signup.';


-- ============================================================
--  TABLE: credit_packs
--  Catalog of purchasable credit packs (managed by admin).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_packs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  credits    INTEGER     NOT NULL,
  price_pkr  INTEGER     NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.credit_packs IS
  'Purchasable AI credit packs shown on the Buy Credits page.';

-- Seed default packs
INSERT INTO public.credit_packs (name, credits, price_pkr) VALUES
  ('Starter Pack',  100, 500),
  ('Popular Pack',  200, 900),
  ('Mega Pack',     500, 2000);


-- ============================================================
--  TABLE: credit_purchases
--  Records user payment requests for credit packs.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  pack_id         UUID        NOT NULL REFERENCES public.credit_packs (id),
  credits         INTEGER     NOT NULL,
  amount_pkr      INTEGER     NOT NULL,
  method          TEXT        NOT NULL
                              CHECK (method IN ('jazzcash', 'easypaisa', 'bank_transfer', 'whatsapp')),
  transaction_ref TEXT        NOT NULL,
  screenshot_url  TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);

COMMENT ON TABLE public.credit_purchases IS
  'User payment requests for credit packs. Admin approves/rejects to add credits.';


-- ============================================================
--  TABLE: credit_ledger
--  Immutable audit trail of every credit change.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  change        INTEGER     NOT NULL,
  reason        TEXT        NOT NULL,
  balance_after INTEGER     NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.credit_ledger IS
  'Audit trail: every credit addition (purchase) and deduction (ai_message).';


-- ============================================================
--  INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user   ON public.credit_purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON public.credit_purchases (status);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user      ON public.credit_ledger    (user_id);


-- ============================================================
--  RLS — credit_packs (public catalog, read by any auth user)
-- ============================================================
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_packs: select for authenticated"
  ON public.credit_packs FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================
--  RLS — credit_purchases
-- ============================================================
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_purchases: insert own"
  ON public.credit_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "credit_purchases: select own"
  ON public.credit_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
--  RLS — credit_ledger
-- ============================================================
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_ledger: select own"
  ON public.credit_ledger FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
--  RPC: deduct_credit
--  Atomically deducts 1 credit. Returns new balance or -1.
-- ============================================================
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE public.profiles
  SET ai_credits_balance = ai_credits_balance - 1
  WHERE id = p_user_id AND ai_credits_balance > 0
  RETURNING ai_credits_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RETURN -1;
  END IF;

  INSERT INTO public.credit_ledger (user_id, change, reason, balance_after)
  VALUES (p_user_id, -1, 'ai_message', new_balance);

  RETURN new_balance;
END;
$$;


-- ============================================================
--  RPC: add_credits
--  Adds credits to a user's balance (called by admin approval).
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE public.profiles
  SET ai_credits_balance = ai_credits_balance + p_amount
  WHERE id = p_user_id
  RETURNING ai_credits_balance INTO new_balance;

  INSERT INTO public.credit_ledger (user_id, change, reason, balance_after)
  VALUES (p_user_id, p_amount, 'purchase', new_balance);

  RETURN new_balance;
END;
$$;
