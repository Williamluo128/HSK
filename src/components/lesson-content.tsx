"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Languages, Eye, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { hydrateLessonContent } from "./lesson-media";

export interface SectionData {
  id: number;
  type: string;
  order: number;
  titleHanzi: string | null;
  titlePinyin: string | null;
  titleEnglish: string | null;
  audioId: string | null;
  contentHtml: string | null;
}

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  TEXT: { label: "课文", className: "bg-jade-500/15 text-jade-600" },
  DIALOGUE: { label: "对话", className: "bg-jade-500/15 text-jade-600" },
  WORDS: { label: "生词", className: "bg-brand-500/15 text-brand-600" },
  NOTE: { label: "语法", className: "bg-amber-500/15 text-amber-600" },
  EXERCISE: { label: "练习", className: "bg-blue-500/15 text-blue-600" },
  PROVERB: { label: "谚语", className: "bg-purple-500/15 text-purple-600" },
  CHARS: { label: "汉字", className: "bg-pink-500/15 text-pink-600" },
  WARMUP: { label: "热身", className: "bg-teal-500/15 text-teal-600" },
};

function Toggle({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
        active
          ? "bg-brand-500 text-white shadow-sm"
          : "bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15",
      )}
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}

export function LessonContent({ sections }: { sections: SectionData[] }) {
  const [pinyin, setPinyin] = useState(true);
  const [english, setEnglish] = useState(false);
  const [hanzi, setHanzi] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  // Hydrate legacy HTML after each paint (React may reset dangerouslySetInnerHTML).
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root) hydrateLessonContent(root);
  });

  return (
    <div ref={rootRef}>
      {/* Sticky annotation toolbar */}
      <div className="sticky top-16 z-30 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b border-black/5 bg-paper/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#0f0f1a]/90">
        <span className="mr-1 text-sm font-medium text-black/50 dark:text-white/50">
          显示
        </span>
        <Toggle active={pinyin} onClick={() => setPinyin((v) => !v)} icon={Eye}>
          拼音
        </Toggle>
        <Toggle
          active={english}
          onClick={() => setEnglish((v) => !v)}
          icon={Languages}
        >
          翻译
        </Toggle>
        <Toggle active={hanzi} onClick={() => setHanzi((v) => !v)} icon={Type}>
          例句汉字
        </Toggle>
      </div>

      <div className="space-y-5">
        {sections.map((section) => {
          const badge = TYPE_BADGE[section.type] ?? {
            label: section.type,
            className: "bg-black/10 text-black/60",
          };

          // Group-label headings (e.g. 注释 Notes / 汉字 Characters) carry no
          // body of their own — render them as a section divider, not a card.
          const isDivider = !section.contentHtml?.trim();
          if (isDivider) {
            return (
              <div
                key={section.id}
                id={`section-${section.order}`}
                className="scroll-mt-32 flex items-center gap-3 pt-4"
              >
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                    badge.className,
                  )}
                >
                  {badge.label}
                </span>
                <h2 className="text-xl font-black">
                  {section.titleHanzi || section.titlePinyin}
                </h2>
                <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              </div>
            );
          }

          return (
            <section
              key={section.id}
              id={`section-${section.order}`}
              className="scroll-mt-32 rounded-2xl border border-black/5 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <div className="mb-3 flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                    badge.className,
                  )}
                >
                  {badge.label}
                </span>
                <div className="min-w-0">
                  {section.titleHanzi && (
                    <h2 className="text-lg font-bold leading-snug">
                      {section.titleHanzi}
                    </h2>
                  )}
                  {section.titlePinyin && (
                    <p className="text-sm text-brand-600">
                      {section.titlePinyin}
                    </p>
                  )}
                  {section.titleEnglish && (
                    <p className="text-sm text-black/50 dark:text-white/50">
                      {section.titleEnglish}
                    </p>
                  )}
                </div>
              </div>

              <div
                className="lesson-content"
                data-pinyin={pinyin ? "on" : "off"}
                data-english={english ? "on" : "off"}
                data-hanzi={hanzi ? "on" : "off"}
                dangerouslySetInnerHTML={{ __html: section.contentHtml ?? "" }}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
