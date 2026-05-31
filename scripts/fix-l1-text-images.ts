/**
 * Re-attach text-N.png only to dialogue TEXT sections (with masked speaker lines).
 * Strips mistaken figures from short audio-only blocks.
 */
import { PrismaClient, SectionType } from "@prisma/client";

const prisma = new PrismaClient();

const FIGURE_RE =
  /<figure class="lesson-text-figure">[\s\S]*?<\/figure>\s*/g;

function textFigure(lesson: number, textNum: number): string {
  const src = `/media/img/l1-${String(lesson).padStart(2, "0")}/text-${textNum}.png`;
  return `<figure class="lesson-text-figure"><img class="lesson-passage-img" src="${src}" alt="" loading="lazy"></figure>`;
}

function injectFigure(html: string, figure: string): string {
  const stripped = html.replace(FIGURE_RE, "");
  const audioIdx = stripped.search(/<audio/i);
  if (audioIdx >= 0) return stripped.slice(0, audioIdx) + figure + stripped.slice(audioIdx);
  return figure + stripped;
}

async function main() {
  for (let lesson = 1; lesson <= 15; lesson++) {
    const row = await prisma.lesson.findUnique({
      where: { level_number: { level: 1, number: lesson } },
      include: { sections: { orderBy: { order: "asc" } } },
    });
    if (!row) continue;

    const dialogues = row.sections
      .filter((s) => s.type === SectionType.TEXT && s.contentHtml?.includes("masked"))
      .sort((a, b) => a.order - b.order);

    for (let i = 0; i < Math.min(3, dialogues.length); i++) {
      const sec = dialogues[i];
      const html = injectFigure(sec.contentHtml ?? "", textFigure(lesson, i + 1));
      await prisma.lessonSection.update({ where: { id: sec.id }, data: { contentHtml: html } });
    }

    for (const sec of row.sections) {
      if (
        sec.type === SectionType.TEXT &&
        !sec.contentHtml?.includes("masked") &&
        sec.contentHtml?.includes("lesson-passage-img")
      ) {
        await prisma.lessonSection.update({
          where: { id: sec.id },
          data: { contentHtml: sec.contentHtml!.replace(FIGURE_RE, "") },
        });
        console.log(`L1-${lesson} cleared stray figure order ${sec.order}`);
      }
    }
    console.log(`L1-${lesson} dialogues ${dialogues.length}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
