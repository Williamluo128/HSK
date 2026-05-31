import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Adjacent {
  level: number;
  number: number;
  titleHanzi: string;
}

export function LessonNav({
  prev,
  next,
}: {
  prev: Adjacent | null;
  next: Adjacent | null;
}) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3">
      {prev ? (
        <Link
          href={`/lessons/${prev.level}/${prev.number}`}
          className="group flex items-center gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 transition hover:border-brand-300 hover:shadow-md dark:border-white/10 dark:bg-white/5"
        >
          <ChevronLeft className="size-5 shrink-0 text-brand-500" />
          <span className="min-w-0">
            <span className="block text-xs text-black/40 dark:text-white/40">
              上一课 · 第 {prev.number} 课
            </span>
            <span className="block truncate font-medium">{prev.titleHanzi}</span>
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/lessons/${next.level}/${next.number}`}
          className="group flex items-center justify-end gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 text-right transition hover:border-brand-300 hover:shadow-md dark:border-white/10 dark:bg-white/5"
        >
          <span className="min-w-0">
            <span className="block text-xs text-black/40 dark:text-white/40">
              下一课 · 第 {next.number} 课
            </span>
            <span className="block truncate font-medium">{next.titleHanzi}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-brand-500" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
