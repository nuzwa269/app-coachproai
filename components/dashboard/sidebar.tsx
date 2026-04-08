"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Bookmark,
  Coins,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import { CreditBalance } from "@/components/credits/CreditBalance";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    disabled: false,
  },
  {
    href: "/dashboard",
    label: "Projects",
    icon: FolderOpen,
    disabled: false,
  },
  {
    href: "/saved-outputs",
    label: "Saved Outputs",
    icon: Bookmark,
    disabled: false,
  },
  {
    href: "/buy-credits",
    label: "Buy Credits",
    icon: Coins,
    disabled: false,
  },
  {
    href: "#",
    label: "Settings",
    icon: Settings,
    disabled: true,
    badge: "Soon",
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-300 md:static md:translate-x-0 md:flex",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 shrink-0">
          <span className="text-xl font-bold text-[#111827] font-heading">
            CoachPro <span className="text-brand-orange">AI</span>
          </span>
          <button
            onClick={onClose}
            className="md:hidden rounded-md p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              !link.disabled &&
              (pathname === link.href ||
                (link.href !== "/dashboard" &&
                  pathname.startsWith(link.href)));

            if (link.disabled) {
              return (
                <span
                  key={link.label}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed select-none"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {link.label}
                  {link.badge && (
                    <span className="ml-auto text-xs text-gray-400">
                      ({link.badge})
                    </span>
                  )}
                </span>
              );
            }

            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-orange-50 text-brand-orange"
                    : "text-gray-700 hover:bg-orange-50 hover:text-brand-orange"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Credit balance + Logout at bottom */}
        <div className="px-4 py-4 border-t border-gray-200 shrink-0 space-y-1">
          <CreditBalance />
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}

