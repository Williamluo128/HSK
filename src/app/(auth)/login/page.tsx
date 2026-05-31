import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "登录 Login" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">欢迎回来</h1>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">
          huān yíng · Welcome back
        </p>
      </div>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-black/60 dark:text-white/60">
        还没有账号？{" "}
        <Link
          href="/register"
          className="font-semibold text-brand-600 hover:underline"
        >
          注册新账号 Register
        </Link>
      </p>
    </div>
  );
}
