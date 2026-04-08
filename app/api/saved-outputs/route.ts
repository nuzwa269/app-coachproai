import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SavedOutput } from "@/types/database";

// POST /api/saved-outputs — save an AI output to the workspace
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { project_id, title, content, category, assistant_type } = body as {
    project_id: string;
    title: string;
    content: string;
    category: SavedOutput["category"];
    assistant_type: string | null;
  };

  if (!project_id || typeof project_id !== "string") {
    return NextResponse.json({ error: "project_id is required" }, { status: 400 });
  }
  if (!title || typeof title !== "string" || title.trim() === "") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!content || typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  const validCategories: SavedOutput["category"][] = [
    "overview",
    "database",
    "api",
    "docs",
    "general",
  ];
  if (!category || !validCategories.includes(category)) {
    return NextResponse.json(
      { error: "category must be one of: overview, database, api, docs, general" },
      { status: 400 }
    );
  }

  // Verify the project belongs to this user
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();

  if (projectError || !projectData) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("saved_outputs")
    .insert({
      project_id,
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      category,
      assistant_type: assistant_type ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// GET /api/saved-outputs?project_id=xxx — fetch saved outputs for a project
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  if (!projectId) {
    return NextResponse.json({ error: "project_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("saved_outputs")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
