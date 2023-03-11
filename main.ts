import { Editor, EditorPosition, MarkdownView, Plugin } from "obsidian";

enum HorizontalDirection {
	Left = -1,
	Right = 1,
}

interface Surround {
	start: string;
	end: string;
}

const SURROUNDS: Surround[] = [
	{ start: "[", end: "]" },
	{ start: "(", end: ")" },
	{ start: " ", end: " " },
	{ start: "-", end: "-" },
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
			newStart = getExpandedBoundary(line, newStart, -1, 0);
			newEnd = getExpandedBoundary(line, newEnd, 1, line.length - 1);
		} else {
			// TODO: Status - handling `[kaldkf` — both sides have a surround.
			// Need to prioritize the right-hand expansion.
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

	// Look at the character to the left of the cursor.
	const leftSurround = findMatchingSurround(line[newStart - 1]);
	if (leftSurround) {
		console.log("found left surround with '%s'", line[newStart]);
	}
	const rightSurround = findMatchingSurround(line[newEnd]);
	if (rightSurround) {
		console.log("found right surround with '%s'", line[newEnd]);
	}

	if (
		leftSurround &&
		rightSurround &&
		leftSurround.rank === rightSurround.rank
	) {
		console.log("TODO: Same surround found on both ends");
		return [newStart, newEnd];
	}

	if (
		leftSurround &&
		(!rightSurround || leftSurround.rank < rightSurround.rank)
	) {
		// The left-hand surround has a higher priority than the right. Expand right.
		console.log("expanding right toward", leftSurround.surround);
		newEnd = expandToSurround(
			line,
			newEnd,
			leftSurround.surround,
			HorizontalDirection.Right
		);
	} else if (
		rightSurround &&
		(!leftSurround || rightSurround.rank < leftSurround.rank)
	) {
		// The right-hand surround has a higher priority. Expand left.
		console.log("expanding left toward", rightSurround.surround);
		newStart = expandToSurround(
			line,
			newStart,
			rightSurround.surround,
			HorizontalDirection.Left
		);
	} else {
		console.log("TODO: No priority surround found");
		newStart = move({ index: newStart, direction: -1, limit: 0 });
		newEnd = move({
			index: newEnd,
			direction: 1,
			limit: line.length - 1,
		});

		// Recursion! 😬
		return expand(line, newStart, newEnd);
	}

	return [newStart, newEnd];
}

function expandToSurround(
	line: string,
	index: number,
	surround: Surround,
	direction: HorizontalDirection
): number {
	if (direction === HorizontalDirection.Right) {
		const hit = line.indexOf(surround.end, index);
		if (hit >= 0) {
			// We want the cursor to be just before the delimeter.
			index = hit - 1;
		}
	} else {
		const char = surround.start;
		while (index > 0) {
			index--;
			if (line[index] === char) {
				break;
			}
		}
	}

	return index;
}

interface RankedSurround {
	surround: Surround;
	rank: number;
}

function findMatchingSurround(char: string): RankedSurround | null {
	for (let i = 0; i < SURROUNDS.length; i++) {
		const s = SURROUNDS[i];
		if (s.start === char || (s.end && s.end === char)) {
			return {
				surround: s,
				rank: i,
			};
		}
	}

	console.debug("No surround found for '%s'", char);
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
