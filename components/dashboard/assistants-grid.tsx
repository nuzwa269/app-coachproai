"use client";

import { useRouter } from "next/navigation";
import {
  Code,
  Database,
  Globe,
  FileText,
  Terminal,
  SearchCode,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AssistantOption } from "@/lib/assistants/types";

const PROVIDER_ICON_MAP = {
  openai: Code,
  anthropic: SearchCode,
  google: Globe,
  custom: Terminal,
} as const;

const FALLBACK_ICONS = [Database, FileText];

interface AssistantsGridProps {
  assistants: AssistantOption[];
  projectId?: string;
  onSelectAssistant?: (assistantSlug: string) => void;
}

export function AssistantsGrid({
  assistants,
  projectId,
  onSelectAssistant,
}: AssistantsGridProps) {
  const router = useRouter();

  function handleClick(slug: string) {
    if (onSelectAssistant) {
      onSelectAssistant(slug);
    } else if (projectId) {
      router.push(`/projects/${projectId}?assistant=${encodeURIComponent(slug)}`);
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#111827] font-heading">
          AI Assistants
        </h2>
      </div>
      {assistants.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
          No active assistants configured yet.
        </div>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assistants.map((assistant, index) => {
          const Icon =
            PROVIDER_ICON_MAP[assistant.provider] ??
            FALLBACK_ICONS[index % FALLBACK_ICONS.length];
          return (
            <Card
              key={assistant.slug}
              className="border border-gray-200 hover:border-brand-orange hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => handleClick(assistant.slug)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                    <Icon className="h-5 w-5 text-brand-orange" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#111827]">
                      {assistant.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {assistant.description ?? "Configured assistant"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

