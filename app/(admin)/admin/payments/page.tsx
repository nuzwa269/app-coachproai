import { AdminPaymentsManager } from "@/components/admin/AdminPaymentsManager";
import { requireAdmin } from "@/lib/auth/server-roles";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  return <AdminPaymentsManager />;
}
