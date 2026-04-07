"use client";

import { Menu } from "lucide-react";

interface TopNavProps {
  userEmail: string | undefined;
  onMenuClick: () => void;
}

export function TopNav({ userEmail, onMenuClick }: TopNavProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 shrink-0">
      {/* Mobile hamburger + brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden rounded-md p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold text-[#111827] font-heading md:hidden">
          CoachPro <span className="text-brand-orange">AI</span>
        </span>
      </div>

      {/* User email */}
      <div className="ml-auto">
        <span className="text-sm text-gray-600 hidden sm:block">{userEmail}</span>
      </div>
    </header>
  );
}
