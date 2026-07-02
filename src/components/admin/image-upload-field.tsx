"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImageIcon } from "lucide-react";

import { ImageLightbox } from "@/components/admin/image-lightbox";
import { Input } from "@/components/ui/input";

/**
 * Turns the primitive file input's selector button into a small bordered CTA.
 * Overrides the Input primitive's own `file:*` defaults via tailwind-merge.
 */
const FILE_INPUT_CLASSNAME =
	"file:mr-3 file:h-7 file:rounded-[9px] file:border file:border-border file:bg-white file:px-3 file:font-bold";

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
			<div className="rounded-xl border-[1.5px] border-dashed border-[#d5dae1] bg-[#fbfcfd] p-3.5">
				{/*
				 * The file <Input> stays at a fixed position in the tree (the second
				 * child of the layout wrapper) so selecting a file never remounts it
				 * and loses the chosen FileList. Only the leading preview/placeholder
				 * and the wrappers' classes switch between the two layouts.
				 */}
				<div
					className={
						shownSrc
							? "flex gap-4"
							: "flex flex-col items-center gap-2 py-5 text-center"
					}
				>
					{shownSrc ? (
						<ImageLightbox
							src={shownSrc}
							alt="Vista previa de la imagen"
							title={label}
							className="h-24 w-24 rounded-[10px] object-cover ring-1 ring-black/10 transition-shadow hover:ring-2 hover:ring-primary/50"
						/>
					) : (
						<ImageIcon className="h-6 w-6 text-[#b9c0c9]" aria-hidden="true" />
					)}
					<div
						className={
							shownSrc
								? "flex flex-1 flex-col justify-center gap-2"
								: "flex w-full flex-col items-center gap-2"
						}
					>
						<Input
							type="file"
							name={name}
							accept={ACCEPTED_MIME_TYPES}
							required={required && !existingUrl}
							onChange={handleChange}
							className={FILE_INPUT_CLASSNAME}
						/>
						<p className="text-xs text-muted-foreground">{helpText}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
