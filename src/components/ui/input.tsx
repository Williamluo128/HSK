import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-base text-ink shadow-sm outline-none transition placeholder:text-black/40 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
