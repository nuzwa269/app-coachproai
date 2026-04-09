import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Analytics"
        description="Starter analytics panels for operational KPIs and traffic diagnostics."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Daily Active Users</p>
          <p className="mt-2 text-2xl font-bold text-[#111827]">-</p>
          <p className="text-xs text-gray-500">Connect event tracking pipeline</p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Chat Success Rate</p>
          <p className="mt-2 text-2xl font-bold text-[#111827]">-</p>
          <p className="text-xs text-gray-500">Awaiting model response telemetry</p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Payment Conversion</p>
          <p className="mt-2 text-2xl font-bold text-[#111827]">-</p>
          <p className="text-xs text-gray-500">Use approved vs pending purchases</p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Support Escalations</p>
          <p className="mt-2 text-2xl font-bold text-[#111827]">-</p>
          <p className="text-xs text-gray-500">Hook into ticketing events</p>
        </article>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-[#111827]">Data Integration Checklist</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
          <li>Track chat request lifecycle and completion latency.</li>
          <li>Capture project creation and assistant usage events.</li>
          <li>Publish revenue snapshots to this dashboard nightly.</li>
        </ul>
      </section>
    </div>
  );
}
