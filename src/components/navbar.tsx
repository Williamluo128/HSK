import Link from "next/link";
import { Home } from "lucide-react";
import { auth } from "@/auth";
import { UserMenu } from "./user-menu";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-paper/80 backdrop-blur dark:border-white/10 dark:bg-[#0f0f1a]/80">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500 text-lg font-black text-white">
            汉
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:inline">
            HSK Learning
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Home className="size-4" />
            <span className="hidden sm:inline">首页 Home</span>
          </Link>
          {user && (
            <UserMenu
              username={user.username}
              memberLevel={user.memberLevel}
            />
          )}
        </div>
      </nav>
    </header>
  );
}
