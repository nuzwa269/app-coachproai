"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LogoutButton } from "@/components/auth/logout-button";

type AdminLayoutProps = {
  children: React.ReactNode;
  userEmail?: string;
};

export function AdminLayout({ children, userEmail }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] md:flex">
      <AdminSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <ShieldCheck className="h-4 w-4 text-brand-orange" />
                Admin Workspace
              </p>
              <h1 className="text-base font-semibold text-[#111827] sm:text-lg">
                CoachPro AI Administration
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <p className="hidden text-sm text-gray-500 sm:block">
                {userEmail ?? "admin@coachpro.ai"}
              </p>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-brand-orange"
              >
                Back to App
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
