"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail, Lock } from "lucide-react";
import { loginAction, type ActionState } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "登录中…" : "登录 Login"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
          {state.error}
        </p>
      )}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-black/70 dark:text-white/70">
          邮箱 Email
        </span>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-black/30 dark:text-white/30" />
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="pl-11"
            required
          />
        </div>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-black/70 dark:text-white/70">
          密码 Password
        </span>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-black/30 dark:text-white/30" />
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="pl-11"
            required
          />
        </div>
      </label>
      <SubmitButton />
    </form>
  );
}
