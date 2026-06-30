import { readFileSync } from "node:fs";
import path from "node:path";

import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import {
	type Doc,
	parseInline,
	parseMarkup,
	renderInline,
	renderMarkupBlocks,
	serializeMarkup,
} from "@/lib/markup";

// Helpers ------------------------------------------------------------------

function roundTripFromAst(doc: Doc): Doc {
	return parseMarkup(serializeMarkup(doc));
}

function stableFromText(text: string): boolean {
	const once = parseMarkup(text);
	const twice = parseMarkup(serializeMarkup(once));
	return JSON.stringify(once) === JSON.stringify(twice);
}

function elementType(node: ReactNode): string | undefined {
	return isValidElement(node) ? String((node as ReactElement).type) : undefined;
}

// parseMarkup --------------------------------------------------------------

describe("parseMarkup grammar", () => {
	it("treats marker-free text as a single paragraph", () => {
		expect(parseMarkup("Hola mundo")).toEqual([
			{ type: "paragraph", children: [{ type: "text", value: "Hola mundo" }] },
		]);
	});

	it("returns an empty doc for empty or whitespace input", () => {
		expect(parseMarkup("")).toEqual([]);
		expect(parseMarkup("   \n  ")).toEqual([]);
	});

	it("parses bold via **x** -> strong", () => {
		expect(parseMarkup("Hola **mundo**")).toEqual([
			{
				type: "paragraph",
				children: [
					{ type: "text", value: "Hola " },
					{ type: "strong", value: "mundo" },
				],
			},
		]);
	});

	it("parses italic via *x* -> em", () => {
		expect(parseMarkup("un *énfasis* aquí")).toEqual([
			{
				type: "paragraph",
				children: [
					{ type: "text", value: "un " },
					{ type: "em", value: "énfasis" },
					{ type: "text", value: " aquí" },
				],
			},
		]);
	});

	it("matches strong before em (no nesting)", () => {
		// **bold** wins; the inner content is taken literally.
		expect(parseMarkup("**a b**")).toEqual([
			{ type: "paragraph", children: [{ type: "strong", value: "a b" }] },
		]);
	});

	it("treats a single newline inside a block as <br>", () => {
		expect(parseMarkup("a\nb")).toEqual([
			{
				type: "paragraph",
				children: [
					{ type: "text", value: "a" },
					{ type: "br" },
					{ type: "text", value: "b" },
				],
			},
		]);
	});

	it("splits paragraphs on a blank line", () => {
		expect(parseMarkup("uno\n\ndos")).toEqual([
			{ type: "paragraph", children: [{ type: "text", value: "uno" }] },
			{ type: "paragraph", children: [{ type: "text", value: "dos" }] },
		]);
	});

	it("parses a bullet list when every line starts with '- '", () => {
		expect(parseMarkup("- Uno\n- Dos")).toEqual([
			{
				type: "list",
				items: [[{ type: "text", value: "Uno" }], [{ type: "text", value: "Dos" }]],
			},
		]);
	});

	it("parses inline marks inside list items", () => {
		expect(parseMarkup("- Uno\n- **Dos**")).toEqual([
			{
				type: "list",
				items: [
					[{ type: "text", value: "Uno" }],
					[{ type: "strong", value: "Dos" }],
				],
			},
		]);
	});

	it("keeps a lone '*' literal", () => {
		expect(parseMarkup("5 * 3")).toEqual([
			{ type: "paragraph", children: [{ type: "text", value: "5 * 3" }] },
		]);
	});
});

// Italic word-boundary guards (correction #7) ------------------------------

describe("emphasis flanking guards", () => {
	it("keeps prose asterisks literal: 'A*3 and B*5'", () => {
		expect(parseMarkup("A*3 and B*5")).toEqual([
			{ type: "paragraph", children: [{ type: "text", value: "A*3 and B*5" }] },
		]);
	});

	it("keeps multiplication-like '5*3 y 2*5' literal", () => {
		expect(parseInline("5*3 y 2*5")).toEqual([
			{ type: "text", value: "5*3 y 2*5" },
		]);
	});

	it("still emphasizes space-bounded *énfasis*", () => {
		expect(parseInline("*énfasis*")).toEqual([{ type: "em", value: "énfasis" }]);
	});
});

// Lossless round-trip: AST -> markdown -> AST ------------------------------

describe("serialize/parse round-trip is lossless for the AST", () => {
	const docs: Array<[string, Doc]> = [
		[
			"paragraph with bold + br + sibling paragraph",
			[
				{
					type: "paragraph",
					children: [
						{ type: "text", value: "Hola " },
						{ type: "strong", value: "mundo" },
						{ type: "br" },
						{ type: "text", value: "como estas" },
					],
				},
				{ type: "paragraph", children: [{ type: "text", value: "Nuevo" }] },
			],
		],
		[
			"list with a bold item",
			[
				{
					type: "list",
					items: [
						[{ type: "text", value: "Uno" }],
						[{ type: "strong", value: "Dos" }],
					],
				},
			],
		],
		[
			"literal asterisks in prose",
			[{ type: "paragraph", children: [{ type: "text", value: "2*3 y 4*5" }] }],
		],
		[
			"literal *word* pair stays literal",
			[{ type: "paragraph", children: [{ type: "text", value: "*word*" }] }],
		],
		[
			"paragraph line that begins with a literal '- '",
			[{ type: "paragraph", children: [{ type: "text", value: "- nota" }] }],
		],
		[
			"multi-line paragraph where each line starts with '- '",
			[
				{
					type: "paragraph",
					children: [
						{ type: "text", value: "- a" },
						{ type: "br" },
						{ type: "text", value: "- b" },
					],
				},
			],
		],
		[
			"literal backslash in text",
			[{ type: "paragraph", children: [{ type: "text", value: "ruta C:\\temp" }] }],
		],
		[
			"strong body containing an asterisk",
			[{ type: "paragraph", children: [{ type: "strong", value: "a*b" }] }],
		],
		[
			"emphasis node",
			[
				{
					type: "paragraph",
					children: [
						{ type: "text", value: "un " },
						{ type: "em", value: "énfasis" },
					],
				},
			],
		],
	];

	for (const [name, doc] of docs) {
		it(`round-trips: ${name}`, () => {
			expect(roundTripFromAst(doc)).toEqual(doc);
		});
	}

	it("a typed paragraph '- nota' never becomes a list, but a real list stays a list", () => {
		const typedParagraph: Doc = [
			{ type: "paragraph", children: [{ type: "text", value: "- nota" }] },
		];
		const realList: Doc = [
			{ type: "list", items: [[{ type: "text", value: "nota" }]] },
		];

		expect(roundTripFromAst(typedParagraph)).toEqual(typedParagraph);
		expect(roundTripFromAst(realList)).toEqual(realList);
		// They serialize to DIFFERENT markup, so they never collide.
		expect(serializeMarkup(typedParagraph)).not.toEqual(
			serializeMarkup(realList),
		);
	});
});

// Idempotent stability for arbitrary plain text ----------------------------

describe("parse->serialize is stable for arbitrary text", () => {
	const samples = [
		"Necesitamos un cuadro de 5*3 y 2*5 casillas",
		"costo 3*precio final",
		"- nota suelta",
		"Intro:\n- a\n- b",
		"texto con *asterisco* y **negrita**",
		"barra invertida \\ y asterisco *",
		"Hola **mundo**\ncomo estas\n\nNuevo",
	];

	for (const sample of samples) {
		it(`stable: ${JSON.stringify(sample)}`, () => {
			expect(stableFromText(sample)).toBe(true);
		});
	}

	it("escapes literal asterisks in the serialized output", () => {
		const serialized = serializeMarkup(parseMarkup("2*3"));
		expect(serialized).toBe("2\\*3");
		expect(parseMarkup(serialized)).toEqual([
			{ type: "paragraph", children: [{ type: "text", value: "2*3" }] },
		]);
	});

	it("escapes a leading '- ' paragraph line in the serialized output", () => {
		const doc: Doc = [
			{ type: "paragraph", children: [{ type: "text", value: "- nota" }] },
		];
		expect(serializeMarkup(doc)).toBe("\\- nota");
	});
});

// Canonical design examples round-trip as raw text -------------------------

describe("canonical design examples", () => {
	it("round-trips 'Hola **mundo**\\ncomo estas\\n\\nNuevo'", () => {
		const text = "Hola **mundo**\ncomo estas\n\nNuevo";
		expect(serializeMarkup(parseMarkup(text))).toBe(text);
	});

	it("round-trips '- Uno\\n- **Dos**'", () => {
		const text = "- Uno\n- **Dos**";
		expect(serializeMarkup(parseMarkup(text))).toBe(text);
	});
});

// React renderers ----------------------------------------------------------

describe("renderInline", () => {
	it("emits strings, <strong> and <em> nodes", () => {
		const nodes = renderInline("a **b** *c*");
		expect(nodes[0]).toBe("a ");
		expect(elementType(nodes[1])).toBe("strong");
		expect(nodes[2]).toBe(" ");
		expect(elementType(nodes[3])).toBe("em");
	});
});

describe("renderMarkupBlocks", () => {
	it("emits <p> and <ul><li> block elements", () => {
		const result = renderMarkupBlocks("Intro\n\n- x\n- y") as ReactNode[];
		expect(elementType(result[0])).toBe("p");

		const list = result[1] as ReactElement<{
			className?: string;
			children: ReactNode;
		}>;
		expect(elementType(list)).toBe("ul");
		expect(list.props.className).toContain("list-disc");

		const items = list.props.children as ReactElement[];
		expect(items).toHaveLength(2);
		expect(elementType(items[0])).toBe("li");
	});

	it("merges a caller-provided paragraph className", () => {
		const result = renderMarkupBlocks("Hola", {
			paragraphClassName: "text-white",
		}) as ReactNode[];
		const node = result[0] as ReactElement<{ className?: string }>;
		expect(node.props.className).toContain("text-white");
	});
});

// Security posture guard (correction #12) ----------------------------------

describe("zero-innerHTML posture", () => {
	it("markup.tsx never uses innerHTML or dangerouslySetInnerHTML", () => {
		const source = readFileSync(
			path.join(process.cwd(), "src/lib/markup.tsx"),
			"utf8",
		);
		expect(source).not.toContain("dangerouslySetInnerHTML");
		expect(source).not.toContain(".innerHTML");
	});
});
