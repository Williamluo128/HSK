"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { setCompleted } from "@/lib/progress";

export async function toggleLessonComplete(
  lessonId: number,
  level: number,
  number: number,
  completed: boolean,
) {
  const session = await auth();
  if (!session?.user) return;
  await setCompleted(Number(session.user.id), lessonId, completed);
  revalidatePath(`/lessons/${level}/${number}`);
  revalidatePath("/dashboard");
}
