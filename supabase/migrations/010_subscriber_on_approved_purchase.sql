-- ============================================================
--  CoachPro AI — Subscriber entitlement on approved paid purchase
--  Migration: 010_subscriber_on_approved_purchase.sql
--
--  Keeps existing credit ledger flow intact and adds account_type handling:
--  - On approve: credit balance increases as before
--  - On approve: account_type becomes 'subscriber' for role='user'
--  - Admin roles are never forced to subscriber account_type
-- ============================================================

CREATE OR REPLACE FUNCTION public.review_credit_purchase(
  p_purchase_id UUID,
  p_action TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  purchase_id UUID,
  status TEXT,
  user_id UUID,
  credits INTEGER,
  new_balance INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  purchase_row public.credit_purchases%ROWTYPE;
  updated_balance INTEGER;
BEGIN
  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid action. Expected approve or reject';
  END IF;

  SELECT *
  INTO purchase_row
  FROM public.credit_purchases
  WHERE id = p_purchase_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found';
  END IF;

  IF purchase_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Purchase has already been reviewed';
  END IF;

  IF p_action = 'approve' THEN
    UPDATE public.profiles
    SET
      ai_credits_balance = ai_credits_balance + purchase_row.credits,
      account_type = CASE
        WHEN role::text = 'user' THEN 'subscriber'::public.account_type
        ELSE account_type
      END
    WHERE id = purchase_row.user_id
    RETURNING ai_credits_balance INTO updated_balance;

    IF updated_balance IS NULL THEN
      RAISE EXCEPTION 'Profile not found for purchase user';
    END IF;

    INSERT INTO public.credit_ledger (user_id, change, reason, balance_after)
    VALUES (purchase_row.user_id, purchase_row.credits, 'purchase', updated_balance);

    UPDATE public.credit_purchases
    SET
      status = 'approved',
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      reviewed_at = NOW()
    WHERE id = purchase_row.id;

    RETURN QUERY
    SELECT purchase_row.id, 'approved'::TEXT, purchase_row.user_id, purchase_row.credits, updated_balance;

    RETURN;
  END IF;

  UPDATE public.credit_purchases
  SET
    status = 'rejected',
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    reviewed_at = NOW()
  WHERE id = purchase_row.id;

  RETURN QUERY
  SELECT purchase_row.id, 'rejected'::TEXT, purchase_row.user_id, purchase_row.credits, NULL::INTEGER;
END;
$$;

COMMENT ON FUNCTION public.review_credit_purchase IS
  'Atomically approves or rejects a credit purchase, updates credits, and assigns subscriber account_type for approved paid user purchases.';
