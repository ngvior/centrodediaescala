"use client";

import { useActionState } from "react";
import Image from "next/image";
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
		<div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-admin-canvas p-4 [--muted-foreground:#626973] [--radius:10px]">
			<svg
				aria-hidden
				className="pointer-events-none absolute -right-24 -top-28 h-[480px] w-[480px]"
				viewBox="0 0 400 400"
			>
				<g fill="#33506b" opacity="0.06">
					{Array.from({ length: 12 }).map((_, i) => (
						<rect
							key={i}
							x={240}
							y={356}
							width={120}
							height={8}
							rx={3}
							transform={`rotate(${i * -8} 40 360)`}
						/>
					))}
				</g>
			</svg>
			<div className="mb-8 text-center">
				<Image
					src="/logo.png"
					alt="Centro de Día Escala"
					width={250}
					height={100}
					preload
					className="mx-auto h-[76px] w-auto"
				/>
				<p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground mt-2">
					Panel de Administración
				</p>
			</div>

			<Card className="w-full max-w-md shadow-[0_12px_40px_-12px_rgba(16,24,40,0.2)] border-none">
				<div
					aria-hidden
					className="-mt-4 h-[3px] w-full bg-escala-spectrum"
				/>
				<CardHeader className="space-y-1 pb-6">
					<CardTitle className="text-2xl font-bold text-center uppercase tracking-wide">
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
