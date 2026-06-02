import { mediaUrl } from "@/lib/utils";
import { hydratePinyinLesson } from "@/components/hydrate-pinyin";
import { hydratePictureWordCards } from "@/components/hydrate-picture-words";

function guessAudioType(url: string): string {
  if (url.endsWith(".m4a")) return "audio/mp4";
  if (url.endsWith(".wav")) return "audio/wav";
  if (url.endsWith(".ogg")) return "audio/ogg";
  return "audio/mpeg";
}

/**
 * Presentation-layer hydration for migrated lesson HTML.
 *
 * The legacy content references a lot of media that no longer exists as static
 * files. Instead of shipping hundreds of images, we upgrade the experience here:
 *   - 整字笔顺 (`img.strokeOrder`) and single-character cards (`img.lessonImg`)
 *     become interactive HanziWriter widgets (animated stroke order + tracing).
 *   - The 8 basic compound strokes (横折提 etc.) are drawn as inline SVG.
 *   - Picture-matching exercise images (curriculum-specific, unavailable) are
 *     dropped so the surrounding text remains a usable, picture-free task.
 * The database stays a faithful copy of the source; all of this is view-only.
 */

let hanziWriterLoader: Promise<typeof import("hanzi-writer").default> | null = null;
function loadHanziWriter() {
  if (!hanziWriterLoader) {
    hanziWriterLoader = import("hanzi-writer").then((m) => m.default);
  }
  return hanziWriterLoader;
}

const CJK = /[\u3400-\u9fff\uF900-\uFAFF]/;
function firstHanzi(value: string | null | undefined): string | null {
  const match = value?.match(CJK);
  return match ? match[0] : null;
}

/** Legacy stroke-order GIFs use filenames like `img/一-order.gif`. */
function charFromStrokeSrc(src: string | null): string | null {
  const m = src?.match(/([\u3400-\u9fff])-order\.(?:gif|png)/i);
  return m?.[1] ?? null;
}

/** Style picture-matching prompts after their images were removed (text-only tasks). */
function formatVocabPromptItems(root: HTMLElement): void {
  root.querySelectorAll<HTMLDivElement>(".lc-col").forEach((col) => {
    if (col.querySelector("img")) return;
    const text = col.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (/^\d+\s+[\u3400-\u9fff]/.test(text)) col.classList.add("vocab-prompt-item");
  });
}

/** Stylised SVG approximations of the basic compound strokes (illustrative). */
const STROKE_SHAPES: Record<string, { label: string; paths: { d: string; hook?: boolean }[] }> = {
  wangou: { label: "弯钩", paths: [{ d: "M34 8 C 41 26, 41 42, 33 52" }, { d: "M33 52 C 29 57, 22 56, 19 50", hook: true }] },
  shuti: { label: "竖提", paths: [{ d: "M30 8 L30 45 L54 32" }] },
  hengzheti: { label: "横折提", paths: [{ d: "M13 15 L42 15 L42 44 L60 31" }] },
  hengpiewangou: {
    label: "横撇弯钩",
    paths: [{ d: "M13 13 L41 13 L24 33 C 22 43, 30 51, 38 46" }, { d: "M38 46 C 35 50, 30 50, 28 47", hook: true }],
  },
  hengzhexiegou: {
    label: "横折斜钩",
    paths: [{ d: "M13 13 L33 13 C 43 30, 51 45, 55 55" }, { d: "M55 55 C 49 55, 44 53, 42 48", hook: true }],
  },
  hengzhezhepie: { label: "横折折撇", paths: [{ d: "M15 13 L35 13 L35 27 L49 27 L29 51" }] },
  hengzhezhezhegou: {
    label: "横折折折钩",
    paths: [{ d: "M13 13 L35 13 L35 26 L19 26 L19 44 L43 44" }, { d: "M43 44 L43 36", hook: true }],
  },
  shuzhezhegou: {
    label: "竖折折钩",
    paths: [{ d: "M24 9 L24 31 L45 31 L45 50" }, { d: "M45 50 L36 50", hook: true }],
  },
};

function strokeStemFromSrc(src: string | null): string | null {
  if (!src) return null;
  const m = src.match(/([a-z]+)\.(?:png|gif|jpg)$/i);
  const stem = m?.[1]?.toLowerCase();
  return stem && stem in STROKE_SHAPES ? stem : null;
}

function buildStrokeSvg(stem: string, pinyin: string | null): HTMLElement {
  const shape = STROKE_SHAPES[stem];
  const fig = document.createElement("figure");
  fig.className = "stroke-shape";
  const paths = shape.paths
    .map(
      (p) =>
        `<path d="${p.d}" fill="none" stroke="${p.hook ? "#e11d48" : "#1f2937"}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join("");
  fig.innerHTML = `
    <svg viewBox="0 0 64 64" width="72" height="72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.12"/>
      <line x1="32" y1="4" x2="32" y2="60" stroke="currentColor" stroke-opacity="0.12" stroke-dasharray="3 3"/>
      <line x1="4" y1="32" x2="60" y2="32" stroke="currentColor" stroke-opacity="0.12" stroke-dasharray="3 3"/>
      ${paths}
    </svg>
    <figcaption><b>${shape.label}</b>${pinyin ? `<span>${pinyin}</span>` : ""}</figcaption>`;
  return fig;
}

interface HanziTarget {
  el: HTMLElement;
  char: string;
  caption: string;
}

function buildHanziWidget(
  HanziWriter: typeof import("hanzi-writer").default,
  char: string,
  caption: string,
): HTMLElement {
  const fig = document.createElement("figure");
  fig.className = "hanzi-widget";

  const target = document.createElement("div");
  target.className = "hanzi-target";

  const cap = document.createElement("figcaption");
  cap.textContent = caption;

  const actions = document.createElement("div");
  actions.className = "hanzi-actions";

  const mkBtn = (label: string) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    return b;
  };
  const animateBtn = mkBtn("笔顺");
  const quizBtn = mkBtn("描红");
  const resetBtn = mkBtn("重置");
  actions.append(animateBtn, quizBtn, resetBtn);

  fig.append(target, cap, actions);

  const writer = HanziWriter.create(target, char, {
    width: 96,
    height: 96,
    padding: 4,
    showOutline: true,
    showCharacter: true,
    strokeAnimationSpeed: 1.2,
    delayBetweenStrokes: 160,
    strokeColor: "#1f2937",
    outlineColor: "#cbd5e1",
    radicalColor: "#e11d48",
    drawingColor: "#e11d48",
  });

  animateBtn.addEventListener("click", () => writer.animateCharacter());
  quizBtn.addEventListener("click", () => {
    writer.hideCharacter();
    writer.quiz();
  });
  resetBtn.addEventListener("click", () => writer.showCharacter());

  return fig;
}

export function hydrateLessonContent(root: HTMLElement): void {
  hydratePinyinLesson(root);

  root.querySelectorAll("audio").forEach((audio) => {
    const source = audio.querySelector("source[data-src], source[src]");
    const raw =
      source?.getAttribute("data-src") ??
      source?.getAttribute("src") ??
      audio.getAttribute("data-src");
    if (!raw) return;
    const url = mediaUrl(raw);
    if (source) {
      source.setAttribute("src", url);
      source.setAttribute("type", source.getAttribute("type") ?? guessAudioType(url));
    }
    audio.setAttribute("src", url);
  });

  root.querySelectorAll<HTMLElement>(".tones").forEach((el) => {
    el.innerHTML = toneChartMarkup();
  });

  // Basic compound strokes → inline SVG.
  root.querySelectorAll<HTMLImageElement>("img[data-src], img[src]").forEach((img) => {
    const src = img.getAttribute("data-src") ?? img.getAttribute("src");
    const stem = strokeStemFromSrc(src);
    if (stem) img.replaceWith(buildStrokeSvg(stem, img.getAttribute("alt")));
  });

  // Drop legacy exercise thumbnails (e.g. 3-9-1.png). Keep textbook crops.
  root.querySelectorAll<HTMLImageElement>("img[data-src], img[src]").forEach((img) => {
    if (
      img.classList.contains("picture-word-img") ||
      img.classList.contains("lesson-passage-img")
    ) {
      return;
    }
    const src = img.getAttribute("data-src") ?? img.getAttribute("src") ?? "";
    const base = src.replace(/^.*\//, "");
    if (/^\d/.test(base)) img.remove();
  });

  // Collect stroke-order + single-character images for HanziWriter.
  const targets: HanziTarget[] = [];
  root.querySelectorAll<HTMLImageElement>("img.strokeOrder").forEach((img) => {
    const src = img.getAttribute("data-src") ?? img.getAttribute("src");
    const char =
      firstHanzi(img.getAttribute("alt")) ??
      charFromStrokeSrc(src) ??
      firstHanzi(src);
    if (char) targets.push({ el: img, char, caption: img.getAttribute("alt")?.trim() || char });
  });
  root.querySelectorAll<HTMLImageElement>("img.lessonImg").forEach((img) => {
    const src = img.getAttribute("data-src") ?? img.getAttribute("src") ?? "";
    const alt = img.getAttribute("alt") ?? "";
    // Single-character flashcards use pinyin+tone filenames and lead with a hanzi.
    if (/[a-z]+\d+\.(png|jpg)$/i.test(src) && CJK.test(alt.trim().charAt(0))) {
      const char = firstHanzi(alt);
      if (char) targets.push({ el: img, char, caption: alt.trim() });
    }
  });

  // Resolve any remaining real images (e.g. radical stroke GIFs) against the base.
  root.querySelectorAll<HTMLImageElement>("img[data-src]").forEach((img) => {
    if (targets.some((t) => t.el === img)) return;
    const src = img.getAttribute("data-src");
    if (src) img.src = mediaUrl(src);
  });

  root.querySelectorAll("audio").forEach((a) => a.load());
  hydratePictureWordCards(root);
  formatVocabPromptItems(root);

  if (targets.length > 0) {
    loadHanziWriter().then((HanziWriter) => {
      targets.forEach(({ el, char, caption }) => {
        if (!el.isConnected) return;
        try {
          el.replaceWith(buildHanziWidget(HanziWriter, char, caption));
        } catch {
          /* leave the original node if the character has no data */
        }
      });
    });
  }
}

/** Inline SVG for the four Mandarin tones, injected into legacy `.tones` blocks. */
function toneChartMarkup(): string {
  const tones = [
    { d: "M4,6 L76,6", label: "第一声 ā" },
    { d: "M4,38 Q40,36 76,6", label: "第二声 á" },
    { d: "M4,16 Q40,46 40,30 Q40,12 76,28", label: "第三声 ǎ" },
    { d: "M4,6 L76,38", label: "第四声 à" },
  ];
  return `<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">${tones
    .map(
      (t) => `<figure style="margin:0;text-align:center">
        <svg width="80" height="44" viewBox="0 0 80 44" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="6" x2="80" y2="6" stroke="currentColor" stroke-opacity="0.15"/>
          <line x1="0" y1="22" x2="80" y2="22" stroke="currentColor" stroke-opacity="0.15"/>
          <line x1="0" y1="38" x2="80" y2="38" stroke="currentColor" stroke-opacity="0.15"/>
          <path d="${t.d}" fill="none" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <figcaption style="font-size:12px;opacity:0.7">${t.label}</figcaption>
      </figure>`,
    )
    .join("")}</div>`;
}
