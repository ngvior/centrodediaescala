"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImageIcon } from "lucide-react";

import { ImageLightbox } from "@/components/admin/image-lightbox";
import { Input } from "@/components/ui/input";
import {
	ACCEPTED_IMAGE_MIME_TYPES,
	MAX_IMAGE_SIZE_BYTES,
	MAX_IMAGE_SIZE_LABEL,
	OVERSIZED_IMAGE_MESSAGE,
} from "@/lib/images";

/**
 * Turns the primitive file input's selector button into a small bordered CTA.
 * Overrides the Input primitive's own `file:*` defaults via tailwind-merge.
 */
const FILE_INPUT_CLASSNAME =
	"file:mr-3 file:h-7 file:rounded-[9px] file:border file:border-border file:bg-white file:px-3 file:font-bold";

/**
 * Accepted formats and the size limit both come from src/lib/images.ts, the same
 * module the server-side upload helper reads, so the copy can never drift from
 * what the upload actually accepts.
 */
const DEFAULT_HELP_TEXT = `JPG, PNG, WEBP o GIF. Máximo ${MAX_IMAGE_SIZE_LABEL}.`;

const TOAST_DISMISS_MS = 4000;

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
	const [toast, setToast] = useState<{ message: string } | null>(null);
	const objectUrlRef = useRef<string | null>(null);

	useEffect(() => {
		return () => {
			if (objectUrlRef.current) {
				URL.revokeObjectURL(objectUrlRef.current);
			}
		};
	}, []);

	// Auto-dismiss: `toast` is a fresh object per rejection, so picking another
	// oversized file restarts the timer, and unmounting clears a pending one.
	useEffect(() => {
		if (!toast) {
			return;
		}

		const timer = setTimeout(() => setToast(null), TOAST_DISMISS_MS);
		return () => clearTimeout(timer);
	}, [toast]);

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];

		if (objectUrlRef.current) {
			URL.revokeObjectURL(objectUrlRef.current);
			objectUrlRef.current = null;
		}

		// A body over `serverActions.bodySizeLimit` is rejected by Next.js before
		// the Server Action runs, so the action can never report it and the submit
		// would fail with no feedback. Reject here and clear the input so the
		// oversized file cannot be submitted at all.
		if (file && file.size > MAX_IMAGE_SIZE_BYTES) {
			event.target.value = "";
			setPreviewUrl(null);
			setToast({ message: OVERSIZED_IMAGE_MESSAGE });
			return;
		}

		setToast(null);

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
							accept={ACCEPTED_IMAGE_MIME_TYPES}
							required={required && !existingUrl}
							onChange={handleChange}
							className={FILE_INPUT_CLASSNAME}
						/>
						<p className="text-xs text-muted-foreground">{helpText}</p>
					</div>
				</div>
			</div>

			{/*
			 * Fixed overlay at z-[60] so it clears the admin dialogs (z-50) this
			 * field always renders inside.
			 */}
			{toast ? (
				<div
					role="alert"
					className="fixed bottom-7 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-[12px] bg-[#7f1d1d] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-8px_rgba(127,29,29,0.5)] duration-200 animate-in fade-in-0 zoom-in-98 slide-in-from-bottom-2"
				>
					<span aria-hidden className="text-base text-[#fca5a5]">
						!
					</span>
					{toast.message}
				</div>
			) : null}
		</div>
	);
}
