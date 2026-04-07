"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TabContent } from "@/components/workspace/tab-content";
import type { SavedOutput } from "@/types/database";

const TAB_CATEGORIES = [
  { value: "overview", label: "Overview" },
  { value: "database", label: "Database" },
  { value: "api", label: "API" },
  { value: "docs", label: "Docs" },
] as const;

interface WorkspaceTabsProps {
  savedOutputs: SavedOutput[];
}

export function WorkspaceTabs({ savedOutputs }: WorkspaceTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-200 rounded-none gap-0">
        {TAB_CATEGORIES.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-orange data-[state=active]:bg-transparent px-4 py-2.5 text-sm font-medium text-gray-500 data-[state=active]:text-brand-orange hover:text-[#111827] transition-colors"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {TAB_CATEGORIES.map((tab) => {
        const outputs = savedOutputs.filter((o) => o.category === tab.value);
        return (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            <TabContent category={tab.value} outputs={outputs} />
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
