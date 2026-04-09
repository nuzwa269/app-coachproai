"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  ChartColumn,
  ClipboardList,
  CreditCard,
  Database,
  LayoutDashboard,
  Menu,
  Settings2,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
};

type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/assistants", label: "Assistants", icon: BrainCircuit },
  { href: "/admin/templates", label: "Templates", icon: WandSparkles },
  { href: "/admin/knowledge", label: "Knowledge", icon: Database },
  { href: "/admin/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/admin/logs", label: "Logs", icon: ClipboardList },
  { href: "/admin/ai-config", label: "AI Config", icon: Settings2 },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

export function AdminSidebar({ isOpen, onToggle, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-3 text-gray-700 shadow-lg md:hidden"
        aria-label="Toggle admin sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-gray-200 bg-white transition-transform duration-200 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              CoachPro AI
            </p>
            <p className="text-lg font-bold text-[#111827]">Admin Console</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 p-3">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-orange-50 text-brand-orange"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
