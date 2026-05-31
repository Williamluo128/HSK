import type { Metadata } from "next";
import { CalendarDays, GraduationCap, Mail, UserCircle, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getProgressMap } from "@/lib/progress";

export const metadata: Metadata = { title: "个人资料 Profile" };

function fmt(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user;
  const userId = Number(user.id);

  const [member, progress] = await Promise.all([
    prisma.member.findUnique({
      where: { id: userId },
      include: { account: true },
    }),
    getProgressMap(userId),
  ]);

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
          {userId}
        </Row>
        <Row icon={Mail} label="邮箱">
          {member?.email}
        </Row>
        <Row icon={GraduationCap} label="可访问等级">
          1 – {user.memberLevel} 级
        </Row>
        <Row icon={CheckCircle2} label="已完成课程">
          {completed} 课
        </Row>
        <Row icon={CalendarDays} label="有效期开始">
          {fmt(member?.account?.fromDate)}
        </Row>
        <Row icon={CalendarDays} label="有效期结束">
          {fmt(member?.account?.thruDate)}
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
