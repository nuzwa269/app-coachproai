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

const assistants = [
  {
    icon: Code,
    title: "Programming Tutor",
    description:
      "Get guidance on code structure, patterns, and best practices",
  },
  {
    icon: Database,
    title: "Database Expert",
    description: "Design schemas, write queries, and optimize databases",
  },
  {
    icon: Globe,
    title: "API Architect",
    description: "Design RESTful APIs, plan endpoints, and handle auth flows",
  },
  {
    icon: FileText,
    title: "Documentation Writer",
    description: "Generate README files, API docs, and technical guides",
  },
  {
    icon: Terminal,
    title: "DevOps Guide",
    description: "CI/CD pipelines, Docker, deployment strategies",
  },
  {
    icon: SearchCode,
    title: "Code Reviewer",
    description: "Get code reviews, find bugs, and improve quality",
  },
];

interface AssistantsGridProps {
  projectId?: string;
  onSelectAssistant?: (assistantType: string) => void;
}

export function AssistantsGrid({ projectId, onSelectAssistant }: AssistantsGridProps) {
  const router = useRouter();

  function handleClick(title: string) {
    if (onSelectAssistant) {
      onSelectAssistant(title);
    } else if (projectId) {
      router.push(`/projects/${projectId}?assistant=${encodeURIComponent(title)}`);
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#111827] font-heading">
          AI Assistants
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assistants.map((assistant) => {
          const Icon = assistant.icon;
          return (
            <Card
              key={assistant.title}
              className="border border-gray-200 hover:border-brand-orange hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => handleClick(assistant.title)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                    <Icon className="h-5 w-5 text-brand-orange" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#111827]">
                      {assistant.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {assistant.description}
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

