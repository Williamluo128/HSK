import { mediaUrl } from "@/lib/utils";
import {
  L1_FINALS,
  L1_INITIALS,
  L1_TONE_ROWS,
  type PinyinTile,
  pinyinAudioPath,
} from "@/lib/l1-pinyin-data";

const PLAY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;

let activeAudio: HTMLAudioElement | null = null;

function audioDataSrc(audio: HTMLAudioElement): string {
  return (
    audio.querySelector("source")?.getAttribute("data-src") ??
    audio.getAttribute("data-src") ??
    audio.getAttribute("src") ??
    ""
  );
}

/** Dialogue / passage clips (01-01.mp3 …) — keep visible player in 课文 sections. */
function isLessonPassageAudio(src: string): boolean {
  return /audio\/\d{2}-\d{2}\.(mp3|m4a)/i.test(src);
}

/** Hidden sound-bank files bundled with the pinyin section (i_b.m4a, a1.m4a, …). */
function isPinyinSoundBankAudio(src: string): boolean {
  if (!src || isLessonPassageAudio(src)) return false;
  return (
    /audio\/i_[a-z]+\.m4a/i.test(src) ||
    /audio\/f_[a-z0-9]+\.m4a/i.test(src) ||
    /audio\/[a-z]{1,3}[1-4]\.m4a/i.test(src)
  );
}

function pauseOthers(except: HTMLAudioElement) {
  document.querySelectorAll<HTMLAudioElement>(".lesson-content .pinyin-sr-audio").forEach((a) => {
    if (a !== except) {
      a.pause();
      a.closest(".pinyin-cell")?.classList.remove("is-playing");
    }
  });
}

function createPinyinCell(
  tile: PinyinTile,
  kind: "initial" | "final" | "tone",
  toneIndex?: number,
): HTMLElement {
  const cell = document.createElement("div");
  cell.className = "pinyin-cell";
  if (toneIndex !== undefined) cell.classList.add(`tone-${toneIndex + 1}`);

  const letter = document.createElement("span");
  letter.className = "pinyin-letter";
  letter.textContent = tile.label;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pinyin-play-btn";
  btn.setAttribute("aria-label", `播放 ${tile.label}`);
  btn.innerHTML = PLAY_SVG;

  const audio = document.createElement("audio");
  audio.className = "pinyin-sr-audio";
  audio.preload = "metadata";
  audio.src = mediaUrl(pinyinAudioPath(tile.audioId, kind));

  btn.addEventListener("click", () => {
    if (activeAudio && activeAudio !== audio) {
      activeAudio.pause();
      activeAudio.closest(".pinyin-cell")?.classList.remove("is-playing");
    }
    pauseOthers(audio);
    if (audio.paused) {
      audio.currentTime = 0;
      void audio.play();
      cell.classList.add("is-playing");
      activeAudio = audio;
    } else {
      audio.pause();
      cell.classList.remove("is-playing");
      activeAudio = null;
    }
  });
  audio.addEventListener("ended", () => {
    cell.classList.remove("is-playing");
    if (activeAudio === audio) activeAudio = null;
  });

  cell.append(letter, btn, audio);
  return cell;
}

function buildGrid(tiles: PinyinTile[], kind: "initial" | "final"): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "pinyin-grid";
  tiles.forEach((t) => grid.appendChild(createPinyinCell(t, kind)));
  return grid;
}

function findPinyinPanel(h5: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = h5.parentElement;
  for (let depth = 0; depth < 6 && el; depth++) {
    if (!el.classList.contains("lc-col")) {
      el = el.parentElement;
      continue;
    }
    const emptySlots = [...el.querySelectorAll(".lc-col")].filter(
      (c) => c !== h5.closest(".lc-col") && !c.textContent?.trim(),
    );
    if (emptySlots.length >= 3) return el;
    el = el.parentElement;
  }
  return null;
}

/** 替换声母/韵母标题下空的 lc-col 占位为字母+圆形播放按钮网格 */
function rebuildInitialsOrFinals(h5: HTMLElement, tiles: PinyinTile[], kind: "initial" | "final") {
  const panel = findPinyinPanel(h5);
  if (!panel || panel.querySelector(".pinyin-grid")) return;

  const children = [...panel.children];
  const headerIdx = children.findIndex((c) => c.contains(h5));
  if (headerIdx < 0) return;

  children.slice(headerIdx + 1).forEach((c) => c.remove());
  panel.appendChild(buildGrid(tiles, kind));
}

function rebuildToneSyllables(root: HTMLElement) {
  const heading = [...root.querySelectorAll<HTMLElement>("h5")].find((h) =>
    /Read the syllables|pay attention to the tones|朗读.*音节|声调/i.test(h.textContent ?? ""),
  );
  if (!heading) return;

  // 移除标题后串联的默认 <audio controls> 与空的 .tones 占位
  let node: ChildNode | null = heading.nextSibling;
  while (node) {
    const next = node.nextSibling;
    if (node instanceof HTMLAudioElement) {
      node.remove();
      node = next;
      continue;
    }
    if (node instanceof HTMLElement && node.classList.contains("tones")) {
      node.remove();
      node = next;
      continue;
    }
    if (
      node instanceof HTMLElement &&
      node.tagName === "DIV" &&
      !node.textContent?.trim() &&
      !node.querySelector("canvas, table, img")
    ) {
      node.remove();
      node = next;
      continue;
    }
    break;
  }

  const wrap = document.createElement("div");
  wrap.className = "pinyin-tone-groups";
  L1_TONE_ROWS.forEach((row, rowIdx) => {
    const rowEl = document.createElement("div");
    rowEl.className = "pinyin-tone-row";
    row.forEach((tile, toneIdx) => rowEl.appendChild(createPinyinCell(tile, "tone", toneIdx)));
    wrap.appendChild(rowEl);
  });
  heading.insertAdjacentElement("afterend", wrap);
}

/** 第一课拼音：声母/韵母/四声音节 — 字母在上、圆形播放按钮在下 */
export function hydratePinyinLesson(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("h5").forEach((h5) => {
    const t = h5.textContent ?? "";
    if (/声母/.test(t)) rebuildInitialsOrFinals(h5, L1_INITIALS, "initial");
    else if (/韵母/.test(t)) rebuildInitialsOrFinals(h5, L1_FINALS, "final");
  });
  rebuildToneSyllables(root);

  // Hide leftover pinyin sound-bank <audio> tags only — never touch 课文 01-xx.mp3 players.
  root.querySelectorAll<HTMLAudioElement>("audio[controls]").forEach((audio) => {
    if (audio.closest(".pinyin-cell")) return;
    const src = audioDataSrc(audio);
    if (!isPinyinSoundBankAudio(src)) return;
    audio.removeAttribute("controls");
    audio.classList.add("pinyin-bank-audio");
    audio.hidden = true;
  });
}
