import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Project, SavedOutput } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import { EditProjectDialog } from "@/components/dashboard/edit-project-dialog";
import { DeleteProjectDialog } from "@/components/dashboard/delete-project-dialog";
import { ChatPanel } from "@/components/chat/chat-panel";
import type { AssistantOption } from "@/lib/assistants/types";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assistant?: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("name")
    .eq("id", id)
    .single();
  const name = (data as { name: string } | null)?.name;
  return { title: name ? `${name} — CoachPro AI` : "Project — CoachPro AI" };
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const { assistant } = await searchParams;

  // Fetch project (must belong to the user)
  const { data: projectData, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !projectData) {
    notFound();
  }

  const project = projectData as Project;

  // Fetch saved outputs for this project
  const { data: outputsData } = await supabase
    .from("saved_outputs")
    .select("*")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const savedOutputs = (outputsData ?? []) as SavedOutput[];

  const { data: assistantsData } = await supabase
    .from("assistants")
    .select("slug, name, description, provider")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const assistants = (assistantsData ?? []) as AssistantOption[];

  const initialAssistantSlug = assistants.some((entry) => entry.slug === assistant)
    ? assistant
    : assistants[0]?.slug;

  const statusColors: Record<Project["status"], string> = {
    active: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    archived: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back navigation */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-orange transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Project header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[#111827] font-heading">
                {project.name}
              </h1>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[project.status]}`}
              >
                {project.status}
              </span>
            </div>
            {project.description && (
              <p className="mt-2 text-gray-500 text-sm">{project.description}</p>
            )}
            {project.tech_stack && project.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {project.tech_stack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <EditProjectDialog project={project} />
            <DeleteProjectDialog
              projectId={project.id}
              projectName={project.name}
              redirectAfterDelete
            />
          </div>
        </div>
      </div>

      {/* Workspace + Chat */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Workspace Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-6">
            <WorkspaceTabs savedOutputs={savedOutputs} />
          </div>
        </div>

        {/* AI Chat Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[560px]">
          <div className="px-4 pt-4 pb-0 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-[#111827] font-heading pb-3">
              AI Assistant
            </h2>
          </div>
          <div className="flex-1 min-h-0">
            <ChatPanel
              projectId={project.id}
              assistants={assistants}
              initialAssistantSlug={initialAssistantSlug}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

