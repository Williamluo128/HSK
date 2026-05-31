import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const AUDIO_ROOT = path.join(process.cwd(), "public", "media", "audio");

const MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const segments = (await ctx.params).path;
  const resolved = path.resolve(AUDIO_ROOT, ...segments);
  if (!resolved.startsWith(AUDIO_ROOT + path.sep) && resolved !== AUDIO_ROOT) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const data = await readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    return new NextResponse(data, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
