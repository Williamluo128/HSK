"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "邮箱或密码错误。" };
  }

  try {
    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) throw error;
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

  try {
    const admin = createAdminClient();
    const { data: taken } = await admin
      .from("profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();
    if (taken) {
      return { error: "该用户名已被占用。" };
    }
  } catch {
    return { error: "认证服务未配置，请联系管理员。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "该邮箱已被注册。" };
    }
    return { error: error.message || "注册失败，请稍后重试。" };
  }

  if (data.user && !data.session) {
    return {
      error: "注册成功！请在邮箱中点击确认链接后再登录（或在 Supabase 关闭 Email Confirmations）。",
    };
  }

  try {
    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "注册成功，但自动登录失败，请前往登录页。" };
  }
}
