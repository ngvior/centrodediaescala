import { getAdminProfessionals } from "@/actions/admin";
import { ProfessionalsAdmin } from "@/components/admin/professionals-admin";

export default async function ProfesionalesPage() {
	const professionals = await getAdminProfessionals();

	return <ProfessionalsAdmin items={professionals} />;
}
