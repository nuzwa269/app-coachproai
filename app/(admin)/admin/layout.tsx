import { requireAdmin } from "@/lib/auth/server-roles";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default async function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return <AdminLayout userEmail={user.email}>{children}</AdminLayout>;
}
