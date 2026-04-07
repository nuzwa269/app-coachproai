import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server-side auth guard — redirect unauthenticated users to login
  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell userEmail={user.email}>{children}</DashboardShell>
  );
}

