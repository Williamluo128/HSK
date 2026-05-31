"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signIn } from "@/auth";

export interface ActionState {
  error?: string;
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "请输入邮箱和密码。" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return { error: "邮箱或密码错误，或账号已被临时锁定。" };
    }
    return { error: "登录失败，请稍后重试。" };
  }
}

const USERNAME_RE = /^\w+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!username || !email || !password || !confirm) {
    return { error: "请填写所有字段。" };
  }
  if (!USERNAME_RE.test(username)) {
    return { error: "用户名只能包含字母、数字和下划线。" };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "邮箱格式无效。" };
  }
  if (!PASSWORD_RE.test(password)) {
    return { error: "密码至少 6 位，且需包含大写字母、小写字母和数字。" };
  }
  if (password !== confirm) {
    return { error: "两次输入的密码不一致。" };
  }

  const existing = await prisma.member.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (existing) {
    return {
      error:
        existing.email === email ? "该邮箱已被注册。" : "该用户名已被占用。",
    };
  }

  const hashed = await hashPassword(password);
  // New members get level 1 access by default so they can start learning.
  await prisma.member.create({
    data: {
      username,
      email,
      password: hashed,
      account: { create: { memberLevel: 1 } },
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "注册成功，但自动登录失败，请前往登录页。" };
  }
}
