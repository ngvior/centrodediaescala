"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Input } from "@/components/ui/input";

/**
 * Accepted formats + size limit mirror the server-side validation in
 * src/lib/supabase/storage.ts (MAX_FILE_SIZE = 5MB, ALLOWED_MIME_TYPES =
 * jpeg/png/webp/gif). Keep this copy in sync if those limits change.
 */
const DEFAULT_HELP_TEXT = "JPG, PNG, WEBP o GIF. Máximo 5 MB.";
const ACCEPTED_MIME_TYPES = "image/jpeg,image/png,image/webp,image/gif";

type ImageUploadFieldProps = {
	name?: string;
	existingUrl?: string | null;
	label?: string;
	helpText?: string;
	required?: boolean;
};

/**
 * File input with a live preview. Selecting a file shows an object-URL preview;
 * with no selection it falls back to the existing image. A hidden
 * `existing_image_url` input carries the current URL so the update action can
 * preserve it when no new file is uploaded.
 */
export function ImageUploadField({
	name = "image_file",
	existingUrl = null,
	label = "Imagen",
	helpText = DEFAULT_HELP_TEXT,
	required = false,
}: ImageUploadFieldProps) {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const objectUrlRef = useRef<string | null>(null);

	useEffect(() => {
		return () => {
			if (objectUrlRef.current) {
				URL.revokeObjectURL(objectUrlRef.current);
			}
		};
	}, []);

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];

		if (objectUrlRef.current) {
			URL.revokeObjectURL(objectUrlRef.current);
			objectUrlRef.current = null;
		}

		if (file) {
			const url = URL.createObjectURL(file);
			objectUrlRef.current = url;
			setPreviewUrl(url);
		} else {
			setPreviewUrl(null);
		}
	}

	const shownSrc = previewUrl ?? existingUrl;

	return (
		<div className="space-y-2">
			<label className="text-sm font-medium">{label}</label>
			<input type="hidden" name="existing_image_url" value={existingUrl ?? ""} />
			<Input
				type="file"
				name={name}
				accept={ACCEPTED_MIME_TYPES}
				required={required && !existingUrl}
				onChange={handleChange}
			/>
			{shownSrc ? (
				// eslint-disable-next-line @next/next/no-img-element -- blob/object URLs and arbitrary Supabase URLs can't use next/image without remote config; this is an admin-only preview thumbnail.
				<img
					src={shownSrc}
					alt="Vista previa de la imagen"
					className="h-24 w-24 rounded-md border object-cover"
				/>
			) : null}
			<p className="text-xs text-muted-foreground">{helpText}</p>
		</div>
	);
}
