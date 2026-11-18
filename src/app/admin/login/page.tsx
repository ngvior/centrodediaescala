"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";
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

const initialState: LoginState = { error: "", kind: null };

export default function LoginPage() {
	const [state, formAction] = useActionState(loginAdmin, initialState);
	// React resets uncontrolled fields after the action runs. A controlled email
	// keeps its value, so a failed login only asks for the password again.
	const [email, setEmail] = useState("");
	const [showPassword, setShowPassword] = useState(false);

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
					priority
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
								autoComplete="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="password">
								Contraseña
							</label>
							<div className="relative">
								<Input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									autoComplete="current-password"
									className="pr-9"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword((shown) => !shown)}
									aria-label={
										showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
									}
									aria-pressed={showPassword}
									className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
								>
									{showPassword ? (
										<EyeOff aria-hidden="true" className="size-4" />
									) : (
										<Eye aria-hidden="true" className="size-4" />
									)}
								</button>
							</div>
						</div>

						{state.error &&
							(state.kind === "unavailable" ? (
								<div
									role="alert"
									className="flex items-start gap-2 border border-amber-200 bg-amber-50 text-amber-900 text-sm p-3 rounded-md"
								>
									<TriangleAlert
										aria-hidden="true"
										className="size-4 shrink-0 mt-0.5"
									/>
									<span>{state.error}</span>
								</div>
							) : (
								<div
									role="alert"
									className="bg-destructive/10 text-destructive text-sm p-3 rounded-md"
								>
									{state.error}
								</div>
							))}

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
