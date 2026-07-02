// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseMarkup, serializeMarkup } from "@/lib/markup";

import { docToDom, domToDoc } from "./rich-text-editor";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build a detached root element from an HTML fixture. innerHTML here only
// constructs TEST fixtures that simulate real execCommand output; it is not
// production code (the editor itself never uses innerHTML — guarded below).
function root(html: string): HTMLElement {
	const el = document.createElement("div");
	el.innerHTML = html;
	return el;
}

// DOM -> markdown, the direction where loss actually happens (#9).
function md(html: string): string {
	return serializeMarkup(domToDoc(root(html)));
}

describe("domToDoc — inline marks", () => {
	it("flattens nested marks innermost-wins (<strong><em>x</em></strong> -> em)", () => {
		expect(md("<strong><em>x</em></strong>")).toBe("*x*");
	});

	it("flattens nested marks innermost-wins (<em><strong>x</strong></em> -> strong)", () => {
		expect(md("<em><strong>x</strong></em>")).toBe("**x**");
	});

	it("maps <b>/<i> tags to strong/em", () => {
		expect(md("<p><b>a</b> and <i>b</i></p>")).toBe("**a** and *b*");
	});

	it("reads font-weight on partial-selection spans as strong", () => {
		expect(md('<p><span style="font-weight:600">x</span></p>')).toBe("**x**");
		expect(md('<p><span style="font-weight:bold">x</span></p>')).toBe("**x**");
	});

	it("reads font-style italic on spans as em", () => {
		expect(md('<p><span style="font-style:italic">x</span></p>')).toBe("*x*");
	});

	it("flattens unknown elements (font/span/a) to their text", () => {
		expect(md('<p><font color="red">hi</font> <a href="#">there</a></p>')).toBe(
			"hi there",
		);
	});
});

describe("domToDoc — block segmentation", () => {
	it("treats sibling div/ul/div as paragraph, list, paragraph", () => {
		expect(md("<div>a</div><ul><li>b</li></ul><div>c</div>")).toBe(
			"a\n\n- b\n\nc",
		);
	});

	it("keeps mid-paragraph <br> but trims trailing <br>", () => {
		expect(md("<p>a<br>b</p>")).toBe("a\nb");
		expect(md("<p>a<br></p>")).toBe("a");
	});

	it("treats a bare <div><br></div> as an empty paragraph (dropped)", () => {
		expect(md("<div><br></div>")).toBe("");
	});

	it("treats a lone root <br> as empty", () => {
		expect(md("<br>")).toBe("");
	});

	it("reads loose top-level text as a paragraph", () => {
		expect(md("hello world")).toBe("hello world");
	});

	it("flattens a nested <ul> into the parent list items", () => {
		expect(md("<ul><li>a<ul><li>b</li></ul></li></ul>")).toBe("- a\n- b");
	});

	it("handles a <div> wrapping a <ul> without an empty paragraph", () => {
		expect(md("<div><ul><li>x</li></ul></div>")).toBe("- x");
	});
});

describe("domToDoc — literal-text escaping round-trip (#10)", () => {
	it("escapes literal asterisks so prose stays literal", () => {
		const out = md("<p>2*3 y 4*5</p>");
		expect(out).toBe("2\\*3 y 4\\*5");
		// Re-parsing the serialized form yields the original text, no italics.
		expect(serializeMarkup(parseMarkup(out))).toBe(out);
	});

	it("escapes a typed leading '- ' paragraph so it never becomes a bullet", () => {
		const out = md("<div>- nota</div>");
		expect(out).toBe("\\- nota");
		expect(serializeMarkup(parseMarkup(out))).toBe(out);
	});
});

describe("docToDom — invariants", () => {
	it("renders an empty Doc as exactly one <p><br></p> (#8)", () => {
		const fragment = docToDom([], document);
		const host = document.createElement("div");
		host.appendChild(fragment);
		expect(host.children.length).toBe(1);
		const p = host.firstElementChild!;
		expect(p.tagName).toBe("P");
		expect(p.childNodes.length).toBe(1);
		expect(p.firstElementChild?.tagName).toBe("BR");
		// Round-trips back to empty.
		expect(serializeMarkup(domToDoc(host))).toBe("");
	});

	it("round-trips markdown -> DOM -> markdown losslessly", () => {
		const source = "Hola **mundo**\ncomo estas\n\n- uno\n- *dos*\n\nFin";
		const fragment = docToDom(parseMarkup(source), document);
		const host = document.createElement("div");
		host.appendChild(fragment);
		expect(serializeMarkup(domToDoc(host))).toBe(source);
	});
});

describe("security posture — no innerHTML in production source (#12)", () => {
	it("rich-text-editor.tsx contains no innerHTML or dangerouslySetInnerHTML", () => {
		const source = readFileSync(
			path.join(__dirname, "rich-text-editor.tsx"),
			"utf8",
		);
		expect(source).not.toContain("dangerouslySetInnerHTML");
		expect(source).not.toContain(".innerHTML");
	});
});
