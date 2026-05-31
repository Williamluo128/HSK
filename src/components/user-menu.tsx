"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, User } from "lucide-react";
import { LogoutButton } from "./logout-button";

export function UserMenu({
  username,
  memberLevel,
}: {
  username: string;
  memberLevel: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-black/5 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
          {username.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden sm:inline">{username}</span>
        <ChevronDown className="size-4 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-black/10 bg-white p-1.5 shadow-xl dark:border-white/15 dark:bg-[#1a1a2e]">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold">{username}</p>
            <p className="text-xs text-black/50 dark:text-white/50">
              可访问至 {memberLevel} 级
            </p>
          </div>
          <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <User className="size-4" />
            个人资料 Profile
          </Link>
          <LogoutButton />
        </div>
      )}
    </div>
  );
}
