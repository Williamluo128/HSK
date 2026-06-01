import "server-only";
import { prisma } from "@/lib/db";

/** Record that a user opened a lesson (upserts lastViewedAt). */
export async function markViewed(userId: string, lessonId: number) {
  await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {},
    create: { userId, lessonId },
  });
}

export async function setCompleted(
  userId: string,
  lessonId: number,
  completed: boolean,
) {
  await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { completed, completedAt: completed ? new Date() : null },
    create: {
      userId,
      lessonId,
      completed,
      completedAt: completed ? new Date() : null,
    },
  });
}

export interface ProgressInfo {
  completed: boolean;
  lastViewedAt: Date;
}

export async function getProgressMap(
  userId: string,
): Promise<Map<number, ProgressInfo>> {
  const rows = await prisma.userProgress.findMany({
    where: { userId },
    select: { lessonId: true, completed: true, lastViewedAt: true },
  });
  return new Map(
    rows.map((r) => [
      r.lessonId,
      { completed: r.completed, lastViewedAt: r.lastViewedAt },
    ]),
  );
}

/** The most recently viewed lesson, for the "continue learning" entry point. */
export async function getContinueLesson(userId: string) {
  const latest = await prisma.userProgress.findFirst({
    where: { userId },
    orderBy: { lastViewedAt: "desc" },
    include: {
      lesson: {
        select: { level: true, number: true, titleHanzi: true, titlePinyin: true },
      },
    },
  });
  return latest?.lesson
    ? { ...latest.lesson, completed: latest.completed }
    : null;
}
