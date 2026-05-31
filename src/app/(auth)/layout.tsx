import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-paper to-jade-400/10 dark:from-brand-900/30 dark:via-[#0f0f1a] dark:to-jade-600/10" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 -z-10 select-none text-[22rem] font-black leading-none text-brand-500/5 dark:text-white/5"
      >
        汉
      </div>

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex flex-col items-center gap-1 text-center"
        >
          <span className="text-4xl font-black tracking-tight text-brand-600">
            汉语水平考试
          </span>
          <span className="text-sm font-medium uppercase tracking-[0.3em] text-black/50 dark:text-white/50">
            HSK Learning
          </span>
        </Link>
        <div className="rounded-2xl border border-black/5 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
          {children}
        </div>
      </div>
    </div>
  );
}
