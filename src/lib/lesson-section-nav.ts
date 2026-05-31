/** Whether a section should appear in the lesson quick-navigation bar. */
export function isLessonNavAnchor(section: {
  type: string;
  titleHanzi: string | null;
  contentHtml: string | null;
}): boolean {
  const title = section.titleHanzi?.trim() ?? "";
  if (!title || title === "(无)") return false;

  const isDivider = !section.contentHtml?.trim();
  if (isDivider) {
    return /课文|注释|练习|汉字|热身|对话|生词|运用|俗语|拼音|课堂/i.test(title);
  }

  if (section.type === "WORDS") return /生词|专有名词|new word|proper noun/i.test(title);
  if (/^课文\s|^课文[一二三四五]|^对话|Dialogue/i.test(title)) return true;

  return false;
}

export function navAnchorLabel(section: {
  titleHanzi: string | null;
  titlePinyin: string | null;
  type: string;
}): string {
  const title = section.titleHanzi?.trim() ?? "";
  if (title && title !== "(无)") {
    const short = title.replace(/\s*\(.*$/, "").trim();
    return short.length > 18 ? `${short.slice(0, 16)}…` : short;
  }
  const labels: Record<string, string> = {
    TEXT: "课文",
    NOTE: "注释",
    EXERCISE: "练习",
    CHARS: "汉字",
    WORDS: "生词",
    WARMUP: "热身",
    PROVERB: "俗语",
  };
  return labels[section.type] ?? section.titlePinyin?.slice(0, 14) ?? "板块";
}
