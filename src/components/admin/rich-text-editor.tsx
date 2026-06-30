"use client";

import {
	useEffect,
	useId,
	useRef,
	useState,
	type ClipboardEvent,
	type DragEvent,
	type KeyboardEvent,
	type ReactNode,
} from "react";
import { Bold, Italic, List } from "lucide-react";

import {
	parseMarkup,
	serializeMarkup,
	type Block,
	type Doc,
	type Inline,
} from "@/lib/markup";
import { cn } from "@/lib/utils";

/**
 * Vanilla `contenteditable` WYSIWYG editor for the 6 markup fields. No external
 * editor library. The admin always sees rendered marks (bold / italic / bullets)
 * in place — never the literal `**` / `- ` storage markers.
 *
 * Data flow (one grammar source = src/lib/markup.tsx):
 *   HYDRATE  markdown -> parseMarkup -> Doc -> docToDom -> editor DOM (mount only)
 *   SERIALIZE editor DOM -> domToDoc -> Doc -> serializeMarkup -> hidden <input>
 *
 * The contenteditable is UNCONTROLLED after mount (React never rewrites its
 * children), so the caret never jumps. Only the hidden input re-renders.
 *
 * Security: the DOM is built exclusively via document.createElement +
 * textContent and read back via a strict whitelist. No raw-HTML injection of
 * any kind is used here — a source guard in rich-text-editor.test.ts enforces
 * the absence of both raw-HTML escape hatches.
 *
 * docToDom invariant: an EMPTY Doc always produces exactly one `<p><br></p>`
 * (the canonical "initialized empty editor" DOM). This makes Enter create a
 * sibling `<p>` consistently across evergreen browsers instead of bare `<div>`
 * (Chrome) vs `<br>` (older Firefox), keeping the paragraph/linebreak
 * distinction deterministic.
 */

// ===========================================================================
// Pure DOM <-> AST functions (extracted for jsdom unit testing — see #9/#11).
// They take/return a root Element + Doc and never touch React or globals
// beyond the ownerDocument passed in.
// ===========================================================================

type Mark = null | "strong" | "em";

const FONT_WEIGHT_BOLD_RE = /^(bold(er)?|[6-9]\d\d)$/;
const FONT_STYLE_ITALIC_RE = /^(italic|oblique)/;

function elementTag(node: Node): string {
	return node.nodeType === 1 ? (node as Element).tagName.toUpperCase() : "";
}

// Resolve the effective inline mark contributed by an element, given the mark
// inherited from its ancestors. Innermost wins: a child mark overrides the
// parent (e.g. <em><strong>x</strong></em> -> strong). Bold takes priority over
// italic when an element declares both (consistent with ** matching before *).
function markForElement(el: Element, inherited: Mark): Mark {
	const tag = el.tagName.toUpperCase();
	if (tag === "B" || tag === "STRONG") return "strong";
	if (tag === "I" || tag === "EM") return "em";

	const style = (el as HTMLElement).style;
	if (style) {
		if (FONT_WEIGHT_BOLD_RE.test(style.fontWeight)) return "strong";
		if (FONT_STYLE_ITALIC_RE.test(style.fontStyle)) return "em";
	}
	return inherited;
}

function markedText(mark: Mark, value: string): Inline {
	if (mark === "strong") return { type: "strong", value };
	if (mark === "em") return { type: "em", value };
	return { type: "text", value };
}

// Walk a node's inline content, appending Inline nodes. Text newlines become
// <br> (deterministic normalization). Unknown elements (span/font/a/...) flatten
// to their children carrying the inherited mark.
function walkInline(node: Node, mark: Mark, out: Inline[]): void {
	if (node.nodeType === 3) {
		const segments = (node.nodeValue ?? "").split("\n");
		segments.forEach((segment, index) => {
			if (index > 0) out.push({ type: "br" });
			if (segment.length > 0) out.push(markedText(mark, segment));
		});
		return;
	}

	if (node.nodeType !== 1) return;

	const el = node as Element;
	if (el.tagName.toUpperCase() === "BR") {
		out.push({ type: "br" });
		return;
	}

	const nextMark = markForElement(el, mark);
	for (const child of Array.from(el.childNodes)) {
		walkInline(child, nextMark, out);
	}
}

function trimTrailingBr(nodes: Inline[]): Inline[] {
	let end = nodes.length;
	while (end > 0 && nodes[end - 1].type === "br") {
		end -= 1;
	}
	return nodes.slice(0, end);
}

function hasInlineContent(nodes: Inline[]): boolean {
	return nodes.some(
		(node) =>
			(node.type === "text" && node.value.length > 0) ||
			node.type === "strong" ||
			node.type === "em" ||
			node.type === "br",
	);
}

function appendListItems(listEl: Element, items: Inline[][]): void {
	for (const li of Array.from(listEl.children)) {
		if (li.tagName.toUpperCase() !== "LI") continue;

		let inline: Inline[] = [];
		const pushItem = () => {
			const trimmed = trimTrailingBr(inline);
			if (hasInlineContent(trimmed)) items.push(trimmed);
			inline = [];
		};

		for (const child of Array.from(li.childNodes)) {
			const tag = elementTag(child);
			if (tag === "UL" || tag === "OL") {
				// Nested list flattened into the parent list's items.
				pushItem();
				appendListItems(child as Element, items);
			} else {
				walkInline(child, null, inline);
			}
		}
		pushItem();
	}
}

// Block segmentation: top-level text/inline runs and <div>/<p> become paragraph
// blocks; each <ul>/<ol> becomes its own list block. <div>/<p> recurse so a
// nested block produces its own paragraph deterministically.
function collectBlocks(container: Node, blocks: Block[]): void {
	let pending: Inline[] = [];

	const flush = () => {
		const trimmed = trimTrailingBr(pending);
		if (hasInlineContent(trimmed)) {
			blocks.push({ type: "paragraph", children: trimmed });
		}
		pending = [];
	};

	for (const child of Array.from(container.childNodes)) {
		const tag = elementTag(child);
		if (tag === "UL" || tag === "OL") {
			flush();
			const items: Inline[][] = [];
			appendListItems(child as Element, items);
			if (items.length > 0) blocks.push({ type: "list", items });
		} else if (tag === "DIV" || tag === "P") {
			flush();
			collectBlocks(child, blocks);
		} else {
			walkInline(child, null, pending);
		}
	}

	flush();
}

/**
 * Read the editor DOM back into the AST through a strict whitelist:
 *   b|strong|font-weight>=600 -> strong; i|em|font-style:italic -> em;
 *   ul/li -> list (nested ul flattened into parent items); div/p -> paragraph;
 *   br -> line break; everything else flattened to text. Deterministic:
 *   same DOM -> same Doc regardless of browser.
 */
export function domToDoc(root: Element): Doc {
	const blocks: Block[] = [];
	collectBlocks(root, blocks);
	return blocks;
}

function appendInlineToDom(
	nodes: Inline[],
	parent: Element,
	ownerDocument: Document,
): void {
	for (const node of nodes) {
		switch (node.type) {
			case "text": {
				parent.appendChild(ownerDocument.createTextNode(node.value));
				break;
			}
			case "strong": {
				const strong = ownerDocument.createElement("strong");
				strong.textContent = node.value;
				parent.appendChild(strong);
				break;
			}
			case "em": {
				const em = ownerDocument.createElement("em");
				em.textContent = node.value;
				parent.appendChild(em);
				break;
			}
			case "br": {
				parent.appendChild(ownerDocument.createElement("br"));
				break;
			}
		}
	}
}

function emptyParagraph(ownerDocument: Document): HTMLElement {
	const p = ownerDocument.createElement("p");
	p.appendChild(ownerDocument.createElement("br"));
	return p;
}

/**
 * Build editor DOM from the AST. An empty Doc yields exactly one `<p><br></p>`
 * (see the docToDom invariant note above). Built with createElement +
 * textContent only — never via raw HTML.
 */
export function docToDom(doc: Doc, ownerDocument: Document): DocumentFragment {
	const fragment = ownerDocument.createDocumentFragment();

	if (doc.length === 0) {
		fragment.appendChild(emptyParagraph(ownerDocument));
		return fragment;
	}

	for (const block of doc) {
		if (block.type === "list") {
			const ul = ownerDocument.createElement("ul");
			for (const item of block.items) {
				const li = ownerDocument.createElement("li");
				appendInlineToDom(item, li, ownerDocument);
				if (!li.hasChildNodes()) {
					li.appendChild(ownerDocument.createElement("br"));
				}
				ul.appendChild(li);
			}
			fragment.appendChild(ul);
		} else {
			const p = ownerDocument.createElement("p");
			appendInlineToDom(block.children, p, ownerDocument);
			if (!p.hasChildNodes()) {
				p.appendChild(ownerDocument.createElement("br"));
			}
			fragment.appendChild(p);
		}
	}

	return fragment;
}

// ===========================================================================
// Selection / formatting helpers (browser-only; run inside event handlers)
// ===========================================================================

function tryExecCommand(command: string, value?: string): boolean {
	if (typeof document === "undefined" || !document.execCommand) return false;
	try {
		return document.execCommand(command, false, value);
	} catch {
		return false;
	}
}

function queryState(command: string): boolean {
	if (typeof document === "undefined" || !document.queryCommandState) {
		return false;
	}
	try {
		return document.queryCommandState(command);
	} catch {
		return false;
	}
}

// Manual fallback for bold/italic when execCommand is missing or returns false.
function manualWrap(tag: "strong" | "em"): void {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return;

	const range = selection.getRangeAt(0);
	if (range.collapsed) return;

	const wrapper = document.createElement(tag);
	try {
		range.surroundContents(wrapper);
	} catch {
		wrapper.appendChild(range.extractContents());
		range.insertNode(wrapper);
	}
	selection.removeAllRanges();
	selection.selectAllChildren(wrapper);
}

function insertPlainText(text: string): void {
	if (tryExecCommand("insertText", text)) return;

	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return;

	const range = selection.getRangeAt(0);
	range.deleteContents();
	const node = document.createTextNode(text);
	range.insertNode(node);
	range.setStartAfter(node);
	range.collapse(true);
	selection.removeAllRanges();
	selection.addRange(range);
}

// ===========================================================================
// Component
// ===========================================================================

type RichTextEditorProps = {
	/** Form field name for the hidden input that carries the serialized markup. */
	name: string;
	/** Stored markup to hydrate on mount. */
	defaultValue?: string;
	required?: boolean;
	ariaLabel: string;
	id?: string;
};

const EDITOR_CLASS = cn(
	"min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none",
	"whitespace-pre-wrap break-words",
	"focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
	"aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
	// True WYSIWYG: render the marks in place, never the literal markers.
	"[&_strong]:font-semibold [&_em]:italic [&_ul]:my-0 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:my-0",
);

export function RichTextEditor({
	name,
	defaultValue = "",
	required = false,
	ariaLabel,
	id,
}: RichTextEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	// Initialize from the NORMALIZED markup BEFORE any input event so saving a
	// field that was opened but never edited submits the unchanged value rather
	// than "" (which would wipe the stored rich text — see correction #3).
	const [value, setValue] = useState(() =>
		serializeMarkup(parseMarkup(defaultValue)),
	);
	const [blurred, setBlurred] = useState(false);
	const [active, setActive] = useState({
		bold: false,
		italic: false,
		list: false,
	});

	const generatedId = useId();
	const editorId = id ?? generatedId;
	const errorId = `${editorId}-error`;

	const isEmpty = value.trim() === "";
	const showError = required && blurred && isEmpty;

	// HYDRATE once: build the editor DOM from the stored markup and capture the
	// canonical serialized form. Uncontrolled afterwards (no re-render of the
	// editable subtree => no caret jumps).
	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) return;

		const fragment = docToDom(parseMarkup(defaultValue), document);
		editor.replaceChildren(fragment);
		setValue(serializeMarkup(domToDoc(editor)));
		// Mount-only: defaultValue is the initial-value contract.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function syncValue(): void {
		const editor = editorRef.current;
		if (!editor) return;
		setValue(serializeMarkup(domToDoc(editor)));
	}

	function refreshActive(): void {
		setActive({
			bold: queryState("bold"),
			italic: queryState("italic"),
			list: queryState("insertUnorderedList"),
		});
	}

	function applyInline(command: "bold" | "italic", tag: "strong" | "em"): void {
		const editor = editorRef.current;
		if (!editor) return;
		editor.focus();
		tryExecCommand("styleWithCSS", "false");
		if (!tryExecCommand(command)) {
			manualWrap(tag);
		}
		syncValue();
		refreshActive();
	}

	function applyList(): void {
		const editor = editorRef.current;
		if (!editor) return;
		editor.focus();
		tryExecCommand("insertUnorderedList");
		syncValue();
		refreshActive();
	}

	function handlePaste(event: ClipboardEvent<HTMLDivElement>): void {
		event.preventDefault();
		const text = event.clipboardData.getData("text/plain");
		insertPlainText(text);
		syncValue();
	}

	function handleDrop(event: DragEvent<HTMLDivElement>): void {
		// Mirror the paste sanitizer for drag-and-drop: without this, dragging
		// formatted/raw HTML (e.g. <script>) from another tab would have its
		// textContent extracted into the stored markup (content corruption, not
		// XSS — the renderer is React-elements-only). See correction #6.
		event.preventDefault();
		const text = event.dataTransfer.getData("text/plain");
		if (text) {
			editorRef.current?.focus();
			insertPlainText(text);
			syncValue();
		}
	}

	function handleKeyUp(event: KeyboardEvent<HTMLDivElement>): void {
		// Keep toolbar pressed-state in sync as the caret moves.
		void event;
		refreshActive();
	}

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center gap-1" role="toolbar" aria-label="Formato">
				<ToolbarButton
					label="Negrita"
					pressed={active.bold}
					onActivate={() => applyInline("bold", "strong")}
				>
					<Bold className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="Cursiva"
					pressed={active.italic}
					onActivate={() => applyInline("italic", "em")}
				>
					<Italic className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="Lista"
					pressed={active.list}
					onActivate={applyList}
				>
					<List className="h-4 w-4" />
				</ToolbarButton>
			</div>

			<div
				ref={editorRef}
				id={editorId}
				role="textbox"
				aria-multiline="true"
				aria-label={ariaLabel}
				aria-invalid={showError || undefined}
				aria-describedby={showError ? errorId : undefined}
				tabIndex={0}
				contentEditable
				suppressContentEditableWarning
				className={EDITOR_CLASS}
				onInput={syncValue}
				onBlur={() => {
					setBlurred(true);
					syncValue();
				}}
				onFocus={refreshActive}
				onKeyUp={handleKeyUp}
				onMouseUp={refreshActive}
				onPaste={handlePaste}
				onDrop={handleDrop}
			/>

			<input type="hidden" name={name} value={value} readOnly />

			{showError ? (
				<p id={errorId} className="text-sm text-destructive">
					Este campo es obligatorio.
				</p>
			) : null}
		</div>
	);
}

type ToolbarButtonProps = {
	label: string;
	pressed: boolean;
	onActivate: () => void;
	children: ReactNode;
};

function ToolbarButton({
	label,
	pressed,
	onActivate,
	children,
}: ToolbarButtonProps) {
	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={pressed}
			// preventDefault on mousedown so the editor selection is not lost when
			// the toolbar button takes focus.
			onMouseDown={(event) => event.preventDefault()}
			onClick={onActivate}
			className={cn(
				"inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
				pressed && "bg-muted text-foreground",
			)}
		>
			{children}
		</button>
	);
}
