import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarDays, GraduationCap, Mail, UserCircle, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getProgressMap } from "@/lib/progress";

export const metadata: Metadata = { title: "个人资料 Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const progress = await getProgressMap(user.id);
  const completed = Array.from(progress.values()).filter(
    (p) => p.completed,
  ).length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-black text-white">
          {user.username.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-black">{user.username}</h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            个人资料 · Profile
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Row icon={UserCircle} label="用户 ID">
          {user.id.slice(0, 8)}…
        </Row>
        <Row icon={Mail} label="邮箱">
          {user.email}
        </Row>
        <Row icon={GraduationCap} label="可访问等级">
          1 – {user.memberLevel} 级
        </Row>
        <Row icon={CheckCircle2} label="已完成课程">
          {completed} 课
        </Row>
        <Row icon={CalendarDays} label="认证服务">
          Supabase
        </Row>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <Icon className="size-5 shrink-0 text-brand-500" />
      <div className="min-w-0">
        <p className="text-xs text-black/45 dark:text-white/45">{label}</p>
        <p className="truncate font-semibold">{children}</p>
      </div>
    </div>
  );
}
