import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { saveAiConfigAction } from "@/app/(admin)/admin/ai-config/actions";

type AiConfig = {
  primaryProvider: string;
  primaryModel: string;
  fallbackProvider: string;
  fallbackModel: string;
  guardrailsPrompt: string;
};

const DEFAULT_AI_CONFIG: AiConfig = {
  primaryProvider: "openai",
  primaryModel: "gpt-4o-mini",
  fallbackProvider: "anthropic",
  fallbackModel: "claude-3-5-sonnet",
  guardrailsPrompt:
    "Keep responses accurate, secure, and grounded in project context.",
};

function parseAiConfig(value: unknown): AiConfig {
  if (!value || typeof value !== "object") {
    return DEFAULT_AI_CONFIG;
  }

  const config = value as Record<string, unknown>;

  return {
    primaryProvider:
      typeof config.primaryProvider === "string"
        ? config.primaryProvider
        : DEFAULT_AI_CONFIG.primaryProvider,
    primaryModel:
      typeof config.primaryModel === "string"
        ? config.primaryModel
        : DEFAULT_AI_CONFIG.primaryModel,
    fallbackProvider:
      typeof config.fallbackProvider === "string"
        ? config.fallbackProvider
        : DEFAULT_AI_CONFIG.fallbackProvider,
    fallbackModel:
      typeof config.fallbackModel === "string"
        ? config.fallbackModel
        : DEFAULT_AI_CONFIG.fallbackModel,
    guardrailsPrompt:
      typeof config.guardrailsPrompt === "string"
        ? config.guardrailsPrompt
        : DEFAULT_AI_CONFIG.guardrailsPrompt,
  };
}

export default async function AdminAiConfigPage() {
  const supabase = await createClient();
  const { data: setting, error } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "ai_config")
    .maybeSingle();

  const config = parseAiConfig(setting?.value);

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="AI Config"
        description="Baseline controls for provider defaults, fallback behavior, and safety prompts."
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load AI config: {error.message}
        </div>
      ) : null}

      <form action={saveAiConfigAction} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#111827]">Provider Defaults</h3>
          <div className="mt-3 space-y-3">
            <Input
              name="primaryProvider"
              placeholder="Primary provider"
              defaultValue={config.primaryProvider}
              required
            />
            <Input
              name="primaryModel"
              placeholder="Primary model"
              defaultValue={config.primaryModel}
              required
            />
            <Input
              name="fallbackProvider"
              placeholder="Fallback provider"
              defaultValue={config.fallbackProvider}
              required
            />
            <Input
              name="fallbackModel"
              placeholder="Fallback model"
              defaultValue={config.fallbackModel}
              required
            />
            <Button type="submit">Save Defaults</Button>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#111827]">System Guardrails</h3>
          <div className="mt-3 space-y-3">
            <Textarea
              name="guardrailsPrompt"
              className="min-h-40"
              placeholder="Global safety/system prompt"
              defaultValue={config.guardrailsPrompt}
              required
            />
            <Button type="submit" variant="outline">
              Save Guardrails
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}
