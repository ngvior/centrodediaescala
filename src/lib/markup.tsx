import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared safe markup grammar for the public site and the admin rich-text editor.
 *
 * Storage format is a constrained Markdown subset kept as PLAIN TEXT:
 *   - Blocks are separated by a blank line (\n{2,}).
 *   - A block is a LIST iff every non-empty line starts with "- " (dash+space);
 *     each such line becomes an <li>. Otherwise the block is a PARAGRAPH and a
 *     single \n inside it becomes a <br>.
 *   - Inline marks (inside paragraph text and inside each list item):
 *       **x** -> <strong> (matched FIRST)
 *       *x*   -> <em> (with CommonMark-style word-boundary flanking guards)
 *   - No nesting (***x*** is unsupported — documented limitation).
 *
 * Escaping (lossless round-trip for arbitrary leaf text):
 *   serializeMarkup escapes, in TEXT leaves, "\" -> "\\" and "*" -> "\*", and a
 *   PARAGRAPH line that begins with "- " is prefixed with "\" so it can never be
 *   re-read as a bullet. parseMarkup reverses this: a "\" escapes the next single
 *   character. This makes the round-trip lossless for prose containing literal
 *   "*", "**", and leading "- " — e.g. "2*3 y 4*5" and "- nota" survive intact
 *   and never accidentally italicize or become a list.
 *
 * Documented limitations:
 *   - Two consecutive <br> (blank line inside a paragraph) cannot be represented;
 *     it would re-parse as a paragraph break. Enter = new paragraph,
 *     Shift+Enter = single <br>.
 *   - Bold/italic content may not contain a newline.
 *
 * Security: this module builds React elements only and never injects raw HTML.
 * Keeping that posture is the whole point (see the markup.test.ts source guard).
 */

export type Inline =
	| { type: "text"; value: string }
	| { type: "strong"; value: string }
	| { type: "em"; value: string }
	| { type: "br" };

export type Block =
	| { type: "paragraph"; children: Inline[] }
	| { type: "list"; items: Inline[][] };

export type Doc = Block[];

// ---------------------------------------------------------------------------
// Escaping helpers
// ---------------------------------------------------------------------------

// Escape backslash FIRST, then asterisk. A single backslash escapes the next
// character on the way back in (see unescape handling in parseInline).
function escapeText(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/\*/g, "\\*");
}

// ---------------------------------------------------------------------------
// Inline scanner (markdown -> Inline[])
// ---------------------------------------------------------------------------

type MarkMatch = { value: string; end: number };

// Scan a mark body starting at `start`, returning the unescaped content and the
// index just past the closing delimiter. Returns null when there is no valid
// closing delimiter, the body is empty, the body spans a newline, or (for "**")
// the body contains a stray single "*".
function matchMark(
	source: string,
	start: number,
	delimiter: "*" | "**",
): MarkMatch | null {
	let index = start;
	let value = "";

	while (index < source.length) {
		const char = source[index];

		if (char === "\n" || char === "\r") {
			return null;
		}

		if (char === "\\" && index + 1 < source.length) {
			value += source[index + 1];
			index += 2;
			continue;
		}

		if (delimiter === "**") {
			if (char === "*" && source[index + 1] === "*") {
				return value.length === 0 ? null : { value, end: index + 2 };
			}
			if (char === "*") {
				// A single "*" inside a strong body is not allowed by the grammar.
				return null;
			}
		} else if (char === "*") {
			return value.length === 0 ? null : { value, end: index + 1 };
		}

		value += char;
		index += 1;
	}

	return null;
}

const WORD_RE = /\w/;

// CommonMark-style flanking guards for emphasis: the opening "*" must not be
// immediately preceded by a word character, and the closing "*" must not be
// immediately followed by one. This keeps prose like "5*3 y 2*5" literal while
// still emphasizing space-bounded "*word*".
function emphasisFlanksOk(
	source: string,
	openIndex: number,
	match: MarkMatch,
): boolean {
	const before = openIndex > 0 ? source[openIndex - 1] : "";
	const after = match.end < source.length ? source[match.end] : "";
	return !WORD_RE.test(before) && !WORD_RE.test(after);
}

/**
 * Parse a single inline string (no block structure) into Inline nodes.
 * Literal "\n" characters are preserved inside text leaves (callers that want
 * paragraph <br> handling go through parseMarkup).
 */
export function parseInline(text: string): Inline[] {
	const out: Inline[] = [];
	let buffer = "";

	const flush = () => {
		if (buffer.length > 0) {
			out.push({ type: "text", value: buffer });
			buffer = "";
		}
	};

	let index = 0;
	while (index < text.length) {
		const char = text[index];

		if (char === "\\" && index + 1 < text.length) {
			buffer += text[index + 1];
			index += 2;
			continue;
		}

		if (char === "*") {
			if (text[index + 1] === "*") {
				const match = matchMark(text, index + 2, "**");
				if (match) {
					flush();
					out.push({ type: "strong", value: match.value });
					index = match.end;
					continue;
				}
			} else {
				const match = matchMark(text, index + 1, "*");
				if (match && emphasisFlanksOk(text, index, match)) {
					flush();
					out.push({ type: "em", value: match.value });
					index = match.end;
					continue;
				}
			}
		}

		buffer += char;
		index += 1;
	}

	flush();
	return out;
}

// ---------------------------------------------------------------------------
// Block parser (markdown -> Doc)
// ---------------------------------------------------------------------------

function isListLine(line: string): boolean {
	return line.startsWith("- ");
}

/**
 * Parse stored markup text into the AST. This is THE grammar boundary shared by
 * the public renderer and the editor's DOM hydration.
 */
export function parseMarkup(text: string): Doc {
	if (!text) {
		return [];
	}

	const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	const blocks = normalized.split(/\n{2,}/);
	const doc: Doc = [];

	for (const block of blocks) {
		if (block.trim().length === 0) {
			continue;
		}

		const lines = block.split("\n");
		const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
		const isList =
			nonEmptyLines.length > 0 && nonEmptyLines.every(isListLine);

		if (isList) {
			doc.push({
				type: "list",
				items: nonEmptyLines.map((line) => parseInline(line.slice(2))),
			});
			continue;
		}

		const children: Inline[] = [];
		lines.forEach((line, lineIndex) => {
			if (lineIndex > 0) {
				children.push({ type: "br" });
			}
			children.push(...parseInline(line));
		});
		doc.push({ type: "paragraph", children });
	}

	return doc;
}

// ---------------------------------------------------------------------------
// Serializer (Doc -> markdown) — inverse of parseMarkup
// ---------------------------------------------------------------------------

function emitInline(node: Inline): string {
	switch (node.type) {
		case "text":
			return escapeText(node.value);
		case "strong":
			return `**${escapeText(node.value)}**`;
		case "em":
			return `*${escapeText(node.value)}*`;
		case "br":
			return "\n";
	}
}

function serializeParagraph(children: Inline[]): string {
	const raw = children.map(emitInline).join("");
	// Escape any line that would otherwise be re-read as a bullet.
	return raw
		.split("\n")
		.map((line) => (isListLine(line) ? `\\${line}` : line))
		.join("\n");
}

function serializeListItem(item: Inline[]): string {
	// List items are single-line: a stray br collapses to a space.
	return item.map((node) => (node.type === "br" ? " " : emitInline(node))).join("");
}

/**
 * Serialize the AST back to stored markup text. The pair
 * parseMarkup(serializeMarkup(doc)) is the identity for any well-formed Doc, and
 * serializeMarkup(parseMarkup(text)) is stable (idempotent) for any text.
 */
export function serializeMarkup(doc: Doc): string {
	return doc
		.map((block) => {
			if (block.type === "list") {
				return block.items
					.map((item) => `- ${serializeListItem(item)}`)
					.join("\n");
			}
			return serializeParagraph(block.children);
		})
		.join("\n\n");
}

// ---------------------------------------------------------------------------
// React renderers (AST -> ReactNode) — React elements only, never raw HTML
// ---------------------------------------------------------------------------

function renderInlineNodes(nodes: Inline[], keyPrefix: string): ReactNode[] {
	return nodes.map((node, nodeIndex) => {
		const key = `${keyPrefix}-${nodeIndex}`;
		switch (node.type) {
			case "text":
				return node.value;
			case "strong":
				return (
					<strong key={key} className="font-semibold text-inherit">
						{node.value}
					</strong>
				);
			case "em":
				return (
					<em key={key} className="italic text-inherit">
						{node.value}
					</em>
				);
			case "br":
				return <br key={key} />;
		}
	});
}

/**
 * Render inline-only markup (bold / italic). Newlines are preserved as text so a
 * caller using `whitespace-pre-line` keeps its line breaks. Used for the activity
 * description (a thin wrapper lives in page.tsx).
 */
export function renderInline(text: string): ReactNode[] {
	return renderInlineNodes(parseInline(text), "inline");
}

export type RenderMarkupOptions = {
	paragraphClassName?: string;
	listClassName?: string;
};

const DEFAULT_LIST_CLASS = "list-disc pl-5 space-y-1";

/**
 * Render full block markup to React nodes: <p> paragraphs and <ul><li> lists.
 *
 * Tailwind's preflight resets <ul> markers and <p> margins, so explicit classes
 * are emitted here (bullets + inter-block spacing) and call sites can override
 * via options. Color / font-size / line-height inherit from the wrapping element.
 */
export function renderMarkupBlocks(
	text: string,
	options: RenderMarkupOptions = {},
): ReactNode {
	const doc = parseMarkup(text);

	return doc.map((block, blockIndex) => {
		const key = `block-${blockIndex}`;
		const isLast = blockIndex === doc.length - 1;
		const spacing = isLast ? undefined : "mb-4";

		if (block.type === "list") {
			return (
				<ul
					key={key}
					className={cn(DEFAULT_LIST_CLASS, options.listClassName, spacing)}
				>
					{block.items.map((item, itemIndex) => (
						<li key={`${key}-item-${itemIndex}`}>
							{renderInlineNodes(item, `${key}-item-${itemIndex}`)}
						</li>
					))}
				</ul>
			);
		}

		return (
			<p key={key} className={cn(options.paragraphClassName, spacing)}>
				{renderInlineNodes(block.children, key)}
			</p>
		);
	});
}
