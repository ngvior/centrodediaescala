"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const EMPTY_INPUT_MESSAGE = "Ingresá email y contraseña";
const CREDENTIALS_MESSAGE = "Credenciales inválidas";
const FORBIDDEN_MESSAGE = "No tenés permisos para acceder al panel";
const UNAVAILABLE_MESSAGE =
  "No pudimos conectarnos con el servidor de autenticación. Lo más probable es que el proyecto de Supabase esté pausado por inactividad, aunque también podría tratarse de una caída del servicio o de una URL mal configurada. No es un problema con tu contraseña: no llegamos a validarla. Comunicate con el administrador del sitio para que lo revise.";

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

export type LoginErrorKind =
  | "empty"
  | "credentials"
  | "unavailable"
  | "forbidden";

export type LoginState = { error: string; kind: LoginErrorKind | null };

type SignInOutcome = { ok: true } | { ok: false; state: LoginState };

type AuthErrorLike = { name: string; status?: number; code?: string };

// GoTrue only issues an explicit "these credentials are wrong" verdict as 400 or
// 422. Everything else reaches us without a verdict: a paused project answering
// with an HTML page arrives as a status-less unknown error, a rejected anon key
// as 401, a throttled endpoint as 429. Reporting those as a bad password would
// send the admin into retrying a login that cannot succeed, so anything but an
// explicit verdict is reported as an unreachable backend.
function classifyAuthError(error: AuthErrorLike): LoginState {
  const hasExplicitVerdict =
    typeof error.status === "number" &&
    (error.status === 400 || error.status === 422);

  if (hasExplicitVerdict) {
    return { error: CREDENTIALS_MESSAGE, kind: "credentials" };
  }

  console.error("loginAdmin could not reach the auth backend", {
    name: error.name,
    status: error.status,
    code: error.code,
  });

  return { error: UNAVAILABLE_MESSAGE, kind: "unavailable" };
}

// Holds this module's only try/catch. `redirect()` signals navigation by
// throwing NEXT_REDIRECT, so it has to stay outside of any catch: wrapping it
// would turn every successful login into an "unreachable backend" notice.
async function verifyAdminSignIn(
  email: string,
  password: string,
): Promise<SignInOutcome> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { ok: false, state: classifyAuthError(error) };
    }

    if (!data.user?.email) {
      return {
        ok: false,
        state: { error: CREDENTIALS_MESSAGE, kind: "credentials" },
      };
    }

    const adminEmail = getRequiredEnv("ADMIN_EMAIL").trim().toLowerCase();

    if (data.user.email.trim().toLowerCase() !== adminEmail) {
      await supabase.auth.signOut();
      return {
        ok: false,
        state: { error: FORBIDDEN_MESSAGE, kind: "forbidden" },
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("loginAdmin failed unexpectedly", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      ok: false,
      state: { error: UNAVAILABLE_MESSAGE, kind: "unavailable" },
    };
  }
}

export async function loginAdmin(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = normalizeEmail(formData.get("email"));
  const password = formData.get("password");

  if (!email || typeof password !== "string" || !password) {
    return { error: EMPTY_INPUT_MESSAGE, kind: "empty" };
  }

  const outcome = await verifyAdminSignIn(email, password);

  if (!outcome.ok) {
    return outcome.state;
  }

  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
