function parseBooleanEnv(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === "true";
}

export const ADMIN_EMAIL_FALLBACK_ENABLED = parseBooleanEnv(
  "ADMIN_EMAIL_FALLBACK_ENABLED"
);

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";

if (ADMIN_EMAIL_FALLBACK_ENABLED && !ADMIN_EMAIL) {
  throw new Error(
    "ADMIN_EMAIL_FALLBACK_ENABLED=true requires ADMIN_EMAIL to be set"
  );
}
