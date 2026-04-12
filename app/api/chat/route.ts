import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OPENAI_API_KEY } from "@/lib/config/server-env";
import type { UIMessage } from "ai";
import type { Project } from "@/types/database";

void OPENAI_API_KEY;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { messages, projectId, assistantSlug } = body as {
    messages: UIMessage[];
    projectId: string;
    assistantSlug: string;
  };

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  if (!assistantSlug || typeof assistantSlug !== "string") {
    return NextResponse.json({ error: "assistantSlug is required" }, { status: 400 });
  }

  // Atomically deduct 1 credit before calling OpenAI.
  // deduct_credit returns -1 if balance is 0, otherwise returns the new balance.
  const { data: newBalance, error: deductError } = await supabase.rpc(
    "deduct_credit",
    { p_user_id: user.id }
  );

  if (deductError) {
    return NextResponse.json({ error: "Failed to check credits." }, { status: 500 });
  }

  if (newBalance === -1) {
    return NextResponse.json(
      { error: "No credits remaining. Please purchase more credits.", code: "NO_CREDITS" },
      { status: 403 }
    );
  }

  // Fetch project to build context
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !projectData) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = projectData as Project;

  const { data: assistantData, error: assistantError } = await supabase
    .from("assistants")
    .select("slug, name, persona, is_active")
    .eq("slug", assistantSlug)
    .eq("is_active", true)
    .single();

  if (assistantError || !assistantData) {
    return NextResponse.json({ error: "Assistant not found" }, { status: 400 });
  }

  const persona = assistantData.persona;

  const techStackStr =
    project.tech_stack && project.tech_stack.length > 0
      ? project.tech_stack.join(", ")
      : "not specified";

  const systemPrompt = `${persona}

You are assisting with the following software project:
- Project Name: ${project.name}
- Description: ${project.description ?? "No description provided"}
- Tech Stack: ${techStackStr}
- Status: ${project.status}

Always tailor your advice to this specific project context. Give structured, actionable, and professional responses. Use code blocks when providing code examples. Do not use emojis.`;

  // Convert UIMessages (v6 format) to ModelMessages for streamText
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      // Persist the last user message and the assistant response
      const lastUserMsg = messages.filter((m) => m.role === "user").at(-1);
      const userContent = lastUserMsg?.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("") ?? "";

      const messagesToSave = [];

      if (userContent) {
        messagesToSave.push({
          project_id: projectId,
          user_id: user.id,
          role: "user" as const,
          content: userContent,
          assistant_type: assistantData.slug,
        });
      }

      if (text) {
        messagesToSave.push({
          project_id: projectId,
          user_id: user.id,
          role: "assistant" as const,
          content: text,
          assistant_type: assistantData.slug,
        });
      }

      if (messagesToSave.length > 0) {
        await supabase.from("chat_messages").insert(messagesToSave);
      }
    },
  });

  return result.toTextStreamResponse();
}

