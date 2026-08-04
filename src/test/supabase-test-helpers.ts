import { vi, type Mock } from "vitest";

import {
	SITE_SETTING_DEFINITIONS,
	type SiteSettingType,
} from "@/lib/site-settings";

export type SupabaseTestError = {
	message: string;
};

export type SupabaseTestResponse<T = unknown> = {
	data?: T | null;
	error?: SupabaseTestError | null;
	count?: number | null;
};

type QueryMethod<T> = Mock<(...args: unknown[]) => QueryMock<T>>;

export type QueryMock<T = unknown> = PromiseLike<SupabaseTestResponse<T>> & {
	table: string;
	select: QueryMethod<T>;
	eq: QueryMethod<T>;
	order: QueryMethod<T>;
	limit: QueryMethod<T>;
	insert: QueryMethod<T>;
	update: QueryMethod<T>;
	delete: QueryMethod<T>;
	single: QueryMethod<T>;
	maybeSingle: QueryMethod<T>;
};

export type QueryDefinition<T = unknown> = {
	table: string;
	response: SupabaseTestResponse<T>;
};

export function createSupabaseQueryMock<T = unknown>(
	table: string,
	response: SupabaseTestResponse<T>,
): QueryMock<T> {
	const query = {
		table,
		select: vi.fn(),
		eq: vi.fn(),
		order: vi.fn(),
		limit: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		single: vi.fn(),
		maybeSingle: vi.fn(),
		then<TResult1 = SupabaseTestResponse<T>, TResult2 = never>(
			onfulfilled?:
				| ((value: SupabaseTestResponse<T>) => TResult1 | PromiseLike<TResult1>)
				| null,
			onrejected?:
				| ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
				| null,
		) {
			return Promise.resolve(response).then(onfulfilled, onrejected);
		},
	} as QueryMock<T>;

	query.select.mockReturnValue(query);
	query.eq.mockReturnValue(query);
	query.order.mockReturnValue(query);
	query.limit.mockReturnValue(query);
	query.insert.mockReturnValue(query);
	query.update.mockReturnValue(query);
	query.delete.mockReturnValue(query);
	query.single.mockReturnValue(query);
	query.maybeSingle.mockReturnValue(query);
	query.delete.mockReturnValue(query);

	return query;
}

export function createSupabaseClientMock(definitions: QueryDefinition[]) {
	const queries = definitions.map(({ table, response }) =>
		createSupabaseQueryMock(table, response),
	);
	let nextQueryIndex = 0;

	const client = {
		from: vi.fn((table: string) => {
			const query = queries[nextQueryIndex];

			if (!query) {
				throw new Error(`Unexpected Supabase table read: ${table}`);
			}

			if (query.table !== table) {
				throw new Error(
					`Expected Supabase table ${query.table}, received ${table}`,
				);
			}

			nextQueryIndex += 1;
			return query;
		}),
		storage: {
			getBucket: vi
				.fn()
				.mockResolvedValue({ data: { id: "cms-images" }, error: null }),
			createBucket: vi
				.fn()
				.mockResolvedValue({ data: { name: "cms-images" }, error: null }),
			from: vi.fn(() => ({
				upload: vi
					.fn()
					.mockResolvedValue({ data: { path: "mock-path.png" }, error: null }),
				getPublicUrl: vi.fn((path) => ({
					data: {
						publicUrl: `https://qbpqlecbufcvlbspnosn.supabase.co/storage/v1/object/public/cms-images/${path}`,
					},
				})),
				remove: vi.fn().mockResolvedValue({
					data: [{ name: "mock-path.png" }],
					error: null,
				}),
			})),
		},
	};

	return { client, queries };
}

export function createFormData(values: Record<string, string | number | null>) {
	const formData = new FormData();

	Object.entries(values).forEach(([key, value]) => {
		if (value !== null) {
			formData.set(key, String(value));
		}
	});

	return formData;
}

export function createRequiredSiteSettingsRows() {
	return SITE_SETTING_DEFINITIONS.map((definition) => ({
		setting_key: definition.key,
		setting_value: getDefaultSettingValue(definition.key, definition.type),
		setting_type: definition.type,
	}));
}

function getDefaultSettingValue(
	settingKey: string,
	settingType: SiteSettingType,
) {
	if (settingKey === "header_navigation") {
		return JSON.stringify([{ label: "Inicio", href: "#inicio" }]);
	}

	if (settingKey === "social_facebook") {
		return "https://www.facebook.com/centrodediaescala";
	}

	if (settingKey === "social_instagram") {
		return "https://www.instagram.com/centrodediaescala/";
	}

	if (settingKey === "social_linkedin" || settingKey === "social_twitter") {
		return "";
	}

	if (settingKey === "contact_email") {
		return "escalaelcentrodedia@gmail.com";
	}

	if (settingKey === "contact_email_label") {
		return "Email";
	}

	if (settingType === "JSON") {
		return JSON.stringify([`db-${settingKey}`]);
	}

	return `db-${settingKey}`;
}
