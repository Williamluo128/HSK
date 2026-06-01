"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { setCompleted } from "@/lib/progress";

export async function toggleLessonComplete(
  lessonId: number,
  level: number,
  number: number,
  completed: boolean,
) {
  const user = await getCurrentUser();
  if (!user) return;
  await setCompleted(user.id, lessonId, completed);
  revalidatePath(`/lessons/${level}/${number}`);
  revalidatePath("/dashboard");
}
