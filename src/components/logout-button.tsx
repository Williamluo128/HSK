"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => logoutAction())}
      disabled={pending}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-brand-700 transition hover:bg-brand-50 disabled:opacity-50 dark:text-brand-300 dark:hover:bg-white/10"
    >
      <LogOut className="size-4" />
      {pending ? "退出中…" : "退出登录 Log out"}
    </button>
  );
}
