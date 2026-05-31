import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "注册 Register" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">创建账号</h1>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">
          注册后即可开始学习一级课程
        </p>
      </div>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-black/60 dark:text-white/60">
        已有账号？{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-600 hover:underline"
        >
          返回登录 Login
        </Link>
      </p>
    </div>
  );
}
