"use client";

import { createElement, useState } from "react";

import {
	ACTIVITY_ICONS,
	getActivityIcon,
	type ActivityIconSlug,
} from "@/lib/activity-icons";

/**
 * Renders the lucide icon for a given activity slug. Used by the field below
 * and by the activities admin island/table to preview the selected icon.
 */
export function ActivityIconPreview({ slug }: { slug: string }) {
	return createElement(getActivityIcon(slug), {
		className: "h-6 w-6 text-primary",
		"aria-hidden": "true",
	});
}

type ActivityIconFieldProps = {
	name?: string;
	defaultValue?: ActivityIconSlug;
	label?: string;
};

/**
 * Slug <select> that drives a live lucide preview. The selected slug is local
 * state and the preview is derived during render (no effect). The submitted
 * value is the raw slug, matching the server action's normalizeActivityIcon.
 */
export function ActivityIconField({
	name = "icon",
	defaultValue = "heart",
	label = "Ícono",
}: ActivityIconFieldProps) {
	const [slug, setSlug] = useState<ActivityIconSlug>(defaultValue);

	return (
		<div className="space-y-2">
			<label className="text-sm font-medium" htmlFor={name}>
				{label}
			</label>
			<div className="flex items-center gap-3">
				<select
					id={name}
					name={name}
					value={slug}
					onChange={(event) =>
						setSlug(event.target.value as ActivityIconSlug)
					}
					className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					{ACTIVITY_ICONS.map((option) => (
						<option key={option.slug} value={option.slug}>
							{option.label}
						</option>
					))}
				</select>
				<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white">
					<ActivityIconPreview slug={slug} />
				</span>
			</div>
		</div>
	);
}
