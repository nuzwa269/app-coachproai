-- ============================================================
--  CoachPro AI — Admin Assistants + RBAC profile updates
--  Migration: 004_admin_assistants.sql
-- ============================================================

-- ============================================================
-- TABLE: assistants
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assistants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT,
  persona     TEXT        NOT NULL,
  provider    TEXT        NOT NULL
                          CHECK (provider IN ('openai', 'anthropic', 'google', 'custom')),
  model       TEXT        NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.assistants IS
  'Admin-managed assistant catalog for CoachPro AI.';

CREATE INDEX IF NOT EXISTS idx_assistants_active ON public.assistants (is_active);
CREATE INDEX IF NOT EXISTS idx_assistants_provider ON public.assistants (provider);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_assistants_updated_at'
  ) THEN
    CREATE TRIGGER set_assistants_updated_at
      BEFORE UPDATE ON public.assistants
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ============================================================
-- RLS: assistants
-- ============================================================
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'assistants'
      AND policyname = 'Admin can manage assistants'
  ) THEN
    CREATE POLICY "Admin can manage assistants"
      ON public.assistants
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- ============================================================
-- RLS: profiles updates for admins on basic users
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Admin can update non-privileged profiles'
  ) THEN
    CREATE POLICY "Admin can update non-privileged profiles"
      ON public.profiles
      FOR UPDATE
      USING (
        public.is_admin(auth.uid())
        AND role IN ('user', 'subscriber')
      )
      WITH CHECK (
        (
          public.is_admin(auth.uid())
          AND role IN ('user', 'subscriber')
        )
        OR public.is_super_admin(auth.uid())
      );
  END IF;
END $$;

-- Seed common assistants if table is empty.
INSERT INTO public.assistants (name, slug, description, persona, provider, model, is_active)
SELECT * FROM (
  VALUES
    ('Code Architect', 'code-architect', 'System design and architecture guidance', 'You are a senior software architect focused on pragmatic systems design.', 'openai', 'gpt-4o-mini', true),
    ('Debug Specialist', 'debug-specialist', 'Root cause and fix analysis', 'You are an expert debugger. Reproduce, isolate, and fix defects carefully.', 'anthropic', 'claude-3-5-sonnet', true),
    ('Docs Writer', 'docs-writer', 'Documentation and technical writing assistant', 'You produce concise, developer-friendly docs and migration guides.', 'google', 'gemini-1.5-pro', true)
) AS seed(name, slug, description, persona, provider, model, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.assistants);
