import { getAdminGalleryItems } from "@/actions/admin";
import { GalleryAdmin } from "@/components/admin/gallery-admin";

export default async function GaleriaPage() {
	const galleryItems = await getAdminGalleryItems();

	return <GalleryAdmin items={galleryItems} />;
}
