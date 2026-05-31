/**
 * Parses the legacy hard-coded PHP lesson files in `legacy/` and migrates their
 * content into the database (lessons + lesson_sections + words).
 *
 * The legacy markup is irregular, so the strategy is:
 *   1. Extract lesson metadata (level/number from filename, titles from header).
 *   2. Split the body into sections using the h3/h4 heading dividers.
 *   3. Classify each section heuristically (text / words / note / exercise ...).
 *   4. Store cleaned, render-ready HTML per section as the source of truth, and
 *      additionally normalise vocabulary tables into Word rows for richer UI.
 *
 * Run with:  npm run content:migrate
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { load, type CheerioAPI, type Cheerio } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { PrismaClient, SectionType } from "@prisma/client";

const prisma = new PrismaClient();
const LEGACY_DIR = path.join(process.cwd(), "legacy");

const CJK = /[\u3400-\u9fff]/;

interface ParsedWord {
  hanzi: string;
  pinyin: string | null;
  partOfSpeech: string | null;
  english: string | null;
}

interface ParsedSection {
  type: SectionType;
  order: number;
  titleHanzi: string | null;
  titlePinyin: string | null;
  titleEnglish: string | null;
  audioId: string | null;
  contentHtml: string;
  words: ParsedWord[];
}

interface ParsedLesson {
  level: number;
  number: number;
  slug: string;
  titleHanzi: string;
  titlePinyin: string;
  titleEnglish: string;
  sections: ParsedSection[];
}

/** Correct systematic character typos present in the legacy source files
 *  (e.g. 漯文→课文, 汪释→注释, 课堂月语→课堂用语). Applied to the raw markup
 *  before parsing so both titles and body content are normalised. */
const TYPO_FIXES: ReadonlyArray<readonly [RegExp, string]> = [
  [/漯文/g, "课文"],
  [/汪释/g, "注释"],
  [/课堂月语/g, "课堂用语"],
];

function fixTypos(html: string): string {
  return TYPO_FIXES.reduce((acc, [from, to]) => acc.replace(from, to), html);
}

/** Strip leading `../mandarin/` style prefixes so media resolves against the configured base. */
function normaliseMediaPath(src: string): string {
  return src
    .replace(/^\.{0,2}\/+/, "")
    .replace(/^mandarin\//, "")
    .replace(/^mi\//, "");
}

/** Split heading markup on <br> into trimmed text lines.
 *  Interactive/media nodes (play buttons, <audio> fallback text like "No audio")
 *  are stripped first so they don't pollute section titles. */
function headingLines($: CheerioAPI, el: Cheerio<Element>): string[] {
  const clone = el.clone();
  clone.find("button, audio, source, script, img, canvas").remove();
  const html = clone.html() ?? "";
  return html
    .split(/<br\s*\/?>/i)
    .map((chunk) => load(`<div>${chunk}</div>`)("div").text().replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
}

function pickTitleParts(lines: string[]): {
  hanzi: string | null;
  pinyin: string | null;
  english: string | null;
} {
  const hanzi = lines.find((l) => CJK.test(l)) ?? null;
  const latin = lines.filter((l) => !CJK.test(l));
  // Heuristic: first latin line is pinyin, a later distinct line is english.
  const pinyin = latin[0] ?? null;
  const english = latin.length > 1 ? latin[latin.length - 1] : null;
  return { hanzi, pinyin, english };
}

function detectType(text: string): SectionType | null {
  const t = text.toLowerCase();
  if (/热身|warm[\s-]?up/.test(t)) return SectionType.WARMUP;
  if (/谚语|俗语|常用|proverb|saying/.test(t)) return SectionType.PROVERB;
  if (/部件|笔顺|偏旁|部首|汉字|stroke|radical|single comp|character/.test(t))
    return SectionType.CHARS;
  if (/运用|application|双人活动|小组活动|pair work|group work/.test(t))
    return SectionType.EXERCISE;
  if (/注释|汪释|语法|grammar|note/.test(t)) return SectionType.NOTE;
  if (/练习|exercise/.test(t)) return SectionType.EXERCISE;
  if (/生词|new word/.test(t)) return SectionType.WORDS;
  if (/课文|对话|dialogue|text/.test(t)) return SectionType.TEXT;
  return null;
}

/** Classify a section. Group headings (h3) define context; sub-headings (h4)
 *  inherit the current group unless they appear before any group. */
function classify(
  text: string,
  currentGroup: SectionType | null,
  isGroup: boolean,
): SectionType {
  if (isGroup) return detectType(text) ?? SectionType.TEXT;
  if (currentGroup) return currentGroup;
  return detectType(text) ?? SectionType.TEXT;
}

/** Clean a content fragment for safe storage + modern rendering. */
function cleanFragment($: CheerioAPI, container: Cheerio<AnyNode>): string {
  // Preserve pinyin play buttons as semantic tiles (legacy onclick="play('b')").
  container.find("button[onclick*='play(']").each((_, btn) => {
    const $btn = $(btn);
    const onclick = $btn.attr("onclick") ?? "";
    const m = onclick.match(/play\(['"]([^'"]+)['"]\)/);
    if (!m) return;
    const id = m[1];
    const label = $btn.text().trim() || id;
    $btn.replaceWith(
      `<span class="pinyin-tile" data-audio-id="${id}" data-label="${label.replace(/"/g, "&quot;")}"></span>`,
    );
  });

  // Remove other interactive/legacy chrome.
  container.find("script, button, nav, #custom-nav").remove();
  container.find('a[href^="#"]').each((_, a) => {
    const $a = $(a);
    if (/back to top/i.test($a.text())) $a.closest("div").remove();
  });

  // Rewrite media so the client can resolve it against NEXT_PUBLIC_MEDIA_BASE_URL.
  container.find("audio source, audio").each((_, node) => {
    const $n = $(node);
    const src = $n.attr("src");
    if (src) {
      $n.attr("data-src", normaliseMediaPath(src));
      $n.removeAttr("src");
    }
  });
  container.find("img").each((_, img) => {
    const $img = $(img);
    const src = $img.attr("src");
    if (src) {
      $img.attr("data-src", normaliseMediaPath(src));
      $img.removeAttr("src");
    }
  });

  // Drop noisy / unsafe attributes and remap Bootstrap grid to our own class.
  container.find("*").each((_, node) => {
    const el = node as Element;
    if (!el.attribs) return;
    for (const attr of Object.keys(el.attribs)) {
      if (/^on/i.test(attr) || attr === "id" || attr === "style") {
        $(el).removeAttr(attr);
      }
    }
    const cls = el.attribs.class;
    if (cls) {
      const hasCol = /\bcol(-(xs|sm|md|lg)-\d+)?\b/.test(cls);
      const kept = cls
        .split(/\s+/)
        .filter((c) =>
          /^(pyn|eng|xhan|pynD|engD|xhanD|masked|indent|textSection|sublesson|sublessonHeader|tones|dash|dashlite|warmup|warmupans|illustration|strokeOrder|txtNum|pinyin-tile|pinyin-grid|pinyin-cell)$/.test(
            c,
          ),
        );
      if (hasCol) kept.push("lc-col");
      if (/\btable\b/.test(cls)) kept.push("lc-table");
      if (kept.length) $(el).attr("class", kept.join(" "));
      else $(el).removeAttr("class");
    }
  });

  return (container.html() ?? "").replace(/\s+\n/g, "\n").trim();
}

/** Extract vocabulary rows from any 生词/New Words tables inside the fragment. */
function extractWords($: CheerioAPI, container: Cheerio<AnyNode>): ParsedWord[] {
  const words: ParsedWord[] = [];
  container.find("table").each((_, table) => {
    const $table = $(table);
    if (!/生词|new word|专有名词|proper noun/i.test($table.text())) return;
    $table.find("tr").each((_, tr) => {
      const $tr = $(tr);
      if ($tr.find("th").length > 0) return; // header row
      const cells = $tr.find("td").toArray().map((td) => $(td).text().replace(/\s+/g, " ").trim());
      if (cells.length < 2 || !cells[0] || !CJK.test(cells[0])) return;
      if (cells.length >= 4) {
        words.push({ hanzi: cells[0], pinyin: cells[1] || null, partOfSpeech: cells[2] || null, english: cells.slice(3).join(" ") || null });
      } else if (cells.length === 3) {
        words.push({ hanzi: cells[0], pinyin: cells[1] || null, partOfSpeech: null, english: cells[2] || null });
      } else {
        words.push({ hanzi: cells[0], pinyin: cells[1] || null, partOfSpeech: null, english: null });
      }
    });
  });
  return words;
}

function firstAudio($: CheerioAPI, scope: Cheerio<AnyNode>): string | null {
  const node = scope.find("audio source[data-src], audio[data-src]").first();
  return node.attr("data-src") ?? null;
}

function parseLesson(filePath: string): ParsedLesson | null {
  const base = path.basename(filePath, ".php");
  const m = base.match(/^L(\d+)-L(\d+)$/i);
  if (!m) return null;
  const level = parseInt(m[1], 10);
  const number = parseInt(m[2], 10);

  const raw = fixTypos(readFileSync(filePath, "utf8").replace(/<\?php[\s\S]*?\?>/g, ""));
  const $ = load(raw);

  // ---- lesson title from header block ----
  const rightLines = headingLines($, $(".lessonHeaderRight h2").first() as Cheerio<Element>);
  const title = pickTitleParts(rightLines);

  // ---- split body into sections ----
  const $body = $("body");
  $body.find("nav, script, #custom-nav").remove();
  // Drop the lesson title header container (title already extracted above).
  $body.find(".lessonHeaderLeft").closest(".container-fluid, .container").remove();

  // Identify heading elements. All <h3> are section/group dividers; <h4> only
  // when carrying a lesson heading class. <h4 class="sublessonHeader"> and any
  // <h3> set the current group context for the sub-sections that follow.
  function headingInfo(el: Element): { heading: boolean; group: boolean } {
    const tag = el.tagName?.toLowerCase();
    const cls = el.attribs?.class ?? "";
    if (tag === "h3") return { heading: true, group: true };
    if (tag === "h4" && /sublesson|textSection|sublessonHeader/.test(cls)) {
      return { heading: true, group: /sublessonHeader/.test(cls) };
    }
    return { heading: false, group: false };
  }

  // Flatten the (deeply nested) markup into an ordered list of blocks. Wrapper
  // <div>s that contain headings are recursed into so the headings surface as
  // dividers; everything else is kept as a content node (text included).
  type Block =
    | { kind: "heading"; el: Element; group: boolean }
    | { kind: "content"; node: AnyNode };
  const blocks: Block[] = [];

  function flatten(node: AnyNode) {
    $(node)
      .contents()
      .each((_, child) => {
        if (child.type === "text") {
          if ((child.data ?? "").trim().length > 0) {
            blocks.push({ kind: "content", node: child });
          }
          return;
        }
        if (child.type !== "tag") return;
        const el = child as Element;
        const info = headingInfo(el);
        if (info.heading) {
          blocks.push({ kind: "heading", el, group: info.group });
          return;
        }
        const tag = el.tagName?.toLowerCase();
        if (tag === "div" && $(el).find("h3, h4").length > 0) {
          flatten(el);
        } else {
          blocks.push({ kind: "content", node: child });
        }
      });
  }
  const bodyNode = $body.get(0);
  if (bodyNode) flatten(bodyNode);

  const sections: ParsedSection[] = [];
  let order = 0;
  let currentGroup: SectionType | null = null;
  let current: { heading: Element | null; group: boolean; nodes: AnyNode[] } | null = null;

  const flushCurrent = () => {
    if (!current) return;
    const wrap = $("<div></div>");
    const headingEl = current.heading ? ($(current.heading) as Cheerio<Element>) : null;
    if (headingEl) {
      // Pull media (e.g. audio inside the heading) into the body so it is kept.
      headingEl.clone().find("audio, img").appendTo(wrap);
    }
    current.nodes.forEach((n) => wrap.append($(n).clone()));

    const lines = headingEl ? headingLines($, headingEl) : [];
    const headingText = lines.join(" ");
    const tParts = headingEl
      ? pickTitleParts(lines)
      : { hanzi: null, pinyin: null, english: null };
    const html = cleanFragment($, wrap);
    const words = extractWords($, wrap);
    if (!html && !tParts.hanzi && words.length === 0) {
      current = null;
      return;
    }
    const type = classify(headingText, currentGroup, current.group);
    sections.push({
      type,
      order: order++,
      titleHanzi: tParts.hanzi,
      titlePinyin: tParts.pinyin,
      titleEnglish: tParts.english,
      audioId: firstAudio($, wrap),
      contentHtml: html,
      words,
    });
    current = null;
  };

  for (const block of blocks) {
    if (block.kind === "heading") {
      flushCurrent();
      if (block.group) {
        currentGroup = detectType(headingLines($, $(block.el) as Cheerio<Element>).join(" ")) ?? currentGroup;
      }
      current = { heading: block.el, group: block.group, nodes: [] };
    } else {
      if (!current) current = { heading: null, group: false, nodes: [] };
      current.nodes.push(block.node);
    }
  }
  flushCurrent();

  return {
    level,
    number,
    slug: `L${level}-${number}`,
    titleHanzi: title.hanzi ?? `第 ${number} 课`,
    titlePinyin: title.pinyin ?? "",
    titleEnglish: title.english ?? `Lesson ${number}`,
    sections,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const files = readdirSync(LEGACY_DIR)
    .filter((f) => /^L\d+-L\d+\.php$/i.test(f))
    .sort();

  console.log(`Found ${files.length} legacy lesson files.${dryRun ? " (dry run)" : ""}`);

  if (dryRun) {
    let secs = 0;
    let words = 0;
    const byType: Record<string, number> = {};
    for (const file of files) {
      const parsed = parseLesson(path.join(LEGACY_DIR, file));
      if (!parsed) {
        console.warn(`  skipped ${file}`);
        continue;
      }
      secs += parsed.sections.length;
      for (const s of parsed.sections) {
        byType[s.type] = (byType[s.type] ?? 0) + 1;
        words += s.words.length;
      }
      console.log(
        `  ${parsed.slug.padEnd(8)} L${parsed.level} | ${parsed.titlePinyin} / ${parsed.titleHanzi} / ${parsed.titleEnglish} — ${parsed.sections.length} sections, ${parsed.sections.reduce((a, s) => a + s.words.length, 0)} words`,
      );
    }
    console.log(`\nDry run: ${files.length} lessons, ${secs} sections, ${words} words.`);
    console.log("Section types:", byType);
    return;
  }

  // Idempotent: wipe existing lesson content (cascades to sections/words).
  await prisma.lesson.deleteMany({});

  let totalSections = 0;
  let totalWords = 0;

  for (const file of files) {
    const parsed = parseLesson(path.join(LEGACY_DIR, file));
    if (!parsed) {
      console.warn(`  skipped ${file}`);
      continue;
    }

    const lesson = await prisma.lesson.create({
      data: {
        level: parsed.level,
        number: parsed.number,
        slug: parsed.slug,
        titleHanzi: parsed.titleHanzi,
        titlePinyin: parsed.titlePinyin,
        titleEnglish: parsed.titleEnglish,
      },
    });

    for (const s of parsed.sections) {
      const section = await prisma.lessonSection.create({
        data: {
          lessonId: lesson.id,
          type: s.type,
          order: s.order,
          titleHanzi: s.titleHanzi,
          titlePinyin: s.titlePinyin,
          titleEnglish: s.titleEnglish,
          audioId: s.audioId,
          contentHtml: s.contentHtml,
        },
      });
      if (s.words.length) {
        await prisma.word.createMany({
          data: s.words.map((w, i) => ({
            sectionId: section.id,
            order: i,
            hanzi: w.hanzi.slice(0, 64),
            pinyin: w.pinyin?.slice(0, 128) ?? null,
            partOfSpeech: w.partOfSpeech?.slice(0, 32) ?? null,
            english: w.english ?? null,
          })),
        });
        totalWords += s.words.length;
      }
    }

    totalSections += parsed.sections.length;
    console.log(
      `  ${parsed.slug.padEnd(8)} ${parsed.titleHanzi} — ${parsed.sections.length} sections`,
    );
  }

  console.log(
    `\nDone. Imported ${files.length} lessons, ${totalSections} sections, ${totalWords} words.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
