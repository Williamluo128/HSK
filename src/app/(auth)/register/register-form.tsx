"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { User, Mail, Lock, ShieldCheck } from "lucide-react";
import { registerAction, type ActionState } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "创建中…" : "注册 Register"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    registerAction,
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
          用户名 Username
        </span>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-black/30 dark:text-white/30" />
          <Input name="username" placeholder="zhang_san" className="pl-11" required />
        </div>
      </label>
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
            autoComplete="new-password"
            placeholder="••••••••"
            className="pl-11"
            required
          />
        </div>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-black/70 dark:text-white/70">
          确认密码 Confirm Password
        </span>
        <div className="relative">
          <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-black/30 dark:text-white/30" />
          <Input
            type="password"
            name="confirm"
            autoComplete="new-password"
            placeholder="••••••••"
            className="pl-11"
            required
          />
        </div>
      </label>
      <p className="text-xs leading-relaxed text-black/45 dark:text-white/45">
        用户名仅限字母、数字与下划线；密码至少 6 位，需含大写、小写字母及数字。
      </p>
      <SubmitButton />
    </form>
  );
}
