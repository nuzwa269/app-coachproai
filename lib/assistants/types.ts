import type { AssistantProvider } from "@/types/database";

export type AssistantOption = {
  slug: string;
  name: string;
  description: string | null;
  provider: AssistantProvider;
};
