"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Crop, ImageIcon } from "lucide-react";

import { ImageCropper } from "@/components/admin/image-cropper";
import { ImageLightbox } from "@/components/admin/image-lightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	ACCEPTED_IMAGE_MIME_TYPES,
	ATTACH_CROP_FAILED_MESSAGE,
	MAX_IMAGE_SIZE_BYTES,
	MAX_IMAGE_SIZE_LABEL,
	MAX_SOURCE_IMAGE_SIZE_BYTES,
	MAX_SOURCE_IMAGE_SIZE_LABEL,
	OVERSIZED_IMAGE_MESSAGE,
	OVERSIZED_SOURCE_IMAGE_MESSAGE,
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

/**
 * With cropping on, the chosen file never leaves the browser: it is re-encoded
 * to a small square first, so the Server Action body limit does not apply to it
 * and a phone photo is perfectly acceptable.
 */
const CROP_HELP_TEXT = `JPG, PNG, WEBP o GIF. Hasta ${MAX_SOURCE_IMAGE_SIZE_LABEL}: la foto se recorta y se optimiza antes de subirse.`;

const TOAST_DISMISS_MS = 4000;

type CropSource = {
	url: string;
	fileName: string;
	/** A bucket URL needs CORS; a local `blob:` URL does not. */
	remote: boolean;
};

type ImageUploadFieldProps = {
	name?: string;
	existingUrl?: string | null;
	label?: string;
	helpText?: string;
	required?: boolean;
	/**
	 * Locks cropping to this width/height ratio. Omitting it keeps the plain
	 * upload behaviour, which is what callers rendering images at their natural
	 * ratio (the gallery) need.
	 */
	aspectRatio?: number;
	/** Round crop overlay, for a photo the public site renders in a circle. */
	circularCrop?: boolean;
};

/** Cropped output is always re-encoded, so the extension has to follow. */
function toCroppedFileName(source: string) {
	const base = source.split("/").pop()?.replace(/\.[^./]+$/, "") ?? "imagen";
	return `${base || "imagen"}.jpg`;
}

/**
 * File input with a live preview. Selecting a file shows an object-URL preview;
 * with no selection it falls back to the existing image. A hidden
 * `existing_image_url` input carries the current URL so the update action can
 * preserve it when no new file is uploaded.
 *
 * With `aspectRatio` set, a selected file is held out of the input until the
 * admin confirms a crop, and the confirmed crop is written back into the same
 * file input. That keeps the Server Action contract untouched — it still reads
 * `image_file` from FormData — and makes the fixed ratio structural: the input
 * can only ever carry a correctly cropped image.
 */
export function ImageUploadField({
	name = "image_file",
	existingUrl = null,
	label = "Imagen",
	helpText,
	required = false,
	aspectRatio,
	circularCrop = false,
}: ImageUploadFieldProps) {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [toast, setToast] = useState<{ message: string } | null>(null);
	const [cropSource, setCropSource] = useState<CropSource | null>(null);
	const [isCropping, setIsCropping] = useState(false);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const previewUrlRef = useRef<string | null>(null);
	const sourceUrlRef = useRef<string | null>(null);

	const cropEnabled = typeof aspectRatio === "number";
	const resolvedHelpText =
		helpText ?? (cropEnabled ? CROP_HELP_TEXT : DEFAULT_HELP_TEXT);

	useEffect(() => {
		return () => {
			if (previewUrlRef.current) {
				URL.revokeObjectURL(previewUrlRef.current);
			}
			if (sourceUrlRef.current) {
				URL.revokeObjectURL(sourceUrlRef.current);
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

	function replacePreview(url: string | null) {
		if (previewUrlRef.current) {
			URL.revokeObjectURL(previewUrlRef.current);
			previewUrlRef.current = null;
		}

		if (url) {
			previewUrlRef.current = url;
		}

		setPreviewUrl(url);
	}

	function replaceSourceUrl(url: string | null) {
		if (sourceUrlRef.current) {
			URL.revokeObjectURL(sourceUrlRef.current);
			sourceUrlRef.current = null;
		}

		if (url) {
			sourceUrlRef.current = url;
		}
	}

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];

		if (!file) {
			replacePreview(null);
			return;
		}

		// Without cropping the file is uploaded as-is, so it has to clear the
		// Server Action body limit. Next.js rejects an oversized body before the
		// action runs, which is why this can only be caught here.
		const limit = cropEnabled
			? MAX_SOURCE_IMAGE_SIZE_BYTES
			: MAX_IMAGE_SIZE_BYTES;

		if (file.size > limit) {
			event.target.value = "";
			replacePreview(null);
			setToast({
				message: cropEnabled
					? OVERSIZED_SOURCE_IMAGE_MESSAGE
					: OVERSIZED_IMAGE_MESSAGE,
			});
			return;
		}

		setToast(null);
		const url = URL.createObjectURL(file);

		if (!cropEnabled) {
			replacePreview(url);
			return;
		}

		// Hold the original out of the input: only a confirmed crop goes back in.
		event.target.value = "";
		replacePreview(null);
		replaceSourceUrl(url);
		setCropSource({
			url,
			fileName: toCroppedFileName(file.name),
			remote: false,
		});
		setIsCropping(true);
	}

	function handleCropConfirm(file: File) {
		const input = inputRef.current;

		if (!input) {
			return;
		}

		if (file.size > MAX_IMAGE_SIZE_BYTES) {
			setToast({ message: OVERSIZED_IMAGE_MESSAGE });
			return;
		}

		// Writing to `input.files` keeps this file input the single source of
		// truth, so the surrounding <form action={...}> and the Server Action need
		// no changes. Assigning files does not emit a change event, so this cannot
		// loop back into handleChange.
		const transfer = new DataTransfer();
		transfer.items.add(file);
		input.files = transfer.files;

		// Assigning `files` is a no-op on browsers without DataTransfer support.
		// Failing loudly matters here: silently, the admin would save the record
		// with no image and no idea why.
		if (input.files?.length !== 1) {
			setToast({ message: ATTACH_CROP_FAILED_MESSAGE });
			return;
		}

		replacePreview(URL.createObjectURL(file));
		setIsCropping(false);
	}

	function handleCropCancel() {
		setIsCropping(false);

		// Nothing was ever written to the input, so cancelling leaves the record's
		// current image untouched.
		if (!previewUrl) {
			replaceSourceUrl(null);
			setCropSource(null);
		}
	}

	function startCroppingExisting() {
		if (!existingUrl) {
			return;
		}

		replaceSourceUrl(null);
		setCropSource({
			url: existingUrl,
			fileName: toCroppedFileName(existingUrl),
			remote: true,
		});
		setIsCropping(true);
	}

	const shownSrc = previewUrl ?? existingUrl;
	const canRecropSource = cropEnabled && cropSource && !isCropping;
	const canCropExisting =
		cropEnabled && !cropSource && !previewUrl && Boolean(existingUrl);

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
							className={
								circularCrop
									? "h-24 w-24 rounded-full object-cover ring-1 ring-black/10 transition-shadow hover:ring-2 hover:ring-primary/50"
									: "h-24 w-24 rounded-[10px] object-cover ring-1 ring-black/10 transition-shadow hover:ring-2 hover:ring-primary/50"
							}
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
							ref={inputRef}
							type="file"
							name={name}
							accept={ACCEPTED_IMAGE_MIME_TYPES}
							required={required && !existingUrl}
							onChange={handleChange}
							className={FILE_INPUT_CLASSNAME}
						/>
						<p className="text-xs text-muted-foreground">{resolvedHelpText}</p>
						{canCropExisting || canRecropSource ? (
							<Button
								type="button"
								variant="ghost"
								onClick={
									canRecropSource
										? () => setIsCropping(true)
										: startCroppingExisting
								}
								className="h-7 w-fit gap-1.5 px-2 text-xs font-bold text-secondary"
							>
								<Crop className="h-3.5 w-3.5" aria-hidden="true" />
								{canRecropSource ? "Ajustar recorte" : "Recortar imagen actual"}
							</Button>
						) : null}
					</div>
				</div>

				{isCropping && cropSource && aspectRatio !== undefined ? (
					<div className="mt-3.5 border-t border-[#e6eaee] pt-3.5">
						<ImageCropper
							src={cropSource.url}
							aspectRatio={aspectRatio}
							circular={circularCrop}
							remote={cropSource.remote}
							fileName={cropSource.fileName}
							onConfirm={handleCropConfirm}
							onCancel={handleCropCancel}
						/>
						<p className="mt-2 text-xs font-medium text-[#9a6b00]">
							Aplicá el recorte para adjuntar la imagen al formulario.
						</p>
					</div>
				) : null}
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
