/**
 * Rebuild L1-1 sections 6 (01-6) and 7 (01-7) with cropped picture + audio cards.
 * Run: npx tsx scripts/update-l1-picture-sections.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLAY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;

interface WordCard {
  id: string;
  hanzi: string;
  pinyin: string;
  english: string;
  audioFile: string;
  imageDir: "l1-01-6" | "l1-01-7";
}

const MONO: WordCard[] = [
  { id: "yi1", hanzi: "衣", pinyin: "yī", english: "clothes", audioFile: "audio/yi1.mp3", imageDir: "l1-01-6" },
  { id: "wu3", hanzi: "五", pinyin: "wǔ", english: "5", audioFile: "audio/wu3.mp3", imageDir: "l1-01-6" },
  { id: "yu2", hanzi: "鱼", pinyin: "yú", english: "fish", audioFile: "audio/yu2.mp3", imageDir: "l1-01-6" },
  { id: "er3", hanzi: "耳", pinyin: "ěr", english: "ear", audioFile: "audio/er3.mp3", imageDir: "l1-01-6" },
  { id: "bi3", hanzi: "笔", pinyin: "bǐ", english: "pen", audioFile: "audio/bi3.mp3", imageDir: "l1-01-6" },
  { id: "mao1", hanzi: "猫", pinyin: "māo", english: "cat", audioFile: "audio/mao1.mp3", imageDir: "l1-01-6" },
  { id: "dao3", hanzi: "岛", pinyin: "dǎo", english: "island", audioFile: "audio/dao3.mp3", imageDir: "l1-01-6" },
  { id: "hua1", hanzi: "花", pinyin: "huā", english: "flower", audioFile: "audio/hua1.mp3", imageDir: "l1-01-6" },
  { id: "ji1", hanzi: "鸡", pinyin: "jī", english: "chicken", audioFile: "audio/ji1.mp3", imageDir: "l1-01-6" },
  { id: "qi1", hanzi: "七", pinyin: "qī", english: "7", audioFile: "audio/qi1.mp3", imageDir: "l1-01-6" },
  { id: "xie2", hanzi: "鞋", pinyin: "xié", english: "shoes", audioFile: "audio/xie2.mp3", imageDir: "l1-01-6" },
  { id: "xue3", hanzi: "雪", pinyin: "xuě", english: "snow", audioFile: "audio/xue3.mp3", imageDir: "l1-01-6" },
];

const DI: WordCard[] = [
  { id: "ka1fei1", hanzi: "咖啡", pinyin: "kāfēi", english: "coffee", audioFile: "audio/ka1fei1.m4a", imageDir: "l1-01-7" },
  { id: "ke3le4", hanzi: "可乐", pinyin: "kělè", english: "cola", audioFile: "audio/ke3le4.m4a", imageDir: "l1-01-7" },
  { id: "kao3ya1", hanzi: "烤鸭", pinyin: "kǎoyā", english: "roast duck", audioFile: "audio/kao3ya1.m4a", imageDir: "l1-01-7" },
  { id: "huo3guo1", hanzi: "火锅", pinyin: "huǒguō", english: "hotpot", audioFile: "audio/huo3guo1.m4a", imageDir: "l1-01-7" },
  { id: "di4tu2", hanzi: "地图", pinyin: "dìtú", english: "map", audioFile: "audio/di4tu2.m4a", imageDir: "l1-01-7" },
  { id: "fei1ji1", hanzi: "飞机", pinyin: "fēijī", english: "airplane", audioFile: "audio/fei1ji1.m4a", imageDir: "l1-01-7" },
  { id: "mao2bi3", hanzi: "毛笔", pinyin: "máobǐ", english: "writing brush", audioFile: "audio/mao2bi3.m4a", imageDir: "l1-01-7" },
  { id: "er2ji1", hanzi: "耳机", pinyin: "ěrjī", english: "headphones", audioFile: "audio/er2ji1.m4a", imageDir: "l1-01-7" },
];

function cardHtml(w: WordCard): string {
  const img = `/media/img/${w.imageDir}/${w.id}.png`;
  return `<div class="picture-word-card">
  <img class="picture-word-img" src="${img}" alt="${w.hanzi} ${w.pinyin}" width="200" height="150" loading="lazy">
  <div class="picture-word-label"><b>${w.hanzi}</b> <span class="pyn">${w.pinyin}</span><br><span class="eng">${w.english}</span></div>
  <button type="button" class="pinyin-play-btn" aria-label="播放 ${w.pinyin}">${PLAY_SVG}</button>
  <audio class="pinyin-sr-audio" preload="metadata" data-src="${w.audioFile}"></audio>
</div>`;
}

function sectionHtml(
  tag: string,
  titleEn: string,
  titleZh: string,
  words: WordCard[],
): string {
  const cards = words.map(cardHtml).join("\n");
  return `<h4 class="sublesson">${tag}</h4>
<h5>${titleZh}<br><span class="engD">${titleEn}</span></h5>
<div class="picture-word-grid">${cards}</div>`;
}

async function main() {
  const lesson = await prisma.lesson.findUnique({
    where: { level_number: { level: 1, number: 1 } },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (!lesson) throw new Error("L1-1 not found");

  const s6 = lesson.sections.find((s) => s.order === 6);
  const s7 = lesson.sections.find((s) => s.order === 7);
  if (!s6 || !s7) throw new Error("sections 6/7 not found");

  const html6 = sectionHtml(
    "01-6",
    "Look at the pictures and read the monosyllabic words aloud.",
    "看图片，朗读下列单音节词语",
    MONO,
  );
  const html7 = sectionHtml(
    "01-7",
    "Look at the pictures and read the disyllabic words aloud.",
    "看图片，朗读下列双音节词语",
    DI,
  );

  await prisma.lessonSection.update({ where: { id: s6.id }, data: { contentHtml: html6 } });
  await prisma.lessonSection.update({ where: { id: s7.id }, data: { contentHtml: html7 } });

  console.log("Updated L1-1 sections 6 (01-6) and 7 (01-7).");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
