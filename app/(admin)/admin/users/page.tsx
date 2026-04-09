import { isSuperAdmin } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/server-roles";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";

export default async function AdminUsersPage() {
  const { role } = await requireAdmin();

  return <AdminUsersManager canAssignPrivilegedRoles={isSuperAdmin(role)} />;
}
