import {
	getAdminGalleryCategories,
	getAdminGalleryItems,
} from "@/actions/admin";
import { GalleryAdmin } from "@/components/admin/gallery-admin";

export default async function GaleriaPage() {
	// Parallel: neither read feeds the other, and awaiting them in sequence would
	// make the slower one wait on the faster for nothing.
	const [galleryItems, galleryCategories] = await Promise.all([
		getAdminGalleryItems(),
		getAdminGalleryCategories(),
	]);

	return <GalleryAdmin items={galleryItems} categories={galleryCategories} />;
}
