import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UIMessage } from "ai";
import type { Project } from "@/types/database";

const ASSISTANT_PERSONAS: Record<string, string> = {
  "Programming Tutor":
    "You are a Programming Tutor. Help the user understand code structure, patterns, best practices, and how to write clean, maintainable code. Give clear explanations with code examples.",
  "Database Expert":
    "You are a Database Expert. Help the user design efficient database schemas, write optimized queries, and follow database best practices. Provide structured schema definitions and SQL examples.",
  "API Architect":
    "You are an API Architect. Help the user design RESTful APIs, plan endpoints, handle authentication flows, and follow REST best practices. Give concrete endpoint examples.",
  "Documentation Writer":
    "You are a Documentation Writer. Help the user create clear README files, API documentation, technical guides, and code comments. Write in a professional, concise style.",
  "DevOps Guide":
    "You are a DevOps Guide. Help the user with CI/CD pipelines, Docker configurations, deployment strategies, and infrastructure best practices. Give actionable configuration examples.",
  "Code Reviewer":
    "You are a Code Reviewer. Analyze code for bugs, performance issues, security vulnerabilities, and style improvements. Give specific, constructive feedback with corrected examples.",
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { messages, projectId, assistantType } = body as {
    messages: UIMessage[];
    projectId: string;
    assistantType: string;
  };

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  // Check credit balance before calling OpenAI
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_credits_balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.ai_credits_balance <= 0) {
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

  const persona =
    ASSISTANT_PERSONAS[assistantType] ??
    "You are a helpful AI assistant for software development.";

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
          assistant_type: assistantType ?? null,
        });
      }

      if (text) {
        messagesToSave.push({
          project_id: projectId,
          user_id: user.id,
          role: "assistant" as const,
          content: text,
          assistant_type: assistantType ?? null,
        });
      }

      if (messagesToSave.length > 0) {
        await supabase.from("chat_messages").insert(messagesToSave);
      }

      // Deduct 1 credit after successful AI response
      await supabase.rpc("deduct_credit", { p_user_id: user.id });
    },
  });

  return result.toTextStreamResponse();
}

