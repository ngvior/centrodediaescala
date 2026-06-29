"use client";

import { type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
	children: ReactNode;
	pendingLabel?: string;
	className?: string;
	variant?: React.ComponentProps<typeof Button>["variant"];
	size?: React.ComponentProps<typeof Button>["size"];
	disabled?: boolean;
};

/**
 * Submit button wired to the enclosing <form>'s pending state via
 * `useFormStatus`. Shows a spinner (and optional pending label) while the
 * server action runs. Must be rendered as a descendant of the <form> it
 * submits.
 */
export function SubmitButton({
	children,
	pendingLabel,
	className,
	variant,
	size,
	disabled = false,
}: SubmitButtonProps) {
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			variant={variant}
			size={size}
			className={className}
			disabled={pending || disabled}
		>
			{pending ? (
				<>
					<Loader2 className="animate-spin" aria-hidden="true" />
					{pendingLabel ?? children}
				</>
			) : (
				children
			)}
		</Button>
	);
}
