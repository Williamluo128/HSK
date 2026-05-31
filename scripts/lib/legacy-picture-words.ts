/**
 * Parse legacy L1 PHP "picture + audio" vocabulary grids from onclick play() buttons.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { load } from "cheerio";

export interface LegacyWordCard {
  audioId: string;
  hanzi: string;
  pinyin: string;
  english: string;
  /** e.g. audio/yi1.mp3 or audio/san3.m4a — resolved from hidden <audio id="..."> */
  audioFile: string | null;
}

export interface LegacyPictureSection {
  lessonNumber: number;
  tag: string; // 01-6, 02-5
  titleEn: string;
  titleZh: string;
  kind: "mono" | "di" | "neutral";
  words: LegacyWordCard[];
}

function parseButtonLabel(html: string): { hanzi: string; pinyin: string; english: string } {
  const parts = html
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map((s) => s.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
  return {
    hanzi: parts[0] ?? "",
    pinyin: parts[1] ?? "",
    english: parts.slice(2).join(" ").trim(),
  };
}

function audioMapFromHtml(html: string): Map<string, string> {
  const $ = load(html);
  const map = new Map<string, string>();
  $("audio").each((_, el) => {
    const id = $(el).attr("id");
    const src = $(el).find("source").attr("src") ?? "";
    if (!id || !src) return;
    const norm = src.replace(/^\.{0,2}\/+/, "").replace(/^mandarin\//, "");
    map.set(id, norm);
  });
  return map;
}

function sectionKind(titleEn: string): "mono" | "di" | "neutral" {
  if (/monosyllabic/i.test(titleEn)) return "mono";
  if (/disyllabic/i.test(titleEn)) return "di";
  return "neutral";
}

const PICTURE_H5 =
  /Look at the pictures and read the (?:mono|di)syllabic words/i;

export function parseLegacyLessonPictureSections(lessonNumber: number): LegacyPictureSection[] {
  const file = path.join(process.cwd(), "legacy", `L1-L${lessonNumber}.php`);
  const raw = readFileSync(file, "utf8").replace(/<\?php[\s\S]*?\?>/g, "");
  const audioMap = audioMapFromHtml(raw);
  const $ = load(raw);
  const sections: LegacyPictureSection[] = [];

  $("h4.sublesson").each((_, h4) => {
    const tagRaw = $(h4).text().replace(/\s+/g, " ").replace(/💿|🎵|\u{1F4BF}/gu, "").trim();
    const tag = tagRaw.match(/\d{2}-\d+/)?.[0];
    if (!tag) return;

    const h5 = $(h4).nextAll("h5").first();
    const titleEn = h5.text().replace(/\s+/g, " ").trim();
    if (!PICTURE_H5.test(titleEn)) return;

    const block = $(h4).closest(".col-xs-12, .col").length
      ? $(h4).closest(".col-xs-12, .col")
      : $(h4).parent();
    const words: LegacyWordCard[] = [];
    let scope = h5.nextUntil("h4.sublesson, h4:not(.sublesson)");
    if (!scope.length) scope = block;
    scope.find("button[onclick*='play(']").each((_, btn) => {
      if ($(btn).attr("disabled")) return;
      const onclick = $(btn).attr("onclick") ?? "";
      const m = onclick.match(/play\(['"]([^'"]+)['"]\)/);
      if (!m) return;
      const audioId = m[1];
      const label = parseButtonLabel($(btn).html() ?? "");
      const audioFile = audioMap.get(audioId) ?? null;
      words.push({ audioId, ...label, audioFile });
    });

    if (words.length === 0) return;

    const kind = sectionKind(titleEn);
    const titleZh =
      kind === "mono"
        ? "看图片，朗读下列单音节词语"
        : "看图片，朗读下列双音节词语";

    sections.push({
      lessonNumber,
      tag,
      titleEn,
      titleZh,
      kind,
      words,
    });
  });

  return sections;
}

export function parseAllL1PictureSections(): LegacyPictureSection[] {
  const files = readdirSync(path.join(process.cwd(), "legacy")).filter((f) => /^L1-L\d+\.php$/i.test(f));
  const nums = files
    .map((f) => parseInt(f.match(/L1-L(\d+)/i)?.[1] ?? "0", 10))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  return nums.flatMap((n) => parseLegacyLessonPictureSections(n));
}
