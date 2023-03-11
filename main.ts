import {
	Editor,
	EditorPosition,
	EditorSelection,
	MarkdownView,
	Plugin,
} from "obsidian";

interface Surround {
	start: string;
	end?: string;
}

const SURROUNDS: Surround[] = [
	{ start: " " },
	{ start: "-" },
	{ start: "(", end: ")" },
	{ start: "[", end: "]" },
];

export default class MyPlugin extends Plugin {
	async onload() {
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "expand-selection-region-command",
			name: "Expand Region",
			editorCallback: this.handleExpandCommand,
		});
	}

	handleExpandCommand(editor: Editor, view: MarkdownView) {
		const selections = editor.listSelections();

		if (selections.length > 1) {
			console.log("Not expanding multiple selections");
			return;
		}

		const currSel = selections[0];

		if (currSel.anchor.line != currSel.head.line) {
			console.log("I don't handle multiple lines yet");
			return;
		}

		const line = editor.getLine(currSel.anchor.line);
		let newStart: number = currSel.anchor.ch;
		let newEnd: number = currSel.head.ch;

		if (currSel.anchor.ch === currSel.head.ch) {
			console.log("TODO: using the old way");
			// TODO: Status: old way is not expanding left
			newStart = getExpandedBoundary(line, newStart, -1, 0);
			newEnd = getExpandedBoundary(line, newEnd, 1, line.length - 1);
		} else {
			const result = expand(line, currSel.anchor.ch, currSel.head.ch);
			newStart = result[0];
			newEnd = result[1];
		}

		// Move the cursor position to the end of the desired region (end + 1).
		newEnd = Math.min(line.length - 1, newEnd + 1);

		const newAnchor: EditorPosition = {
			line: currSel.anchor.line,
			ch: newStart,
		};
		const newHead: EditorPosition = {
			line: currSel.anchor.line,
			ch: newEnd,
		};

		editor.setSelection(newAnchor, newHead);
	}
}

interface MoveArg {
	index: number;
	direction: number;
	limit: number;
}

function move(arg: MoveArg) {
	const { index, direction, limit } = arg;
	if (index === limit) {
		return index;
	}
	return index + direction;
}

function expand(line: string, start: number, end: number): number[] {
	let newStart = start;
	let newEnd = end;

	const leftSurround = findMatchingSurround(line[newStart]);
	const rightSurround = findMatchingSurround(line[newEnd]);

	if (leftSurround && !rightSurround) {
		console.log("expand right with left's surround");
		newEnd = expandToSurround(line, newEnd, leftSurround, 1);
		// Move the cursor position to the end of the desired region (end + 1).
	} else if (rightSurround && !leftSurround) {
		console.log("expand left with right's surround");
		newStart = expandToSurround(line, newStart, rightSurround, -1);
	} else {
		newStart = move({ index: newStart, direction: -1, limit: 0 });
		newEnd = move({ index: newEnd, direction: 1, limit: line.length - 1 });

		// Recursion! 😬
		return expand(line, newStart, newEnd);
	}

	return [newStart, newEnd];
}

function expandToSurround(
	line: string,
	index: number,
	surround: Surround,
	direction: number
): number {
	while (index > 0 && index < line.length - 1) {
		index += direction;
		const char = line[index];
		if (direction === -1 && char === surround.start) {
			break;
		}
		if (direction === 1 && (char === surround.end || surround.start)) {
			break;
		}
	}

	return index;
}

function findMatchingSurround(char: string): Surround | null {
	// TODO: probably create and reuse a map for faster lookups
	for (const s of SURROUNDS) {
		if (s.start === char) {
			return s;
		}
		if (s.end && s.end === char) {
			return s;
		}
	}

	return null;
}

function getExpandedBoundary(
	line: string,
	currIdx: number,
	direction: number,
	limit: number
): number {
	let newIdx = currIdx;

	while (newIdx !== limit) {
		const next = line[newIdx + direction];
		if (isDelimiter(next)) {
			break;
		}
		newIdx += direction;
	}

	return newIdx;
}

function isDelimiter(char: string): boolean {
	const delims = ["[", "]", ")", ")", " ", "-"];

	return delims.indexOf(char) >= 0;
}
