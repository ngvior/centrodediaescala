"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { Button } from "@/components/ui/button";
import { loadImage, renderPlanToFile } from "@/lib/browser-image";
import {
	CROP_OUTPUT_MIME,
	CROP_OUTPUT_QUALITY,
	planCropDraw,
	type CropArea,
} from "@/lib/images";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.01;

type ImageCropperProps = {
	src: string;
	aspectRatio: number;
	/** Round overlay, to match a circular render on the public site. */
	circular?: boolean;
	/**
	 * Load the source through CORS. Required for an image already stored in the
	 * bucket: without it the canvas is tainted and `toBlob` throws a SecurityError.
	 * Not needed for a local `blob:` URL.
	 */
	remote?: boolean;
	fileName: string;
	onConfirm: (file: File) => void;
	onCancel: () => void;
};

async function toCroppedFile(
	src: string,
	area: CropArea,
	remote: boolean,
	fileName: string,
): Promise<File> {
	const image = await loadImage(src, remote);
	const plan = planCropDraw(area, {
		width: image.naturalWidth,
		height: image.naturalHeight,
	});

	const encoded = await renderPlanToFile(
		image,
		plan,
		CROP_OUTPUT_MIME,
		CROP_OUTPUT_QUALITY,
		fileName,
	);

	return encoded.file;
}

/**
 * Crop surface with a locked aspect ratio. Purely presentational: it knows
 * nothing about forms or Server Actions — it takes a source and hands back a
 * ready-to-upload File.
 */
export function ImageCropper({
	src,
	aspectRatio,
	circular = false,
	remote = false,
	fileName,
	onConfirm,
	onCancel,
}: ImageCropperProps) {
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(MIN_ZOOM);
	const [area, setArea] = useState<Area | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCropComplete = useCallback(
		(_percentageArea: Area, pixelArea: Area) => setArea(pixelArea),
		[],
	);

	async function handleConfirm() {
		if (!area) {
			return;
		}

		setIsProcessing(true);
		setError(null);

		try {
			onConfirm(await toCroppedFile(src, area, remote, fileName));
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "No se pudo generar el recorte.",
			);
		} finally {
			setIsProcessing(false);
		}
	}

	return (
		<div className="space-y-3">
			{/* react-easy-crop positions itself absolutely, so the parent owns the height. */}
			<div className="relative h-[280px] overflow-hidden rounded-[10px] bg-[#0f172a]">
				<Cropper
					image={src}
					crop={crop}
					zoom={zoom}
					aspect={aspectRatio}
					cropShape={circular ? "round" : "rect"}
					showGrid={!circular}
					minZoom={MIN_ZOOM}
					maxZoom={MAX_ZOOM}
					restrictPosition
					mediaProps={remote ? { crossOrigin: "anonymous" } : {}}
					onCropChange={setCrop}
					onZoomChange={setZoom}
					onCropComplete={handleCropComplete}
				/>
			</div>

			<div className="flex items-center gap-3">
				<label
					className="text-xs font-medium text-muted-foreground"
					htmlFor="crop-zoom"
				>
					Zoom
				</label>
				<input
					id="crop-zoom"
					type="range"
					min={MIN_ZOOM}
					max={MAX_ZOOM}
					step={ZOOM_STEP}
					value={zoom}
					onChange={(event) => setZoom(Number(event.target.value))}
					className="h-1.5 flex-1 accent-primary"
				/>
			</div>

			<p className="text-xs text-muted-foreground">
				Arrastrá para elegir la parte de la foto que se va a ver. En celular
				podés hacer zoom con dos dedos.
			</p>

			{error ? (
				<p role="alert" className="text-xs font-medium text-destructive">
					{error}
				</p>
			) : null}

			<div className="flex gap-2">
				<Button
					type="button"
					onClick={handleConfirm}
					disabled={isProcessing || !area}
					className="bg-secondary text-white"
				>
					{isProcessing ? "Procesando…" : "Aplicar recorte"}
				</Button>
				<Button
					type="button"
					variant="ghost"
					onClick={onCancel}
					disabled={isProcessing}
				>
					Cancelar
				</Button>
			</div>
		</div>
	);
}
