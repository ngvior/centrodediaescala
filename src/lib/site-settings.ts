export type SiteSettingType =
	| "TEXT"
	| "IMAGE_URL"
	| "LINK"
	| "RICHTEXT"
	| "JSON";

export type SiteSettingGroup =
	| "MARCA_NAV"
	| "HOMEPAGE"
	| "ABOUT"
	| "ACTIVIDADES"
	| "GALERIA"
	| "EQUIPO"
	| "CONTACTO"
	| "ENTREVISTA"
	| "REDES";

export type PublicNavigationItem = {
	label: string;
	href: string;
};

export type PublicSiteSettings = {
	brand_name: string;
	brand_subtitle: string;
	header_navigation: PublicNavigationItem[];
	footer_copyright: string;
	social_facebook: string;
	social_instagram: string;
	social_linkedin: string;
	social_twitter: string;
	home_hero_title: string;
	home_hero_subtitle: string;
	home_hero_text: string;
	home_hero_cta_label: string;
	about_title: string;
	about_text: string;
	about_objectives_title: string;
	about_facilities_title: string;
	about_facilities_text: string;
	about_compliance_title: string;
	about_compliance_items: string[];
	about_requirements_title: string;
	about_requirements_text: string;
	about_requirements_label: string;
	about_requirements_items: string[];
	activities_section_title: string;
	gallery_section_title: string;
	gallery_filter_labels: string[];
	professionals_section_title: string;
	professionals_subtitle: string;
	contact_title: string;
	contact_text: string;
	contact_body_text: string;
	contact_address: string;
	contact_phone: string;
	contact_schedule: string;
	contact_email: string;
	contact_address_label: string;
	contact_phone_label: string;
	contact_schedule_label: string;
	contact_email_label: string;
	interview_form_title: string;
	interview_form_description: string;
	interview_form_contact_name_label: string;
	interview_form_patient_name_label: string;
	interview_form_phone_label: string;
	interview_form_email_label: string;
	interview_form_message_label: string;
	interview_form_message_placeholder: string;
	interview_form_submit_label: string;
	interview_form_pending_label: string;
	interview_form_honeypot_label: string;
};

export type SiteSettingKey = keyof PublicSiteSettings;

export type SiteSettingDefinition = {
	key: SiteSettingKey;
	group: SiteSettingGroup;
	label: string;
	type: SiteSettingType;
	description: string;
	input: "input" | "textarea" | "json";
	required?: boolean;
};

export type SiteSettingRow = {
	setting_key: string;
	setting_value: string;
	setting_type: SiteSettingType;
	setting_group?: string;
	description?: string | null;
};

export type AdminSiteSetting = SiteSettingDefinition & {
	value: string;
	displayValue: string;
};

const PUBLIC_ANCHORS = new Set([
	"#inicio",
	"#institucion",
	"#actividades",
	"#galeria",
	"#equipo",
	"#contacto",
	// legacy:
	"#top_content",
	"#service",
	"#work_outer",
	"#team",
	"#contact",
	"camina.html",
]);

export const SITE_SETTING_DEFINITIONS = [
	{
		key: "brand_name",
		group: "MARCA_NAV",
		label: "Nombre de marca",
		type: "TEXT",
		description: "Nombre visible en el encabezado y pie de página.",
		input: "input",
	},
	{
		key: "brand_subtitle",
		group: "MARCA_NAV",
		label: "Subtítulo de marca",
		type: "TEXT",
		description: "Texto secundario visible junto a la marca.",
		input: "input",
	},
	{
		key: "header_navigation",
		group: "MARCA_NAV",
		label: "Navegación principal",
		type: "JSON",
		description: "Lista de enlaces del encabezado con label y href.",
		input: "json",
	},
	{
		key: "footer_copyright",
		group: "MARCA_NAV",
		label: "Texto de derechos",
		type: "TEXT",
		description: "Texto legal visible en el pie de página.",
		input: "input",
	},
	{
		key: "social_facebook",
		group: "REDES",
		label: "Facebook",
		type: "LINK",
		description:
			"Enlace al perfil de Facebook. Opcional; vacío no se renderiza.",
		input: "input",
		required: false,
	},
	{
		key: "social_instagram",
		group: "REDES",
		label: "Instagram",
		type: "LINK",
		description:
			"Enlace al perfil de Instagram. Opcional; vacío no se renderiza.",
		input: "input",
		required: false,
	},
	{
		key: "social_linkedin",
		group: "REDES",
		label: "LinkedIn",
		type: "LINK",
		description:
			"Enlace al perfil de LinkedIn. Opcional; vacío no se renderiza.",
		input: "input",
		required: false,
	},
	{
		key: "social_twitter",
		group: "REDES",
		label: "Twitter/X",
		type: "LINK",
		description:
			"Enlace al perfil de Twitter/X. Opcional; vacío no se renderiza.",
		input: "input",
		required: false,
	},
	{
		key: "home_hero_title",
		group: "HOMEPAGE",
		label: "Título del hero",
		type: "TEXT",
		description: "Título principal del banner de inicio.",
		input: "input",
	},
	{
		key: "home_hero_subtitle",
		group: "HOMEPAGE",
		label: "Subtítulo del hero",
		type: "TEXT",
		description: "Subtítulo del banner de inicio.",
		input: "input",
	},
	{
		key: "home_hero_text",
		group: "HOMEPAGE",
		label: "Texto del hero",
		type: "RICHTEXT",
		description: "Texto descriptivo debajo del título principal.",
		input: "textarea",
	},
	{
		key: "home_hero_cta_label",
		group: "HOMEPAGE",
		label: "Botón del hero",
		type: "TEXT",
		description: "Texto visible del botón principal.",
		input: "input",
	},
	{
		key: "about_title",
		group: "ABOUT",
		label: "Título institución",
		type: "TEXT",
		description: "Título de la sección institución.",
		input: "input",
	},
	{
		key: "about_text",
		group: "ABOUT",
		label: "Introducción institución",
		type: "RICHTEXT",
		description: "Texto introductorio destacado de la institución.",
		input: "textarea",
	},
	{
		key: "about_objectives_title",
		group: "ABOUT",
		label: "Título objetivos",
		type: "TEXT",
		description: "Título visible sobre la lista de objetivos institucionales.",
		input: "input",
	},
	{
		key: "about_facilities_title",
		group: "ABOUT",
		label: "Título instalaciones",
		type: "TEXT",
		description: "Título de la sección instalaciones.",
		input: "input",
	},
	{
		key: "about_facilities_text",
		group: "ABOUT",
		label: "Texto instalaciones",
		type: "RICHTEXT",
		description: "Descripción de instalaciones.",
		input: "textarea",
	},
	{
		key: "about_compliance_title",
		group: "ABOUT",
		label: "Título cumplimiento",
		type: "TEXT",
		description: "Título de la lista de cumplimiento institucional.",
		input: "input",
	},
	{
		key: "about_compliance_items",
		group: "ABOUT",
		label: "Ítems de cumplimiento",
		type: "JSON",
		description: "Lista de requisitos/certificaciones institucionales.",
		input: "json",
	},
	{
		key: "about_requirements_title",
		group: "ABOUT",
		label: "Título requisitos",
		type: "TEXT",
		description: "Título de sección requisitos.",
		input: "input",
	},
	{
		key: "about_requirements_text",
		group: "ABOUT",
		label: "Texto requisitos",
		type: "RICHTEXT",
		description: "Texto introductorio de requisitos de ingreso.",
		input: "textarea",
	},
	{
		key: "about_requirements_label",
		group: "ABOUT",
		label: "Etiqueta lista requisitos",
		type: "TEXT",
		description: "Texto que precede a la lista de requisitos.",
		input: "input",
	},
	{
		key: "about_requirements_items",
		group: "ABOUT",
		label: "Lista requisitos",
		type: "JSON",
		description: "Lista visible de requisitos de inscripción.",
		input: "json",
	},
	{
		key: "activities_section_title",
		group: "ACTIVIDADES",
		label: "Título actividades",
		type: "TEXT",
		description: "Título de la sección actividades.",
		input: "input",
	},
	{
		key: "gallery_section_title",
		group: "GALERIA",
		label: "Título galería",
		type: "TEXT",
		description: "Título de la sección galería.",
		input: "input",
	},
	{
		key: "gallery_filter_labels",
		group: "GALERIA",
		label: "Filtros galería",
		type: "JSON",
		description: "Lista de etiquetas visibles para filtros de galería.",
		input: "json",
	},
	{
		key: "professionals_section_title",
		group: "EQUIPO",
		label: "Título profesionales",
		type: "TEXT",
		description: "Título de la sección profesionales.",
		input: "input",
	},
	{
		key: "professionals_subtitle",
		group: "EQUIPO",
		label: "Subtítulo profesionales",
		type: "TEXT",
		description: "Subtítulo de la sección profesionales.",
		input: "input",
	},
	{
		key: "contact_title",
		group: "CONTACTO",
		label: "Título contacto",
		type: "TEXT",
		description: "Título de contacto.",
		input: "input",
	},
	{
		key: "contact_text",
		group: "CONTACTO",
		label: "Bajada contacto",
		type: "TEXT",
		description: "Texto destacado de contacto.",
		input: "input",
	},
	{
		key: "contact_body_text",
		group: "CONTACTO",
		label: "Texto contacto",
		type: "RICHTEXT",
		description: "Párrafo descriptivo de contacto.",
		input: "textarea",
	},
	{
		key: "contact_address",
		group: "CONTACTO",
		label: "Dirección",
		type: "TEXT",
		description: "Dirección de la institución.",
		input: "input",
	},
	{
		key: "contact_phone",
		group: "CONTACTO",
		label: "Teléfono",
		type: "TEXT",
		description: "Teléfono principal de contacto.",
		input: "input",
	},
	{
		key: "contact_schedule",
		group: "CONTACTO",
		label: "Horarios",
		type: "TEXT",
		description: "Horario de atención al público.",
		input: "input",
	},
	{
		key: "contact_email",
		group: "CONTACTO",
		label: "Email",
		type: "TEXT",
		description: "Email principal de contacto.",
		input: "input",
	},
	{
		key: "contact_address_label",
		group: "CONTACTO",
		label: "Etiqueta dirección",
		type: "TEXT",
		description: "Etiqueta visible de la tarjeta de dirección.",
		input: "input",
	},
	{
		key: "contact_phone_label",
		group: "CONTACTO",
		label: "Etiqueta teléfono",
		type: "TEXT",
		description: "Etiqueta visible de la tarjeta de teléfono.",
		input: "input",
	},
	{
		key: "contact_schedule_label",
		group: "CONTACTO",
		label: "Etiqueta horarios",
		type: "TEXT",
		description: "Etiqueta visible de la tarjeta de horarios.",
		input: "input",
	},
	{
		key: "contact_email_label",
		group: "CONTACTO",
		label: "Etiqueta email",
		type: "TEXT",
		description: "Etiqueta visible de la tarjeta de email.",
		input: "input",
	},
	{
		key: "interview_form_title",
		group: "ENTREVISTA",
		label: "Título formulario entrevista",
		type: "TEXT",
		description: "Título visible del formulario de entrevista.",
		input: "input",
	},
	{
		key: "interview_form_description",
		group: "ENTREVISTA",
		label: "Descripción formulario entrevista",
		type: "TEXT",
		description: "Texto descriptivo del formulario de entrevista.",
		input: "textarea",
	},
	{
		key: "interview_form_contact_name_label",
		group: "ENTREVISTA",
		label: "Etiqueta contacto",
		type: "TEXT",
		description: "Etiqueta del campo nombre de contacto.",
		input: "input",
	},
	{
		key: "interview_form_patient_name_label",
		group: "ENTREVISTA",
		label: "Etiqueta persona interesada",
		type: "TEXT",
		description: "Etiqueta del campo nombre de persona interesada.",
		input: "input",
	},
	{
		key: "interview_form_phone_label",
		group: "ENTREVISTA",
		label: "Etiqueta teléfono entrevista",
		type: "TEXT",
		description: "Etiqueta del campo teléfono.",
		input: "input",
	},
	{
		key: "interview_form_email_label",
		group: "ENTREVISTA",
		label: "Etiqueta email",
		type: "TEXT",
		description: "Etiqueta del campo email.",
		input: "input",
	},
	{
		key: "interview_form_message_label",
		group: "ENTREVISTA",
		label: "Etiqueta mensaje",
		type: "TEXT",
		description: "Etiqueta del campo mensaje.",
		input: "input",
	},
	{
		key: "interview_form_message_placeholder",
		group: "ENTREVISTA",
		label: "Placeholder mensaje",
		type: "TEXT",
		description: "Placeholder del campo mensaje.",
		input: "input",
	},
	{
		key: "interview_form_submit_label",
		group: "ENTREVISTA",
		label: "Botón entrevista",
		type: "TEXT",
		description: "Texto del botón para enviar entrevista.",
		input: "input",
	},
	{
		key: "interview_form_pending_label",
		group: "ENTREVISTA",
		label: "Botón entrevista en progreso",
		type: "TEXT",
		description: "Texto del botón mientras se envía el formulario.",
		input: "input",
	},
	{
		key: "interview_form_honeypot_label",
		group: "ENTREVISTA",
		label: "Etiqueta anti-spam",
		type: "TEXT",
		description: "Etiqueta del campo oculto anti-spam.",
		input: "input",
	},
] as const satisfies readonly SiteSettingDefinition[];

export const SITE_SETTING_GROUPS: Array<{
	group: SiteSettingGroup;
	title: string;
}> = [
	{ group: "MARCA_NAV", title: "Marca y navegación" },
	{ group: "HOMEPAGE", title: "Inicio" },
	{ group: "ABOUT", title: "Institución" },
	{ group: "ACTIVIDADES", title: "Actividades" },
	{ group: "GALERIA", title: "Galería" },
	{ group: "EQUIPO", title: "Equipo" },
	{ group: "CONTACTO", title: "Contacto" },
	{ group: "ENTREVISTA", title: "Entrevista" },
	{ group: "REDES", title: "Redes" },
];

export const REQUIRED_SITE_SETTING_KEYS = (
	SITE_SETTING_DEFINITIONS as readonly SiteSettingDefinition[]
)
	.filter((definition) => definition.required !== false)
	.map((definition) => definition.key);

const definitionsByKey = new Map(
	SITE_SETTING_DEFINITIONS.map((definition) => [definition.key, definition]),
);

function isRequiredSiteSetting(definition: SiteSettingDefinition) {
	return (definition as SiteSettingDefinition).required !== false;
}

function assertStringList(key: SiteSettingKey, parsedValue: unknown) {
	if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
		throw new Error(
			`Invalid JSON site setting ${key}: expected a non-empty array`,
		);
	}

	return parsedValue.map((item) => {
		if (typeof item !== "string" || item.trim().length === 0) {
			throw new Error(
				`Invalid JSON site setting ${key}: expected non-empty string items`,
			);
		}

		return item.trim();
	});
}

function assertNavigationItems(key: SiteSettingKey, parsedValue: unknown) {
	if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
		throw new Error(
			`Invalid JSON site setting ${key}: expected a non-empty array`,
		);
	}

	return parsedValue.map((item) => {
		if (!item || typeof item !== "object") {
			throw new Error(
				`Invalid JSON site setting ${key}: expected navigation objects`,
			);
		}

		const label = "label" in item ? item.label : undefined;
		const href = "href" in item ? item.href : undefined;

		if (typeof label !== "string" || label.trim().length === 0) {
			throw new Error(
				`Invalid JSON site setting ${key}: expected non-empty labels`,
			);
		}

		if (typeof href !== "string" || !PUBLIC_ANCHORS.has(href)) {
			throw new Error(
				`Invalid JSON site setting ${key}: unsupported navigation href`,
			);
		}

		return { label: label.trim(), href: href };
	});
}

function parseJsonSetting(key: SiteSettingKey, value: string) {
	let parsedValue: unknown;

	try {
		parsedValue = JSON.parse(value);
	} catch {
		throw new Error(`Malformed JSON site setting: ${key}`);
	}

	if (key === "header_navigation") {
		return assertNavigationItems(key, parsedValue);
	}

	return assertStringList(key, parsedValue);
}

export function getSiteSettingDefinition(key: string) {
	return definitionsByKey.get(key as SiteSettingKey);
}

export function parseSiteSettingValue(
	key: SiteSettingKey,
	value: string,
	type: SiteSettingType,
) {
	const definition = getSiteSettingDefinition(key);

	if (!definition) {
		throw new Error(`Unknown site setting: ${key}`);
	}

	if (type !== definition.type) {
		throw new Error(
			`Invalid setting_type for ${key}: expected ${definition.type}, received ${type}`,
		);
	}

	const trimmedValue = value.trim();

	if (trimmedValue.length === 0) {
		if (isRequiredSiteSetting(definition)) {
			throw new Error(`Empty required site setting: ${key}`);
		}

		return "";
	}

	if (definition.type === "JSON") {
		return parseJsonSetting(key, trimmedValue);
	}

	return trimmedValue;
}

export function parsePublicSiteSettings(
	rows: SiteSettingRow[],
): PublicSiteSettings {
	const rowsByKey = new Map(rows.map((row) => [row.setting_key, row]));
	const missingKeys = REQUIRED_SITE_SETTING_KEYS.filter(
		(key) => !rowsByKey.has(key),
	);

	if (missingKeys.length > 0) {
		throw new Error(
			`Missing required site settings: ${missingKeys.join(", ")}`,
		);
	}

	return SITE_SETTING_DEFINITIONS.reduce((settings, definition) => {
		const row = rowsByKey.get(definition.key);

		if (!row) {
			return {
				...settings,
				[definition.key]: "",
			};
		}

		return {
			...settings,
			[definition.key]: parseSiteSettingValue(
				definition.key,
				row.setting_value,
				row.setting_type,
			),
		};
	}, {} as PublicSiteSettings);
}

export function normalizeSiteSettingValue(
	key: string,
	value: string,
	type: string,
) {
	const definition = getSiteSettingDefinition(key);

	if (!definition) {
		throw new Error(`Configuración desconocida: ${key}`);
	}

	if (type !== definition.type) {
		throw new Error(`Tipo inválido para ${key}`);
	}

	const parsedValue = parseSiteSettingValue(
		definition.key,
		value,
		definition.type,
	);

	if (definition.type === "JSON") {
		return JSON.stringify(parsedValue);
	}

	return parsedValue as string;
}

export function buildAdminSiteSettings(rows: SiteSettingRow[]) {
	const rowsByKey = new Map(rows.map((row) => [row.setting_key, row]));
	const missingKeys = REQUIRED_SITE_SETTING_KEYS.filter(
		(key) => !rowsByKey.has(key),
	);

	if (missingKeys.length > 0) {
		throw new Error(
			`Missing required site settings: ${missingKeys.join(", ")}`,
		);
	}

	return SITE_SETTING_DEFINITIONS.map<AdminSiteSetting>((definition) => {
		const row = rowsByKey.get(definition.key);
		const value = row?.setting_value ?? "";
		const parsedValue = parseSiteSettingValue(
			definition.key,
			value,
			row?.setting_type ?? definition.type,
		);

		return {
			...definition,
			value,
			displayValue:
				definition.type === "JSON"
					? JSON.stringify(parsedValue, null, 2)
					: (parsedValue as string),
		};
	});
}
