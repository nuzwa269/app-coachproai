import "server-only";

function requireServerEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const OPENAI_API_KEY = requireServerEnv("OPENAI_API_KEY");
