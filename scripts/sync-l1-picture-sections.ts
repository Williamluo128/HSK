/**
 * Crop PDF picture grids + rebuild DB sections for L1 picture-word exercises.
 * Run: npx tsx scripts/sync-l1-picture-sections.ts
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  parseAllL1PictureSections,
  type LegacyPictureSection,
} from "./lib/legacy-picture-words";

const prisma = new PrismaClient();
const ROOT = process.cwd();
const PYTHON = "/opt/anaconda3/bin/python";

const PLAY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;

/** L1-1 / L1-2 picture grids use user screenshots (crop-l1 / crop-l2 scripts). */
const L2_CROP_TAGS = new Set(["02-5", "02-6"]);

function normalizeAudio(src: string | null, audioId: string): string {
  if (src) {
    return src.startsWith("audio/") ? src : `audio/${src.replace(/^\.?\/?mandarin\//, "")}`;
  }
  return `audio/${audioId}.m4a`;
}

function cardHtml(
  w: LegacyPictureSection["words"][0],
  imageDir: string,
  withImage: boolean,
): string {
  const audio = normalizeAudio(w.audioFile, w.audioId);
  const img = withImage
    ? `<img class="picture-word-img" src="/media/img/${imageDir}/${w.audioId}.png" alt="${w.hanzi} ${w.pinyin}" width="200" height="150" loading="lazy">`
    : "";
  return `<div class="picture-word-card">
  ${img}
  <div class="picture-word-label"><b>${w.hanzi}</b> <span class="pyn">${w.pinyin}</span><br><span class="eng">${w.english}</span></div>
  <button type="button" class="pinyin-play-btn" aria-label="播放 ${w.pinyin}">${PLAY_SVG}</button>
  <audio class="pinyin-sr-audio" preload="metadata" data-src="${audio}"></audio>
</div>`;
}

function sectionHtml(sec: LegacyPictureSection, withImage: boolean): string {
  const imageDir = `l1-${sec.tag}`;
  const cards = sec.words.map((w) => cardHtml(w, imageDir, withImage)).join("\n");
  return `<h4 class="sublesson">${sec.tag}</h4>
<h5>${sec.titleZh}<br><span class="engD">${sec.titleEn}</span></h5>
<div class="picture-word-grid">${cards}</div>`;
}

function cropImages(sections: LegacyPictureSection[]) {
  const needsL1 = sections.some((s) => s.tag.startsWith("01-"));
  const needsL2 = sections.some((s) => L2_CROP_TAGS.has(s.tag));
  if (needsL1) {
    execSync(`${PYTHON} ${path.join(ROOT, "scripts/crop-l1-picture-words.py")}`, {
      stdio: "inherit",
      cwd: ROOT,
    });
  }
  if (needsL2) {
    execSync(`${PYTHON} ${path.join(ROOT, "scripts/crop-l2-picture-words.py")}`, {
      stdio: "inherit",
      cwd: ROOT,
    });
  }
}

async function findPictureSection(lessonId: number, kind: "mono" | "di") {
  const sections = await prisma.lessonSection.findMany({
    where: { lessonId },
    orderBy: { order: "asc" },
  });
  const re =
    kind === "mono"
      ? /Look at the pictures and read the monosyllabic words/i
      : /Look at the pictures and read the disyllabic words/i;
  return sections.find((s) => re.test(s.contentHtml ?? ""));
}

async function main() {
  const all = parseAllL1PictureSections();
  console.log(
    "Picture sections:",
    all.map((s) => `L1-${s.lessonNumber} ${s.tag} (${s.words.length})`).join(", "),
  );

  cropImages(all);

  for (const sec of all) {
    const lesson = await prisma.lesson.findUnique({
      where: { level_number: { level: 1, number: sec.lessonNumber } },
    });
    if (!lesson) {
      console.warn(`Lesson L1-${sec.lessonNumber} not found`);
      continue;
    }

    const dbSec = await findPictureSection(lesson.id, sec.kind === "di" ? "di" : "mono");
    if (!dbSec) {
      console.warn(`Section ${sec.tag} not in DB for L1-${sec.lessonNumber}`);
      continue;
    }

    const withImage = sec.tag.startsWith("01-") || L2_CROP_TAGS.has(sec.tag);
    await prisma.lessonSection.update({
      where: { id: dbSec.id },
      data: { contentHtml: sectionHtml(sec, withImage) },
    });
    console.log(`Updated L1-${sec.lessonNumber} ${sec.tag} (images=${withImage})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
