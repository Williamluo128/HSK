import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./lesson-overrides.css";

export const metadata: Metadata = {
  title: {
    default: "汉语水平考试 · HSK Learning",
    template: "%s · HSK Learning",
  },
  description:
    "学习中文（普通话）的 HSK 学习平台 — 课文、对话、生词、语法、练习、拼音与发音。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e11d48",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
