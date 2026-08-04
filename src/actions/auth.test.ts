import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFormData } from "@/test/supabase-test-helpers";

// 303, not the default 307: redirect() serves a 303 when called from a Server
// Action, which is what loginAdmin is.
// (node_modules/next/dist/docs/01-app/02-guides/redirecting.md:83)
const REDIRECT_DIGEST = "NEXT_REDIRECT;push;/admin/dashboard;303;";
const ADMIN_EMAIL = "admin@centrodediaescala.org";
const PASSWORD = "sup3r-s3cret-passw0rd";

const authMocks = vi.hoisted(() => ({
	createClient: vi.fn(),
	redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: authMocks.createClient,
}));

vi.mock("next/navigation", () => ({
	redirect: authMocks.redirect,
}));

import { loginAdmin, type LoginState } from "./auth";

const initialState: LoginState = { error: "", kind: null };

type AuthErrorShape = {
	name: string;
	message: string;
	status?: number;
	code?: string;
};

function createAuthApiError(status: number): AuthErrorShape {
	return {
		name: "AuthApiError",
		message: "Invalid login credentials",
		status,
		code: "invalid_credentials",
	};
}

function createAuthClientMock() {
	const signInWithPassword = vi.fn();
	const signOut = vi.fn().mockResolvedValue({ error: null });
	const client = { auth: { signInWithPassword, signOut } };

	authMocks.createClient.mockResolvedValue(client);

	return { client, signInWithPassword, signOut };
}

function createSignInFailure(error: AuthErrorShape) {
	return { data: { user: null, session: null }, error };
}

function createSignInSuccess(email: string | undefined) {
	return { data: { user: { email }, session: {} }, error: null };
}

let originalAdminEmail: string | undefined;

beforeEach(() => {
	originalAdminEmail = process.env.ADMIN_EMAIL;
	process.env.ADMIN_EMAIL = ADMIN_EMAIL;
	authMocks.redirect.mockImplementation((url: string) => {
		const error = new Error("NEXT_REDIRECT") as Error & { digest: string };
		error.digest = `NEXT_REDIRECT;push;${url};303;`;
		throw error;
	});
});

afterEach(() => {
	if (originalAdminEmail === undefined) {
		delete process.env.ADMIN_EMAIL;
	} else {
		process.env.ADMIN_EMAIL = originalAdminEmail;
	}
});

describe("loginAdmin input validation", () => {
	const cases: Array<{ label: string; values: Record<string, string | null> }> =
		[
			{ label: "email is missing", values: { email: null, password: PASSWORD } },
			{
				label: "password is missing",
				values: { email: ADMIN_EMAIL, password: null },
			},
			{ label: "both are missing", values: { email: null, password: null } },
			{
				label: "email is only whitespace",
				values: { email: "   ", password: PASSWORD },
			},
			{
				label: "password is empty",
				values: { email: ADMIN_EMAIL, password: "" },
			},
		];

	cases.forEach(({ label, values }) => {
		it(`reports the empty kind and never reaches Supabase when ${label}`, async () => {
			const state = await loginAdmin(initialState, createFormData(values));

			expect(state.kind).toBe("empty");
			expect(state.error).not.toBe("");
			expect(authMocks.createClient).not.toHaveBeenCalled();
		});
	});
});

describe("loginAdmin auth error classification", () => {
	const explicitVerdictStatuses = [400, 422];

	explicitVerdictStatuses.forEach((status) => {
		it(`reports invalid credentials when GoTrue answers with status ${status}`, async () => {
			const { signInWithPassword } = createAuthClientMock();
			signInWithPassword.mockResolvedValue(
				createSignInFailure(createAuthApiError(status)),
			);

			const state = await loginAdmin(
				initialState,
				createFormData({ email: ADMIN_EMAIL, password: PASSWORD }),
			);

			expect(state.kind).toBe("credentials");
		});
	});

	const unreachableStatuses = [0, 401, 429, 500, 503];

	unreachableStatuses.forEach((status) => {
		it(`reports an unavailable backend when the auth error carries status ${status}`, async () => {
			const { signInWithPassword } = createAuthClientMock();
			signInWithPassword.mockResolvedValue(
				createSignInFailure(createAuthApiError(status)),
			);

			const state = await loginAdmin(
				initialState,
				createFormData({ email: ADMIN_EMAIL, password: PASSWORD }),
			);

			expect(state.kind).toBe("unavailable");
			expect(state.error).toContain("No es un problema con tu contraseña");
		});
	});

	it("reports an unavailable backend for an AuthUnknownError without status", async () => {
		const { signInWithPassword } = createAuthClientMock();
		signInWithPassword.mockResolvedValue(
			createSignInFailure({
				name: "AuthUnknownError",
				message: "Unexpected token < in JSON at position 0",
				status: undefined,
			}),
		);

		const state = await loginAdmin(
			initialState,
			createFormData({ email: ADMIN_EMAIL, password: PASSWORD }),
		);

		expect(state.kind).toBe("unavailable");
	});

	it("reports invalid credentials when Supabase succeeds without a user email", async () => {
		const { signInWithPassword } = createAuthClientMock();
		signInWithPassword.mockResolvedValue(createSignInSuccess(undefined));

		const state = await loginAdmin(
			initialState,
			createFormData({ email: ADMIN_EMAIL, password: PASSWORD }),
		);

		expect(state.kind).toBe("credentials");
	});
});

describe("loginAdmin authorization", () => {
	it("signs the user out and reports forbidden for a non-admin account", async () => {
		const { signInWithPassword, signOut } = createAuthClientMock();
		signInWithPassword.mockResolvedValue(
			createSignInSuccess("someone-else@centrodediaescala.org"),
		);

		const state = await loginAdmin(
			initialState,
			createFormData({
				email: "someone-else@centrodediaescala.org",
				password: PASSWORD,
			}),
		);

		expect(state.kind).toBe("forbidden");
		expect(signOut).toHaveBeenCalledTimes(1);
	});

	it("redirects to the dashboard for the admin account", async () => {
		const { signInWithPassword } = createAuthClientMock();
		signInWithPassword.mockResolvedValue(createSignInSuccess(ADMIN_EMAIL));

		await expect(
			loginAdmin(
				initialState,
				createFormData({ email: ADMIN_EMAIL, password: PASSWORD }),
			),
		).rejects.toMatchObject({ digest: REDIRECT_DIGEST });

		expect(authMocks.redirect).toHaveBeenCalledWith("/admin/dashboard");
	});
});

describe("loginAdmin unexpected failures", () => {
	it("reports an unavailable backend when the Supabase client cannot be built", async () => {
		authMocks.createClient.mockRejectedValue(
			new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"),
		);

		const state = await loginAdmin(
			initialState,
			createFormData({ email: ADMIN_EMAIL, password: PASSWORD }),
		);

		expect(state.kind).toBe("unavailable");
	});

	it("reports an unavailable backend when sign-in throws a non-auth error", async () => {
		const { signInWithPassword } = createAuthClientMock();
		signInWithPassword.mockRejectedValue(new Error("fetch failed"));

		const state = await loginAdmin(
			initialState,
			createFormData({ email: ADMIN_EMAIL, password: PASSWORD }),
		);

		expect(state.kind).toBe("unavailable");
	});

	it("reports an unavailable backend when ADMIN_EMAIL is not configured", async () => {
		delete process.env.ADMIN_EMAIL;
		const { signInWithPassword } = createAuthClientMock();
		signInWithPassword.mockResolvedValue(createSignInSuccess(ADMIN_EMAIL));

		const state = await loginAdmin(
			initialState,
			createFormData({ email: ADMIN_EMAIL, password: PASSWORD }),
		);

		expect(state.kind).toBe("unavailable");
	});
});

describe("loginAdmin logging", () => {
	let consoleError: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("never logs the submitted email or password", async () => {
		const { signInWithPassword } = createAuthClientMock();
		signInWithPassword.mockResolvedValue(
			createSignInFailure(createAuthApiError(503)),
		);

		await loginAdmin(
			initialState,
			createFormData({ email: ADMIN_EMAIL, password: PASSWORD }),
		);
		signInWithPassword.mockRejectedValue(new Error("fetch failed"));
		await loginAdmin(
			initialState,
			createFormData({ email: ADMIN_EMAIL, password: PASSWORD }),
		);

		expect(consoleError).toHaveBeenCalled();

		const serialized = consoleError.mock.calls
			.flat()
			.map((argument: unknown) => JSON.stringify(argument))
			.join(" ");

		expect(serialized).not.toContain(ADMIN_EMAIL);
		expect(serialized).not.toContain(PASSWORD);
	});

	it("stays quiet when GoTrue rejects the credentials", async () => {
		const { signInWithPassword } = createAuthClientMock();
		signInWithPassword.mockResolvedValue(
			createSignInFailure(createAuthApiError(400)),
		);

		await loginAdmin(
			initialState,
			createFormData({ email: ADMIN_EMAIL, password: PASSWORD }),
		);

		expect(consoleError).not.toHaveBeenCalled();
	});
});
