import { getAdminObjectives } from "@/actions/admin";
import { ObjectivesAdmin } from "@/components/admin/objectives-admin";

export default async function ObjetivosPage() {
	const objectives = await getAdminObjectives();

	return <ObjectivesAdmin items={objectives} />;
}
