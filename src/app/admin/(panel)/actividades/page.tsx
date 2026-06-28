import { getAdminActivities } from "@/actions/admin";
import { ActivitiesAdmin } from "@/components/admin/activities-admin";

export default async function ActividadesPage() {
	const activities = await getAdminActivities();

	return <ActivitiesAdmin items={activities} />;
}
