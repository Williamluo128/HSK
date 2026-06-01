import type { ReactNode } from "react";

export function ConfigError({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-black/10 bg-white/70 p-8 text-center dark:border-white/10 dark:bg-white/5">
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="mt-3 space-y-2 text-sm text-black/60 dark:text-white/60">
        {children}
      </div>
    </div>
  );
}
