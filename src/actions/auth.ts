"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function loginAdmin(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = formData.get("password");

  if (!email || typeof password !== "string" || !password) {
    return { error: "Ingresá email y contraseña" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.email) {
    return { error: "Credenciales inválidas" };
  }

  const adminEmail = getRequiredEnv("ADMIN_EMAIL").trim().toLowerCase();

  if (data.user.email.trim().toLowerCase() !== adminEmail) {
    await supabase.auth.signOut();
    return { error: "No tenés permisos para acceder al panel" };
  }

  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
