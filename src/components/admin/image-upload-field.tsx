"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Crop, ImageIcon } from "lucide-react";

import { ImageCropper } from "@/components/admin/image-cropper";
import { ImageLightbox } from "@/components/admin/image-lightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { optimizeImageForGallery } from "@/lib/browser-image";
import {
	ACCEPTED_IMAGE_MIME_TYPES,
	ATTACH_CROP_FAILED_MESSAGE,
	isOptimizableImageType,
	MAX_IMAGE_SIZE_BYTES,
	MAX_IMAGE_SIZE_LABEL,
	MAX_SOURCE_IMAGE_SIZE_BYTES,
	MAX_SOURCE_IMAGE_SIZE_LABEL,
	OPTIMIZE_IMAGE_FAILED_MESSAGE,
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

/**
 * With optimisation on, the photo is re-encoded in the browser before upload, so
 * the Server Action body limit stops being the admin's problem: a photo straight
 * from a phone or camera is fine and nothing is cropped.
 */
const OPTIMIZE_HELP_TEXT = `JPG, PNG o WEBP hasta ${MAX_SOURCE_IMAGE_SIZE_LABEL}: la foto se optimiza sola antes de subirse, sin recortarse. GIF hasta ${MAX_IMAGE_SIZE_LABEL}.`;

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
	/**
	 * Re-encodes the selected photo in the browser before upload, keeping the
	 * whole frame and its aspect ratio, and emits the encoded dimensions as
	 * hidden fields. For callers whose images are rendered uncropped at their
	 * natural ratio, which is the gallery. Ignored when `aspectRatio` is set:
	 * cropping already re-encodes.
	 */
	optimize?: boolean;
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
	optimize = false,
}: ImageUploadFieldProps) {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [toast, setToast] = useState<{ message: string } | null>(null);
	const [cropSource, setCropSource] = useState<CropSource | null>(null);
	const [isCropping, setIsCropping] = useState(false);
	const [isOptimizing, setIsOptimizing] = useState(false);
	const [dimensions, setDimensions] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const previewUrlRef = useRef<string | null>(null);
	const sourceUrlRef = useRef<string | null>(null);

	const cropEnabled = typeof aspectRatio === "number";
	const optimizeEnabled = optimize && !cropEnabled;
	const resolvedHelpText =
		helpText ??
		(cropEnabled
			? CROP_HELP_TEXT
			: optimizeEnabled
				? OPTIMIZE_HELP_TEXT
				: DEFAULT_HELP_TEXT);

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

	/**
	 * Writes a re-encoded file back into the file input, which keeps the input the
	 * single source of truth: the surrounding <form action={...}> and the Server
	 * Action need no changes. Assigning `files` does not emit a change event, so
	 * this cannot loop back into handleChange.
	 *
	 * Returns false on any browser that cannot do this, rather than throwing.
	 * Three failures are possible and only one of them is silent: `DataTransfer`
	 * may not be constructible, `input.files` may be read-only (a TypeError under
	 * the strict mode modules already run in), or the assignment may be accepted
	 * and do nothing. The first two raise, so the write is wrapped; the last is
	 * what the length check below catches. Callers must report a false return:
	 * silently, the admin would save the record with no image and no idea why.
	 */
	function writeFileToInput(file: File) {
		const input = inputRef.current;

		if (!input) {
			return false;
		}

		try {
			const transfer = new DataTransfer();
			transfer.items.add(file);
			input.files = transfer.files;
		} catch {
			return false;
		}

		return input.files?.length === 1;
	}

	async function optimizeSelection(input: HTMLInputElement, file: File) {
		// Hold the original out of the input while it is re-encoded. Only the
		// optimised file may ever be submitted: the original is what would
		// overflow the Server Action body limit.
		input.value = "";
		replacePreview(null);
		setDimensions(null);
		setIsOptimizing(true);

		try {
			const encoded = await optimizeImageForGallery(file);

			// Defence in depth. At the gallery's max edge and quality a photo lands
			// far under the limit, so this only fires for something pathological.
			if (encoded.file.size > MAX_IMAGE_SIZE_BYTES) {
				setToast({ message: OVERSIZED_IMAGE_MESSAGE });
				return;
			}

			if (!writeFileToInput(encoded.file)) {
				setToast({ message: OPTIMIZE_IMAGE_FAILED_MESSAGE });
				return;
			}

			setDimensions({ width: encoded.width, height: encoded.height });
			replacePreview(URL.createObjectURL(encoded.file));
		} catch {
			setToast({ message: OPTIMIZE_IMAGE_FAILED_MESSAGE });
		} finally {
			setIsOptimizing(false);
		}
	}

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		const input = event.target;
		const file = input.files?.[0];

		if (!file) {
			replacePreview(null);
			setDimensions(null);
			return;
		}

		// A file that gets re-encoded in the browser never reaches the Server
		// Action as-is, so it earns the high source ceiling. One uploaded untouched
		// has to clear the body limit, and Next.js rejects an oversized body before
		// the action runs, which is why that can only be caught here.
		const willReencode =
			cropEnabled || (optimizeEnabled && isOptimizableImageType(file.type));
		const limit = willReencode
			? MAX_SOURCE_IMAGE_SIZE_BYTES
			: MAX_IMAGE_SIZE_BYTES;

		if (file.size > limit) {
			input.value = "";
			replacePreview(null);
			setDimensions(null);
			setToast({
				message: willReencode
					? OVERSIZED_SOURCE_IMAGE_MESSAGE
					: OVERSIZED_IMAGE_MESSAGE,
			});
			return;
		}

		setToast(null);

		if (cropEnabled) {
			// Hold the original out of the input: only a confirmed crop goes back in.
			const url = URL.createObjectURL(file);
			input.value = "";
			replacePreview(null);
			replaceSourceUrl(url);
			setCropSource({
				url,
				fileName: toCroppedFileName(file.name),
				remote: false,
			});
			setIsCropping(true);
			return;
		}

		if (optimizeEnabled && isOptimizableImageType(file.type)) {
			void optimizeSelection(input, file);
			return;
		}

		// Uploaded as-is: a caller with no optimisation, or an animated GIF, whose
		// animation a canvas re-encode would flatten to its first frame.
		setDimensions(null);
		replacePreview(URL.createObjectURL(file));
	}

	function handleCropConfirm(file: File) {
		if (file.size > MAX_IMAGE_SIZE_BYTES) {
			setToast({ message: OVERSIZED_IMAGE_MESSAGE });
			return;
		}

		if (!writeFileToInput(file)) {
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
			{/*
			 * Only rendered once an encode has produced real dimensions. Their
			 * absence is meaningful to the update action: it means this submission
			 * carries no new image, so the stored dimensions must be left alone.
			 */}
			{dimensions ? (
				<>
					<input type="hidden" name="image_width" value={dimensions.width} />
					<input type="hidden" name="image_height" value={dimensions.height} />
				</>
			) : null}
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
							/*
							 * Required while an encode is in flight, even when editing. The
							 * input is deliberately empty until the encoded file is written
							 * back, so this makes the browser block a premature submit
							 * instead of letting it through: on an edit there is no other
							 * guard, and the record would save with the previous image and no
							 * indication that the new one never made it.
							 */
							required={(required && !existingUrl) || isOptimizing}
							onChange={handleChange}
							className={FILE_INPUT_CLASSNAME}
						/>
						<p className="text-xs text-muted-foreground">{resolvedHelpText}</p>
						{/*
						 * The encode is async and the submit button lives outside this
						 * field, so this is what tells the admin not to save yet. Until
						 * the preview appears the input is deliberately empty.
						 */}
						{isOptimizing ? (
							<p role="status" className="text-xs font-medium text-[#9a6b00]">
								Optimizando la imagen… esperá la vista previa antes de guardar.
							</p>
						) : null}
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
