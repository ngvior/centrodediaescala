"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";

import { updateSiteSetting, type ActionResult } from "@/actions/admin";
import { FormError } from "@/components/admin/form-error";
import { NavigationEditor } from "@/components/admin/navigation-editor";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { StringListEditor } from "@/components/admin/string-list-editor";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { AdminSiteSetting, SiteSettingKey } from "@/lib/site-settings";

const INITIAL_STATE: ActionResult = { status: "idle" };

const SETTING_VALUE_FIELD = "setting_value";

/**
 * Keys that get the WYSIWYG {@link RichTextEditor}. This is an explicit allowlist
 * (NOT `type === "RICHTEXT"`) because `interview_form_description` is stored as
 * TEXT yet must render through the same markup pipeline. See the PR3 design.
 */
const RICH_TEXT_EDITOR_KEYS: ReadonlySet<SiteSettingKey> = new Set<SiteSettingKey>(
	[
		"home_hero_text",
		"about_text",
		"about_facilities_text",
		"about_requirements_text",
		"contact_body_text",
		"interview_form_description",
	],
);

/** JSON keys that get the friendly {@link StringListEditor}. */
const STRING_LIST_EDITOR_KEYS: ReadonlySet<SiteSettingKey> =
	new Set<SiteSettingKey>([
		"about_compliance_items",
		"about_requirements_items",
		"gallery_filter_labels",
	]);

function SettingValueField({ setting }: { setting: AdminSiteSetting }) {
	const required = setting.required !== false;

	if (RICH_TEXT_EDITOR_KEYS.has(setting.key)) {
		return (
			<RichTextEditor
				id={setting.key}
				name={SETTING_VALUE_FIELD}
				defaultValue={setting.displayValue}
				required={required}
				ariaLabel={setting.label}
			/>
		);
	}

	if (setting.key === "header_navigation") {
		return (
			<NavigationEditor
				id={setting.key}
				name={SETTING_VALUE_FIELD}
				defaultValue={setting.displayValue}
			/>
		);
	}

	if (STRING_LIST_EDITOR_KEYS.has(setting.key)) {
		return (
			<StringListEditor
				id={setting.key}
				name={SETTING_VALUE_FIELD}
				defaultValue={setting.displayValue}
				ariaLabel={setting.label}
			/>
		);
	}

	if (setting.input === "textarea") {
		return (
			<Textarea
				id={setting.key}
				name={SETTING_VALUE_FIELD}
				defaultValue={setting.displayValue}
				rows={4}
				required={required}
			/>
		);
	}

	return (
		<Input
			id={setting.key}
			name={SETTING_VALUE_FIELD}
			defaultValue={setting.displayValue}
			required={required}
		/>
	);
}

/**
 * Per-field client island for a single site setting. Drives
 * {@link updateSiteSetting} through `useActionState`, surfacing inline
 * "Guardado" on success and a {@link FormError} on failure — no error boundary,
 * no full-page crash on a single bad field (the pre-PR3 behaviour).
 */
export function SettingForm({ setting }: { setting: AdminSiteSetting }) {
	const [state, formAction] = useActionState(updateSiteSetting, INITIAL_STATE);

	const errorMessage = state.status === "error" ? state.message : null;
	const saved = state.status === "success";

	return (
		<form
			action={formAction}
			className="space-y-3 rounded-lg border border-border bg-white p-4"
		>
			<input type="hidden" name="setting_key" value={setting.key} />
			<input type="hidden" name="setting_type" value={setting.type} />

			<div className="space-y-1">
				<label
					htmlFor={setting.key}
					className="text-sm font-semibold text-foreground"
				>
					{setting.label}
				</label>
				<p className="text-xs text-muted-foreground">{setting.description}</p>
			</div>

			<SettingValueField setting={setting} />

			<FormError message={errorMessage} />

			<div className="flex items-center justify-between gap-4">
				<code className="text-xs text-muted-foreground">{setting.key}</code>
				<div className="flex items-center gap-3">
					{saved ? (
						<span className="flex items-center gap-1 text-sm font-medium text-emerald-700">
							<Check className="h-4 w-4" aria-hidden="true" />
							Guardado
						</span>
					) : null}
					<SubmitButton
						pendingLabel="Guardando…"
						className="bg-secondary text-white hover:bg-secondary/90"
					>
						Guardar
					</SubmitButton>
				</div>
			</div>
		</form>
	);
}
