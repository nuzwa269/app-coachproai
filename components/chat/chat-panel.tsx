"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Send, Bot, User, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SaveToWorkspaceButton } from "@/components/chat/save-to-workspace-button";
import { OutOfCreditsModal } from "@/components/credits/OutOfCreditsModal";
import { LowCreditsWarning } from "@/components/credits/LowCreditsWarning";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ASSISTANT_TYPES = [
  "Programming Tutor",
  "Database Expert",
  "API Architect",
  "Documentation Writer",
  "DevOps Guide",
  "Code Reviewer",
];

/** Extract plain text from a UIMessage's parts */
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

interface ChatPanelProps {
  projectId: string;
  initialAssistantType?: string;
}

export function ChatPanel({ projectId, initialAssistantType }: ChatPanelProps) {
  const router = useRouter();
  const [assistantType, setAssistantType] = useState(
    initialAssistantType ?? "Programming Tutor"
  );
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);

  // Fetch credit balance on mount
  useEffect(() => {
    const supabase = createClient();
    async function fetchCredits() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("ai_credits_balance")
        .eq("id", user.id)
        .single();
      if (data) setCredits(data.ai_credits_balance as number);
    }
    fetchCredits();
  }, []);

  // Create the transport once; projectId/assistantType are sent per-message
  const transport = useMemo(
    () => new TextStreamChatTransport({ api: "/api/chat" }),
    []
  );

  const { messages, sendMessage, status, setMessages, error } = useChat({ transport });

  const isLoading = status === "submitted" || status === "streaming";

  // Reset messages when assistant type changes
  useEffect(() => {
    setMessages([]);
  }, [assistantType, setMessages]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detect NO_CREDITS error from the server
  useEffect(() => {
    if (error) {
      const msg = error.message ?? "";
      if (msg.includes("NO_CREDITS") || msg.includes("No credits")) {
        setShowNoCreditsModal(true);
        // Reset credits display to 0
        setCredits(0);
      }
    }
  }, [error]);

  // Decrement credits optimistically after a message is sent
  useEffect(() => {
    if (status === "ready" && credits !== null && credits > 0) {
      // The server deducts; refresh the balance when streaming finishes
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from("profiles")
          .select("ai_credits_balance")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) setCredits(data.ai_credits_balance as number);
          });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    // Client-side guard: show modal if balance is 0
    if (credits !== null && credits <= 0) {
      setShowNoCreditsModal(true);
      return;
    }

    setInputValue("");
    await sendMessage(
      { text },
      { body: { projectId, assistantType } }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Out of credits modal */}
      <OutOfCreditsModal
        open={showNoCreditsModal}
        onClose={() => setShowNoCreditsModal(false)}
      />

      {/* Assistant selector */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <Bot className="h-4 w-4 text-brand-orange shrink-0" />
        <div className="relative flex-1">
          <select
            value={assistantType}
            onChange={(e) => setAssistantType(e.target.value)}
            className="w-full appearance-none bg-transparent text-sm font-medium text-[#111827] pr-6 focus:outline-none cursor-pointer"
          >
            {ASSISTANT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>
      </div>

      {/* Low credits warning */}
      {credits !== null && credits < 10 && (
        <div className="px-4 pt-2">
          <LowCreditsWarning credits={credits} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 mb-3">
              <Bot className="h-6 w-6 text-brand-orange" />
            </div>
            <p className="text-sm font-medium text-[#111827]">
              Start a conversation with {assistantType}
            </p>
            <p className="mt-1 text-xs text-gray-400 max-w-xs">
              Ask questions about your project and get structured, context-aware advice.
            </p>
          </div>
        )}

        {messages.map((message) => {
          const text = getMessageText(message);
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  message.role === "user"
                    ? "bg-brand-orange text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`flex flex-col gap-1 max-w-[80%] ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-brand-orange text-white rounded-tr-sm"
                      : "bg-gray-50 text-[#111827] border border-gray-100 rounded-tl-sm"
                  }`}
                >
                  {text}
                </div>

                {/* Save to Workspace on assistant messages */}
                {message.role === "assistant" && text && (
                  <SaveToWorkspaceButton
                    projectId={projectId}
                    content={text}
                    assistantType={assistantType}
                    onSaved={() => router.refresh()}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-gray-50 border border-gray-100 px-4 py-2.5">
              <Loader2 className="h-3.5 w-3.5 text-brand-orange animate-spin" />
              <span className="text-xs text-gray-400">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex gap-2 items-end">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${assistantType} a question...`}
            className="min-h-[40px] max-h-32 resize-none text-sm flex-1 rounded-xl border-gray-200 focus-visible:ring-1 focus-visible:ring-brand-orange focus-visible:ring-offset-0"
            disabled={isLoading}
            rows={1}
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="h-10 w-10 shrink-0 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] text-gray-400 text-center">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
