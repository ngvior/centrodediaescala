"use client";

import { useActionState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAdmin, type LoginState } from "@/actions/auth";

const initialState: LoginState = { error: "" };

export default function LoginPage() {
	const [state, formAction] = useActionState(loginAdmin, initialState);

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
			<div className="mb-8 text-center">
				<div className="bg-primary text-white font-bold text-4xl px-4 py-2 rounded mb-2 inline-block">
					ESCALA
				</div>
				<p className="text-muted-foreground font-medium">
					Panel de Administración
				</p>
			</div>

			<Card className="w-full max-w-md shadow-lg border-none">
				<CardHeader className="space-y-1 pb-6">
					<CardTitle className="text-2xl font-bold text-center">
						Iniciar Sesión
					</CardTitle>
					<CardDescription className="text-center">
						Ingresá tus credenciales para acceder al backoffice
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={formAction} className="space-y-4">
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="email">
								Email
							</label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="admin@ejemplo.com"
								required
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="password">
								Contraseña
							</label>
							<Input id="password" name="password" type="password" required />
						</div>

						{state.error && (
							<div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
								{state.error}
							</div>
						)}

						<SubmitButton
							pendingLabel="Ingresando…"
							className="w-full bg-primary hover:bg-primary/90 text-white mt-4"
						>
							Ingresar
						</SubmitButton>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
