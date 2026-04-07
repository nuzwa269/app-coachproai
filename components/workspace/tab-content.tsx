import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SavedOutput } from "@/types/database";

interface TabContentProps {
  category: string;
  outputs: SavedOutput[];
}

const emptyStateMessages: Record<string, string> = {
  overview: "No overview notes yet. Use the AI assistant to generate project overviews and architecture summaries.",
  database: "No database schemas saved yet. Ask the Database Expert to help design your data models.",
  api: "No API documentation saved yet. Work with the API Architect to plan your endpoints.",
  docs: "No documentation saved yet. The Documentation Writer can help generate README files and guides.",
};

export function TabContent({ category, outputs }: TabContentProps) {
  if (outputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 mb-4">
          <FileText className="h-7 w-7 text-brand-orange" />
        </div>
        <h3 className="text-base font-semibold text-[#111827] mb-2 font-heading">
          Nothing saved here yet
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          {emptyStateMessages[category] ??
            "Use the AI assistants to generate content and save it to this tab."}
        </p>
        <p className="text-xs text-gray-400 mt-3">
          AI Chat will be available in Week 3
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {outputs.map((output) => (
        <Card key={output.id} className="border border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold font-heading">
                {output.title}
              </CardTitle>
              {output.assistant_type && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {output.assistant_type}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
              {output.content}
            </pre>
            <p className="mt-3 text-xs text-gray-400">
              Saved {new Date(output.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
