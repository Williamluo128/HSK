/**
 * Download lesson audio from the legacy public mandarin host into public/media/audio/.
 *
 * Run: npx tsx scripts/download-external-audio.ts
 * Optional: MEDIA_REMOTE_BASE=https://stephenmccready.asia/mandarin
 */
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const ROOT = process.cwd();
const REMOTE_BASE = (
  process.env.MEDIA_REMOTE_BASE ?? "https://stephenmccready.asia/mandarin"
).replace(/\/+$/, "");
const OUT_DIR = path.join(ROOT, "public", "media", "audio");
const LEGACY_DIR = path.join(ROOT, "legacy");
const MANIFEST = path.join(ROOT, "data", "audio-download-manifest.json");

const prisma = new PrismaClient();

function normaliseAudioPath(src: string): string | null {
  const clean = src
    .replace(/^\.{0,2}\/+/, "")
    .replace(/^mandarin\//, "")
    .replace(/^mi\//, "")
    .replace(/^\/media\//, "");
  if (!/^audio\/.+\.(m4a|mp3|wav|ogg)$/i.test(clean)) return null;
  return clean;
}

function collectFromHtml(html: string, out: Set<string>) {
  const re = /(?:data-src|src)=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const p = normaliseAudioPath(m[1]);
    if (p) out.add(p);
  }
}

async function collectFromLegacy(out: Set<string>) {
  const files = await readdir(LEGACY_DIR);
  for (const f of files) {
    if (!f.endsWith(".php")) continue;
    const raw = await readFile(path.join(LEGACY_DIR, f), "utf8");
    const re = /mandarin\/(audio\/[^"'\s]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw)) !== null) {
      const p = normaliseAudioPath(m[1]);
      if (p) out.add(p);
    }
  }
}

async function downloadFile(relPath: string): Promise<{ ok: boolean; status?: number; finalUrl?: string }> {
  const url = `${REMOTE_BASE}/${relPath}`;
  const fileName = relPath.replace(/^audio\//, "");
  const dest = path.join(OUT_DIR, fileName);

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    return { ok: false, status: res.status };
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) {
    return { ok: false, status: res.status, finalUrl: res.url };
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(dest, buf);
  return { ok: true, status: res.status, finalUrl: res.url };
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
) {
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const paths = new Set<string>();

  const sections = await prisma.lessonSection.findMany({
    select: { contentHtml: true },
  });
  for (const s of sections) {
    if (s.contentHtml) collectFromHtml(s.contentHtml, paths);
  }
  await collectFromLegacy(paths);

  const list = [...paths].sort();
  console.log(`Found ${list.length} unique audio paths.`);

  const failed: { path: string; status?: number; finalUrl?: string }[] = [];
  let done = 0;

  await runPool(list, 8, async (rel) => {
    const fileName = rel.replace(/^audio\//, "");
    const dest = path.join(OUT_DIR, fileName);
    try {
      const existing = await stat(dest).catch(() => null);
      if (existing && existing.size > 500) {
        done++;
        return;
      }
    } catch {
      /* download */
    }

    const result = await downloadFile(rel);
    if (result.ok) {
      done++;
      if (done % 50 === 0) console.log(`  ${done}/${list.length}…`);
    } else {
      failed.push({ path: rel, status: result.status, finalUrl: result.finalUrl });
    }
  });

  await mkdir(path.dirname(MANIFEST), { recursive: true });
  await writeFile(
    MANIFEST,
    JSON.stringify({ downloaded: done, total: list.length, failed }, null, 2),
  );

  console.log(`Done: ${done}/${list.length} saved under public/media/audio/`);
  if (failed.length) {
    console.log(`Failed (${failed.length}), see ${MANIFEST}`);
    failed.slice(0, 10).forEach((f) => console.log(" ", f.path, f.status, f.finalUrl ?? ""));
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
