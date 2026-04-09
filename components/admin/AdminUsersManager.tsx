"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UserRole } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";

type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  ai_credits_balance: number;
  created_at: string;
  updated_at: string;
};

type UsersResponse = {
  users: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type UsersManagerProps = {
  canAssignPrivilegedRoles: boolean;
};

const ROLES: Array<UserRole | "all"> = [
  "all",
  "user",
  "subscriber",
  "admin",
  "super_admin",
];

export function AdminUsersManager({ canAssignPrivilegedRoles }: UsersManagerProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
      role: roleFilter,
      query,
    });

    const response = await fetch(`/api/admin/users?${params.toString()}`);
    const payload = (await response.json()) as UsersResponse | { error: string };

    if (!response.ok) {
      setError((payload as { error: string }).error ?? "Failed to load users");
      setLoading(false);
      return;
    }

    const data = payload as UsersResponse;
    setUsers(data.users);
    setTotalPages(data.totalPages);
    setTotal(data.total);
    setLoading(false);
  }, [page, query, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const statsLabel = useMemo(() => {
    if (loading) return "Loading users...";
    if (total === 0) return "No users found";
    return `${total} users total`;
  }, [loading, total]);

  async function updateUser(
    userId: string,
    patch: Partial<Pick<AdminUser, "role" | "full_name" | "ai_credits_balance">>
  ) {
    setSavingId(userId);
    setError(null);

    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...patch }),
    });

    const payload = (await response.json()) as AdminUser | { error: string };

    if (!response.ok) {
      setError((payload as { error: string }).error ?? "Update failed");
      setSavingId(null);
      return;
    }

    const updated = payload as AdminUser;
    setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setSavingId(null);
  }

  return (
    <div className="space-y-5">
      <AdminSectionHeader
        title="Users"
        description="Search users, inspect account details, and manage role/credit settings."
      />

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            placeholder="Search by email or name"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            className="md:max-w-sm"
          />
          <Button
            type="button"
            onClick={() => {
              setPage(1);
              setQuery(queryInput.trim());
            }}
          >
            Search
          </Button>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={roleFilter}
            onChange={(event) => {
              setPage(1);
              setRoleFilter(event.target.value as UserRole | "all");
            }}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role === "all" ? "All Roles" : role}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 md:ml-auto">{statsLabel}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          No users matched your filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Credits</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Joined</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Updated</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const isPrivileged = user.role === "admin" || user.role === "super_admin";
                const blockedByPolicy = isPrivileged && !canAssignPrivilegedRoles;

                return (
                  <tr key={user.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#111827]">{user.email}</p>
                      <Input
                        className="mt-2 h-8 max-w-xs text-xs"
                        defaultValue={user.full_name ?? ""}
                        disabled={blockedByPolicy || savingId === user.id}
                        onBlur={(event) => {
                          const value = event.target.value.trim();
                          if ((user.full_name ?? "") === value) return;
                          updateUser(user.id, { full_name: value || null });
                        }}
                        placeholder="Full name"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        value={user.role}
                        disabled={blockedByPolicy || savingId === user.id}
                        onChange={(event) => {
                          const role = event.target.value as UserRole;
                          if (role === user.role) return;
                          updateUser(user.id, { role });
                        }}
                      >
                        <option value="user">user</option>
                        <option value="subscriber">subscriber</option>
                        <option value="admin" disabled={!canAssignPrivilegedRoles}>
                          admin
                        </option>
                        <option
                          value="super_admin"
                          disabled={!canAssignPrivilegedRoles}
                        >
                          super_admin
                        </option>
                      </select>
                      {blockedByPolicy ? (
                        <p className="mt-1 text-xs text-amber-700">
                          Only super admins can modify this account.
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        className="h-8 w-28 text-xs"
                        defaultValue={user.ai_credits_balance}
                        disabled={blockedByPolicy || savingId === user.id}
                        min={0}
                        onBlur={(event) => {
                          const parsed = Number(event.target.value);
                          if (!Number.isFinite(parsed)) return;
                          if (parsed === user.ai_credits_balance) return;
                          updateUser(user.id, { ai_credits_balance: parsed });
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString("en-PK")}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(user.updated_at).toLocaleDateString("en-PK")}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {savingId === user.id ? "Saving..." : "Auto-saves on change"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
