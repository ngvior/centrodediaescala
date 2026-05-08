import { redirect } from "next/navigation";

export default function AdminIndex() {
  // Cuando haya auth real, acá chequeamos si está logueado. 
  // Por ahora lo mandamos directo al dashboard.
  redirect("/admin/dashboard");
}
