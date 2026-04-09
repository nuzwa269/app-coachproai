-- ============================================================
--  CoachPro AI — Admin Control Plane Persistence
--  Migration: 005_admin_control_plane.sql
-- ============================================================

-- ============================================================
-- TABLE: admin_event_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_event_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  category    TEXT        NOT NULL,
  action      TEXT        NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  severity    TEXT        NOT NULL DEFAULT 'info'
                          CHECK (severity IN ('info', 'warning', 'error')),
  message     TEXT        NOT NULL,
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_event_logs_created_at ON public.admin_event_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_event_logs_category ON public.admin_event_logs (category);

COMMENT ON TABLE public.admin_event_logs IS
  'Immutable audit log for admin-sensitive actions and control-plane events.';

-- ============================================================
-- TABLE: admin_templates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'active', 'archived')),
  version     INTEGER     NOT NULL DEFAULT 1,
  updated_by  UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_templates_status ON public.admin_templates (status);
CREATE INDEX IF NOT EXISTS idx_admin_templates_updated_at ON public.admin_templates (updated_at DESC);

-- ============================================================
-- TABLE: admin_knowledge_sources
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_knowledge_sources (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  source_ref        TEXT        NOT NULL,
  sync_instructions TEXT,
  status            TEXT        NOT NULL DEFAULT 'queued'
                                CHECK (status IN ('queued', 'indexing', 'healthy', 'failed')),
  chunk_count       INTEGER     NOT NULL DEFAULT 0,
  last_synced_at    TIMESTAMPTZ,
  updated_by        UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_knowledge_status ON public.admin_knowledge_sources (status);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_updated_at ON public.admin_knowledge_sources (updated_at DESC);

-- ============================================================
-- TABLE: admin_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        NOT NULL UNIQUE,
  value       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_by  UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings (key);

-- updated_at triggers (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_admin_templates_updated_at') THEN
    CREATE TRIGGER set_admin_templates_updated_at
      BEFORE UPDATE ON public.admin_templates
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_admin_knowledge_sources_updated_at') THEN
    CREATE TRIGGER set_admin_knowledge_sources_updated_at
      BEFORE UPDATE ON public.admin_knowledge_sources
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_admin_settings_updated_at') THEN
    CREATE TRIGGER set_admin_settings_updated_at
      BEFORE UPDATE ON public.admin_settings
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ============================================================
-- RLS + Policies
-- ============================================================
ALTER TABLE public.admin_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_event_logs' AND policyname = 'Admin can manage admin event logs'
  ) THEN
    CREATE POLICY "Admin can manage admin event logs"
      ON public.admin_event_logs
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_templates' AND policyname = 'Admin can manage templates'
  ) THEN
    CREATE POLICY "Admin can manage templates"
      ON public.admin_templates
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_knowledge_sources' AND policyname = 'Admin can manage knowledge sources'
  ) THEN
    CREATE POLICY "Admin can manage knowledge sources"
      ON public.admin_knowledge_sources
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_settings' AND policyname = 'Admin can manage settings'
  ) THEN
    CREATE POLICY "Admin can manage settings"
      ON public.admin_settings
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Seed baseline AI config
INSERT INTO public.admin_settings (key, value)
VALUES (
  'ai_config',
  jsonb_build_object(
    'primaryProvider', 'openai',
    'primaryModel', 'gpt-4o-mini',
    'fallbackProvider', 'anthropic',
    'fallbackModel', 'claude-3-5-sonnet',
    'guardrailsPrompt', 'Keep responses accurate, secure, and grounded in project context.'
  )
)
ON CONFLICT (key) DO NOTHING;
