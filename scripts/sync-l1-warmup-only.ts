import { PrismaClient, SectionType } from "@prisma/client";

const prisma = new PrismaClient();

const WARMUP_WORDS: Record<number, string[]> = {
  3: ["中国", "美国", "中国人", "美国人", "老师", "学生"],
  4: ["他", "她", "同学", "朋友", "汉语老师", "中国朋友"],
  5: ["六口人", "家", "女儿", "学生", "70 岁", "20 岁"],
  6: ["妈妈", "汉字", "中国菜", "说汉语", "写汉字", "做中国菜"],
  7: ["书", "中国菜", "学校", "25号", "月", "看书"],
  8: ["钱", "米饭", "杯子", "茶", "中国菜", "汉字"],
  9: ["爸爸", "医生", "医院", "椅子", "猫", "狗"],
  10: ["工作", "看书", "坐", "桌子", "电脑", "爸爸和妈妈"],
};

function warmupHtml(lesson: number): string {
  const words = WARMUP_WORDS[lesson];
  const imgs = ["a", "b", "c", "d", "e", "f"]
    .map(
      (l) =>
        `<figure class="warmup-fig"><img src="/media/img/l1-${String(lesson).padStart(2, "0")}/warmup/${l}.png" alt="${l.toUpperCase()}" loading="lazy"><figcaption>${l.toUpperCase()}</figcaption></figure>`,
    )
    .join("\n");
  const list = words.map((w, i) => `<li><b>${i + 1}.</b> ${w}</li>`).join("\n");
  return `<h3 class="sublesson">热身 Warm-up</h3>
<p>给下面的词语选择对应的图片。<br><span class="engD">Match the pictures with the words/phrases.</span></p>
<div class="warmup-match"><div class="warmup-images">${imgs}</div><ol class="warmup-words">${list}</ol></div>`;
}

async function main() {
  for (let lesson = 3; lesson <= 10; lesson++) {
    const row = await prisma.lesson.findUnique({
      where: { level_number: { level: 1, number: lesson } },
      include: { sections: { orderBy: { order: "asc" } } },
    });
    if (!row) continue;
    const sec =
      row.sections.find((s) => s.type === SectionType.WARMUP) ??
      row.sections.find((s) => !s.contentHtml?.trim()) ??
      row.sections.find(
        (s) =>
          s.type === SectionType.TEXT &&
          (s.contentHtml?.length ?? 0) < 200 &&
          !s.contentHtml?.includes("masked"),
      );
    if (!sec) {
      console.warn(`L1-${lesson}: no slot for warmup`);
      continue;
    }
    await prisma.lessonSection.update({
      where: { id: sec.id },
      data: {
        type: SectionType.WARMUP,
        titleHanzi: "热身",
        titleEnglish: "Warm-up",
        contentHtml: warmupHtml(lesson),
      },
    });
    console.log(`L1-${lesson} warmup → order ${sec.order}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
