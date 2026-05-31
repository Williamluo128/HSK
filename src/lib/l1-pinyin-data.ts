/** L1-1 声母、韵母、四声音节（与 legacy/L1-L1.php 一致） */

export interface PinyinTile {
  label: string;
  /** legacy play('…') 的 id */
  audioId: string;
}

export const L1_INITIALS: PinyinTile[] = [
  { label: "b", audioId: "b" },
  { label: "p", audioId: "p" },
  { label: "m", audioId: "m" },
  { label: "f", audioId: "f" },
  { label: "d", audioId: "d" },
  { label: "t", audioId: "t" },
  { label: "n", audioId: "n" },
  { label: "l", audioId: "l" },
  { label: "g", audioId: "g" },
  { label: "k", audioId: "k" },
  { label: "h", audioId: "h" },
  { label: "j", audioId: "j" },
  { label: "q", audioId: "q" },
  { label: "x", audioId: "x" },
];

export const L1_FINALS: PinyinTile[] = [
  { label: "i", audioId: "i" },
  { label: "u", audioId: "u" },
  { label: "ü", audioId: "v" },
  { label: "er", audioId: "er" },
  { label: "a", audioId: "a" },
  { label: "ia", audioId: "ia" },
  { label: "ua", audioId: "ua" },
  { label: "o", audioId: "o" },
  { label: "uo", audioId: "uo" },
  { label: "e", audioId: "e" },
  { label: "ie", audioId: "ie" },
  { label: "üe", audioId: "ve" },
  { label: "ai", audioId: "ai" },
  { label: "uai", audioId: "uai" },
  { label: "ei", audioId: "ei" },
  { label: "uei (ui)", audioId: "uei" },
  { label: "ao", audioId: "ao" },
  { label: "iao", audioId: "iao" },
];

export const L1_TONE_ROWS: PinyinTile[][] = [
  [
    { label: "ā", audioId: "a1" },
    { label: "á", audioId: "a2" },
    { label: "ǎ", audioId: "a3" },
    { label: "à", audioId: "a4" },
  ],
  [
    { label: "ō", audioId: "o1" },
    { label: "ó", audioId: "o2" },
    { label: "ǒ", audioId: "o3" },
    { label: "ò", audioId: "o4" },
  ],
  [
    { label: "ē", audioId: "e1" },
    { label: "é", audioId: "e2" },
    { label: "ě", audioId: "e3" },
    { label: "è", audioId: "e4" },
  ],
  [
    { label: "ī", audioId: "i1" },
    { label: "í", audioId: "i2" },
    { label: "ǐ", audioId: "i3" },
    { label: "ì", audioId: "i4" },
  ],
  [
    { label: "ū", audioId: "u1" },
    { label: "ú", audioId: "u2" },
    { label: "ǔ", audioId: "u3" },
    { label: "ù", audioId: "u4" },
  ],
  [
    { label: "ǖ", audioId: "v1" },
    { label: "ǘ", audioId: "v2" },
    { label: "ǚ", audioId: "v3" },
    { label: "ǜ", audioId: "v4" },
  ],
];

/** 声母音频 i_*.m4a，韵母 f_*.m4a，四声 *.m4a */
export function pinyinAudioPath(audioId: string, kind: "initial" | "final" | "tone"): string {
  if (kind === "tone") return `audio/${audioId}.m4a`;
  if (kind === "initial") return `audio/i_${audioId}.m4a`;
  return `audio/f_${audioId}.m4a`;
}
