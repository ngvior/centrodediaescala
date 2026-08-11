import { describe, expect, it } from "vitest";
import { metadata } from "./layout";

describe("AdminRootLayout metadata", () => {
	it("exports admin metadata title configuration", () => {
		expect(metadata.title).toEqual({
			default: "Administración - Centro de Día Escala",
			template: "%s | Administración - Centro de Día Escala",
		});
	});
});
