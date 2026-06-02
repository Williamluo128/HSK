import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getLesson, getAdjacentLessons, LEVEL_LABELS } from "@/lib/lessons";
import { isLessonNavAnchor, navAnchorLabel } from "@/lib/lesson-section-nav";
import { markViewed } from "@/lib/progress";
import { prisma } from "@/lib/db";
import { LessonContent } from "@/components/lesson-content";
import { resolveMediaInHtml } from "@/lib/resolve-media-html";
import { LessonNav } from "@/components/lesson-nav";
import { LessonCompleteButton } from "@/components/lesson-complete-button";

interface PageProps {
  params: Promise<{ level: string; number: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { level, number } = await params;
  const lesson = await getLesson(Number(level), Number(number));
  return { title: lesson ? `${lesson.titleHanzi} (L${level})` : "课程" };
}

export default async function LessonPage({ params }: PageProps) {
  const { level: levelStr, number: numberStr } = await params;
  const level = Number(levelStr);
  const number = Number(numberStr);
  if (!Number.isInteger(level) || !Number.isInteger(number)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (level > user.memberLevel) {
    redirect("/dashboard");
  }

  const lesson = await getLesson(level, number);
  if (!lesson) notFound();

  await markViewed(user.id, lesson.id);

  const [{ prev, next }, progress] = await Promise.all([
    getAdjacentLessons(level, number),
    prisma.userProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
      select: { completed: true },
    }),
  ]);

  const wordCount = lesson.sections.reduce((a, s) => a + s.words.length, 0);
  const navSections = lesson.sections.filter(isLessonNavAnchor);

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-black/50 transition hover:text-brand-600 dark:text-white/50"
      >
        <ArrowLeft className="size-4" />
        返回课程列表
      </Link>

      {/* Lesson header */}
      <header className="mb-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-lg">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
          <span className="rounded-md bg-white/20 px-2 py-0.5">
            HSK {LEVEL_LABELS[level] ?? level}
          </span>
          <span>第 {number} 课</span>
          {wordCount > 0 && <span>· {wordCount} 个生词</span>}
        </div>
        <h1 className="text-3xl font-black leading-tight">
          {lesson.titleHanzi}
        </h1>
        {lesson.titlePinyin && (
          <p className="mt-1 text-lg text-white/90">{lesson.titlePinyin}</p>
        )}
        {lesson.titleEnglish && (
          <p className="mt-0.5 text-white/70">{lesson.titleEnglish}</p>
        )}
      </header>

      {/* Section quick navigation (major blocks only — 课文/注释/练习/汉字…) */}
      {navSections.length > 1 && (
        <nav
          aria-label="课程板块"
          className="mb-6 flex flex-wrap gap-2 rounded-xl border border-black/5 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5"
        >
          {navSections.map((s) => (
            <a
              key={s.id}
              href={`#section-${s.order}`}
              className="rounded-lg bg-black/5 px-3 py-1.5 text-sm font-medium text-black/70 transition hover:bg-brand-500 hover:text-white dark:bg-white/10 dark:text-white/70"
            >
              {navAnchorLabel(s)}
            </a>
          ))}
        </nav>
      )}

      <LessonContent
        sections={lesson.sections.map((s) => ({
          ...s,
          contentHtml: s.contentHtml
            ? resolveMediaInHtml(s.contentHtml)
            : s.contentHtml,
        }))}
      />

      <div className="mt-8 flex justify-center">
        <LessonCompleteButton
          lessonId={lesson.id}
          level={level}
          number={number}
          completed={progress?.completed ?? false}
        />
      </div>

      <LessonNav prev={prev} next={next} />
    </div>
  );
}
