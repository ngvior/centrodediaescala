"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
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
 * Admin row thumbnail that opens the full image in a dialog. Uncontrolled:
 * the Base UI <DialogTrigger> toggles the dialog, so no local state is needed.
 * The trigger is an accessible button wrapping the thumbnail; the content
 * shows the large image contained within the viewport.
 */
export function ImageLightbox({
	src,
	alt,
	title,
	className = "h-10 w-10 rounded object-cover",
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
			<DialogContent className="bg-white sm:max-w-3xl">
				{title ? (
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
				) : null}
				{/* eslint-disable-next-line @next/next/no-img-element -- admin-only full image of arbitrary Supabase URLs; next/image needs remote config. */}
				<img
					src={src}
					alt={alt}
					className="mx-auto max-h-[80vh] w-auto rounded object-contain"
				/>
			</DialogContent>
		</Dialog>
	);
}
