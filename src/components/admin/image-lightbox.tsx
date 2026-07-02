"use client";

import { X } from "lucide-react";

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

type ImageLightboxProps = {
	src: string;
	alt: string;
	title?: string;
	/** Thumbnail <img> classes. */
	className?: string;
};

/**
 * Admin row thumbnail that opens the full image in an immersive dark viewer.
 * Uncontrolled: the Base UI <DialogTrigger> toggles the dialog, so no local
 * state is needed. The trigger is an accessible button wrapping the thumbnail;
 * the content shows the large image contained within the viewport with a
 * caption below it and a dedicated close control.
 */
export function ImageLightbox({
	src,
	alt,
	title,
	className = "h-12 w-12 rounded-[10px] object-cover ring-1 ring-black/10 transition-shadow hover:ring-2 hover:ring-primary/50",
}: ImageLightboxProps) {
	return (
		<Dialog>
			<DialogTrigger
				render={
					<button
						type="button"
						aria-label="Ver imagen ampliada"
						className="cursor-zoom-in rounded outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					/>
				}
			>
				{/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail of arbitrary Supabase URLs; next/image needs remote config. */}
				<img src={src} alt={alt} className={className} />
			</DialogTrigger>
			<DialogContent
				className="border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-4xl"
				overlayClassName="bg-[#0d1116]/90 supports-backdrop-filter:backdrop-blur-sm"
				showCloseButton={false}
				forceOverlay
			>
				<DialogClose className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-[10px] bg-white/10 text-white/75 outline-none hover:bg-white/15 hover:text-white focus-visible:ring-3 focus-visible:ring-ring/50">
					<X className="h-5 w-5" aria-hidden="true" />
					<span className="sr-only">Cerrar</span>
				</DialogClose>
				{/* eslint-disable-next-line @next/next/no-img-element -- admin-only full image of arbitrary Supabase URLs; next/image needs remote config. */}
				<img
					src={src}
					alt={alt}
					className="mx-auto max-h-[76vh] w-auto rounded-lg object-contain shadow-2xl"
				/>
				{title ? (
					<div>
						<DialogTitle className="text-center font-heading text-lg font-semibold tracking-[0.05em] text-white uppercase">
							{title}
						</DialogTitle>
						<div
							aria-hidden
							className="mx-auto mt-2 h-[3px] w-9 rounded-full bg-escala-spectrum"
						/>
					</div>
				) : (
					<DialogTitle className="sr-only">{alt || "Imagen"}</DialogTitle>
				)}
			</DialogContent>
		</Dialog>
	);
}
