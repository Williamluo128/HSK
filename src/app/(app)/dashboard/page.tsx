import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen, GraduationCap, PlayCircle, CheckCircle2, Lock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getLessonsForMember } from "@/lib/lessons";
import { getProgressMap, getContinueLesson } from "@/lib/progress";
import { ConfigError } from "@/components/config-error";

export const metadata: Metadata = { title: "课程总览 Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let groups;
  let progress;
  let cont;
  try {
    [groups, progress, cont] = await Promise.all([
      getLessonsForMember(user.memberLevel),
      getProgressMap(user.id),
      getContinueLesson(user.id),
    ]);
  } catch (error) {
    console.error("[DashboardPage] failed to load data", error);
    return (
      <ConfigError title="课程内容暂时无法加载">
        <p>数据库连接失败。请在 Vercel 检查：</p>
        <ul className="list-inside list-disc text-left">
          <li>
            Supabase 环境变量（<code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code>、
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>）
          </li>
          <li>
            课程内容库 <code className="text-xs">DATABASE_URL</code> 末尾为{" "}
            <code className="text-xs">?sslaccept=strict</code>
          </li>
        </ul>
        <p className="pt-2">
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            返回登录
          </Link>
        </p>
      </ConfigError>
    );
  }

  const totalLessons = groups.reduce((a, g) => a + g.lessons.length, 0);
  const completedCount = Array.from(progress.values()).filter(
    (p) => p.completed,
  ).length;

  return (
    <div>
      {/* Greeting + stats */}
      <section className="mb-8">
        <p className="text-sm text-black/50 dark:text-white/50">
          欢迎回来 · huān yíng
        </p>
        <h1 className="mt-1 text-3xl font-black">{user.username}</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <Stat icon={GraduationCap} label="可访问等级" value={`1 – ${user.memberLevel} 级`} />
          <Stat icon={BookOpen} label="可学课程" value={`${totalLessons} 课`} />
          <Stat
            icon={CheckCircle2}
            label="已完成"
            value={`${completedCount} / ${totalLessons}`}
          />
        </div>
      </section>

      {/* Continue learning */}
      {cont && (
        <Link
          href={`/lessons/${cont.level}/${cont.number}`}
          className="mb-8 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-lg transition hover:shadow-xl"
        >
          <div className="min-w-0">
            <p className="text-sm text-white/80">继续学习</p>
            <p className="truncate text-xl font-bold">{cont.titleHanzi}</p>
            <p className="truncate text-sm text-white/80">{cont.titlePinyin}</p>
          </div>
          <PlayCircle className="size-12 shrink-0" />
        </Link>
      )}

      {user.memberLevel < 1 ? (
        <div className="rounded-2xl border border-black/10 bg-white/70 p-8 text-center dark:border-white/10 dark:bg-white/5">
          <Lock className="mx-auto mb-3 size-10 text-black/30 dark:text-white/30" />
          <p className="font-medium">当前暂无课程访问权限</p>
          <p className="mt-1 text-sm text-black/50 dark:text-white/50">
            请联系管理员开通相应等级。
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.level}>
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
                  {group.level}
                </span>
                <h2 className="text-xl font-bold">HSK {group.label}</h2>
                <span className="text-sm text-black/40 dark:text-white/40">
                  {group.lessons.length} 课
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.lessons.map((lesson) => {
                  const done = progress.get(lesson.id)?.completed;
                  return (
                    <Link
                      key={lesson.id}
                      href={`/lessons/${group.level}/${lesson.number}`}
                      className="group relative flex flex-col rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-base font-bold text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                          {lesson.number}
                        </span>
                        {done && (
                          <CheckCircle2 className="size-5 text-jade-500" />
                        )}
                      </div>
                      <p className="line-clamp-2 font-semibold leading-snug">
                        {lesson.titleHanzi}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-brand-600">
                        {lesson.titlePinyin}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-black/40 dark:text-white/40">
                        {lesson.titleEnglish}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <Icon className="size-5 text-brand-500" />
      <div>
        <p className="text-xs text-black/45 dark:text-white/45">{label}</p>
        <p className="font-bold">{value}</p>
      </div>
    </div>
  );
}
