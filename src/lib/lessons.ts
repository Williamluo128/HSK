import "server-only";
import { prisma } from "@/lib/db";

export const LEVEL_LABELS: Record<number, string> = {
  1: "一级",
  2: "二级",
  3: "三级",
  4: "四级",
  5: "五级",
  6: "六级",
};

/** Levels a member with the given access level may view (matches legacy menu.php). */
export function accessibleLevels(memberLevel: number): number[] {
  if (memberLevel < 1) return [];
  return Array.from({ length: Math.min(memberLevel, 6) }, (_, i) => i + 1);
}

export interface LevelGroup {
  level: number;
  label: string;
  lessons: {
    id: number;
    number: number;
    slug: string;
    titleHanzi: string;
    titlePinyin: string;
    titleEnglish: string;
  }[];
}

/** All lessons grouped by level, limited to the levels a member can access. */
export async function getLessonsForMember(
  memberLevel: number,
): Promise<LevelGroup[]> {
  const levels = accessibleLevels(memberLevel);
  if (levels.length === 0) return [];

  const lessons = await prisma.lesson.findMany({
    where: { level: { in: levels } },
    orderBy: [{ level: "asc" }, { number: "asc" }],
    select: {
      id: true,
      level: true,
      number: true,
      slug: true,
      titleHanzi: true,
      titlePinyin: true,
      titleEnglish: true,
    },
  });

  return levels.map((level) => ({
    level,
    label: LEVEL_LABELS[level] ?? `Level ${level}`,
    lessons: lessons.filter((l) => l.level === level),
  }));
}

export async function getLesson(level: number, number: number) {
  return prisma.lesson.findUnique({
    where: { level_number: { level, number } },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { words: { orderBy: { order: "asc" } } },
      },
    },
  });
}

/** Previous/next lesson within the same level for navigation. */
export async function getAdjacentLessons(level: number, number: number) {
  const [prev, next] = await Promise.all([
    prisma.lesson.findFirst({
      where: { level, number: { lt: number } },
      orderBy: { number: "desc" },
      select: { level: true, number: true, titleHanzi: true },
    }),
    prisma.lesson.findFirst({
      where: { level, number: { gt: number } },
      orderBy: { number: "asc" },
      select: { level: true, number: true, titleHanzi: true },
    }),
  ]);
  return { prev, next };
}

export type LessonWithSections = NonNullable<
  Awaited<ReturnType<typeof getLesson>>
>;
