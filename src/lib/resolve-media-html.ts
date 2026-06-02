import { mediaUrl } from "@/lib/utils";

/** Turn data-src placeholders from migrated HTML into playable / visible src URLs. */
export function resolveMediaInHtml(html: string): string {
  return html.replace(
    /(<(?:audio|source|img)\b[^>]*\s)data-src="([^"]+)"/gi,
    (_, tag: string, path: string) => {
      const url = mediaUrl(path);
      return `${tag}data-src="${path}" src="${url}"`;
    },
  );
}
