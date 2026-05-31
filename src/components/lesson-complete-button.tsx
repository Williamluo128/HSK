"use client";

import { useTransition } from "react";
import { Check, Circle } from "lucide-react";
import { toggleLessonComplete } from "@/app/(app)/lessons/progress-actions";
import { cn } from "@/lib/utils";

export function LessonCompleteButton({
  lessonId,
  level,
  number,
  completed,
}: {
  lessonId: number;
  level: number;
  number: number;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(() =>
          toggleLessonComplete(lessonId, level, number, !completed),
        )
      }
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
        completed
          ? "bg-jade-500 text-white hover:bg-jade-600"
          : "border border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10",
      )}
    >
      {completed ? <Check className="size-4" /> : <Circle className="size-4" />}
      {completed ? "已完成" : "标记为已完成"}
    </button>
  );
}
