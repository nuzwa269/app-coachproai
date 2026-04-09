import { AlertCircle, Coins, CreditCard, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";

type MetricCard = {
  label: string;
  value: string;
  helper?: string;
};

function metricValue(value: number | null | undefined, formatter?: (n: number) => string) {
  if (value === null || value === undefined) return "-";
  return formatter ? formatter(value) : value.toLocaleString();
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    usersCountResult,
    subscribersCountResult,
    purchasesPendingCountResult,
    approvedPurchasesResult,
    creditsUsedResult,
    assistantsCountResult,
    latestUsersResult,
    latestPendingPurchasesResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["subscriber", "admin", "super_admin"]),
    supabase
      .from("credit_purchases")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("credit_purchases")
      .select("amount_pkr")
      .eq("status", "approved"),
    supabase.from("credit_ledger").select("change").lt("change", 0),
    supabase.from("assistants").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("credit_purchases")
      .select("id, amount_pkr, method, transaction_ref, created_at, profiles(email)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const totalRevenue =
    approvedPurchasesResult.data?.reduce((sum, row) => sum + row.amount_pkr, 0) ?? null;

  const totalCreditsUsed =
    creditsUsedResult.data?.reduce((sum, row) => sum + Math.abs(row.change), 0) ?? null;

  const metricCards: MetricCard[] = [
    {
      label: "Total Users",
      value: metricValue(usersCountResult.count),
    },
    {
      label: "Active Subscribers",
      value: metricValue(subscribersCountResult.count),
    },
    {
      label: "Revenue",
      value: metricValue(totalRevenue, (n) => `Rs. ${n.toLocaleString()}`),
      helper: "Approved payments",
    },
    {
      label: "Credits Used",
      value: metricValue(totalCreditsUsed),
      helper: "From credit ledger",
    },
    {
      label: "Pending Payment Approvals",
      value: metricValue(purchasesPendingCountResult.count),
    },
    {
      label: "Assistant Count",
      value: metricValue(assistantsCountResult.count),
      helper: "Admin-managed assistants",
    },
  ];

  const hasMetricError = [
    usersCountResult.error,
    subscribersCountResult.error,
    purchasesPendingCountResult.error,
    approvedPurchasesResult.error,
    creditsUsedResult.error,
    assistantsCountResult.error,
  ].some(Boolean);

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Admin Dashboard"
        description="Operational overview for users, credits, payments, and assistant inventory."
      />

      {hasMetricError ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Some metrics failed to load. Check migration state for assistant tables and data policies.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => (
          <article key={card.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#111827]">{card.value}</p>
            {card.helper ? <p className="mt-1 text-xs text-gray-500">{card.helper}</p> : null}
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-orange" />
            <h3 className="font-semibold text-[#111827]">Newest Users</h3>
          </div>

          {!latestUsersResult.data || latestUsersResult.data.length === 0 ? (
            <p className="text-sm text-gray-500">No users found.</p>
          ) : (
            <div className="space-y-3">
              {latestUsersResult.data.map((user) => (
                <div key={user.id} className="rounded-md border border-gray-100 px-3 py-2">
                  <p className="text-sm font-medium text-[#111827]">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    {user.full_name || "No name"} • {user.role} • joined{" "}
                    {new Date(user.created_at).toLocaleDateString("en-PK")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-brand-orange" />
            <h3 className="font-semibold text-[#111827]">Pending Payments</h3>
          </div>

          {!latestPendingPurchasesResult.data || latestPendingPurchasesResult.data.length === 0 ? (
            <p className="text-sm text-gray-500">No pending requests right now.</p>
          ) : (
            <div className="space-y-3">
              {latestPendingPurchasesResult.data.map((purchase) => (
                <div key={purchase.id} className="rounded-md border border-gray-100 px-3 py-2">
                  <p className="text-sm font-medium text-[#111827]">
                    {purchase.profiles?.email ?? "Unknown user"} • Rs. {purchase.amount_pkr.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {purchase.method} • {purchase.transaction_ref} • {new Date(purchase.created_at).toLocaleDateString("en-PK")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
            <Coins className="h-4 w-4 text-brand-orange" />
            Credits Oversight
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Track usage pressure, pending approvals, and unusual balance adjustments from the users panel.
          </p>
        </article>

        <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
            <Sparkles className="h-4 w-4 text-brand-orange" />
            Assistant Governance
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Manage assistant persona and provider strategy from the assistants section.
          </p>
        </article>

        <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
            <AlertCircle className="h-4 w-4 text-brand-orange" />
            Operational Logs
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Use logs and analytics sections to monitor admin activity and identify failed workflows.
          </p>
        </article>
      </section>
    </div>
  );
}
