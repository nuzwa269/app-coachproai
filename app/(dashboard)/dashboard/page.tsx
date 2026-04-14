import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sparkles, FolderOpen } from "lucide-react";
import type { Profile, Project } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AssistantsGrid } from "@/components/dashboard/assistants-grid";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import type { AssistantOption } from "@/lib/assistants/types";

export const metadata = {
  title: "Dashboard — CoachPro AI",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ✅ Guard against null user instead of crashing
  if (!user) {
    redirect("/login");
  }

  // Fetch the user's profile to get their name
  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, ai_credits_balance")
    .eq("id", user.id)
    .single();

  // Fetch recent projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(6);

  const profile = profileData as Pick<
    Profile,
    "full_name" | "ai_credits_balance"
  > | null;

  const displayName =
    profile?.full_name ?? user.email?.split("@")[0] ?? "there";

  const projectList = (projects ?? []) as Project[];

  const { data: assistantsData } = await supabase
    .from("assistants")
    .select("slug, name, description, provider")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const assistants = (assistantsData ?? []) as AssistantOption[];

  function formatRelativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const statusColors: Record<Project["status"], string> = {
    active: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    archived: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-[#FF8A00] to-[#9333EA] p-8 text-white">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-orange-200 shrink-0" />
          <h1 className="text-3xl font-bold font-heading">
            Welcome back, {displayName}!
          </h1>
        </div>
        <p className="mt-2 text-orange-100">
          Your AI-powered development coach is ready. Start a project to get
          personalized guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            AI Credits
          </p>
          <p className="mt-1 text-2xl font-bold text-[#111827]">
            {profile?.ai_credits_balance ?? 50}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">credits remaining</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Projects
          </p>
          <p className="mt-1 text-2xl font-bold text-[#111827]">
            {projectList.length}
          </p>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#111827] font-heading">
            Recent Projects
          </h2>
          <CreateProjectDialog />
        </div>

        {projectList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                <FolderOpen className="h-8 w-8 text-brand-orange" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-[#111827] font-heading">
              No projects yet
            </h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto">
              Create your first project to start working with AI assistants and
              build your workspace.
            </p>
            <div className="mt-6">
              <CreateProjectDialog />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectList.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full border border-gray-200 hover:border-brand-orange hover:shadow-md transition-all duration-200 cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-[#111827] line-clamp-1 font-heading">
                        {project.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[project.status]}`}
                      >
                        {project.status}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}
                    {project.tech_stack && project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.tech_stack.slice(0, 3).map((tech) => (
                          <Badge
                            key={tech}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {project.tech_stack.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.tech_stack.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      Updated {formatRelativeTime(project.updated_at)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <AssistantsGrid assistants={assistants} />
    </div>
  );
}
