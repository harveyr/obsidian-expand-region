import { Editor, EditorPosition, MarkdownView, Plugin } from "obsidian";

enum Direction {
	Left = -1,
	Right = 1,
}

interface Surround {
	start: string;
	end: string;
}

interface RankedSurround {
	surround: Surround;
	rank: number;
}

const SURROUNDS: Surround[] = [
	{ start: "[", end: "]" },
	{ start: "(", end: ")" },
	{ start: " ", end: " " },
	{ start: "-", end: "-" },
];

const DELIMITERS = [":", "/", "\\", "."];

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

		// TODO: tidy variables

		// Need to prioritize the right-hand expansion.
		const { start, end } = expand(line, currSel.anchor.ch, currSel.head.ch);

		const newAnchor: EditorPosition = {
			line: currSel.anchor.line,
			ch: start,
		};
		const newHead: EditorPosition = {
			line: currSel.anchor.line,
			// Move the cursor position to the end of the desired region (end + 1).
			// ch: Math.min(line.length, end - 1),
			ch: end,
		};

		editor.setSelection(newAnchor, newHead);
	}
}

function shiftHoriz(line: string, index: number, direction: Direction) {
	return Math.min(line.length - 1, Math.max(0, index + direction));
}

function expand(line: string, start: number, end: number): LineSelection {
	if (start === 0 && end === line.length - 1) {
		console.debug("Can't [yet] beyond the full line");
		return { start, end };
	}

	if (start === 0 && end !== 0) {
		// We're already have a selection beginning at the start and we've asked to expand.
		// TODO: Handle expanding to end of sentence.
		console.debug("Expanding to end of line");
		return { start: 0, end: line.length };
	}

	let newStart = start;
	let newEnd = end;

	// Look at the character to the left of the cursor.
	const leftSurround = findMatchingSurround(
		line[newStart - 1],
		Direction.Left
	);
	if (leftSurround) {
		console.debug("found left surround", leftSurround.surround);
	}
	const rightSurround = findMatchingSurround(line[newEnd], Direction.Right);
	if (rightSurround) {
		console.debug("found right surround", rightSurround.surround);
	}

	const noSelection = start === end;
	if (noSelection) {
		return expandToWord(line, newStart);
	}

	const sameRank = Boolean(
		leftSurround &&
			rightSurround &&
			leftSurround.rank === rightSurround.rank
	);
	const noRank = Boolean(!leftSurround && !rightSurround);

	if (noSelection || sameRank || noRank) {
		console.debug(
			"Surrounds have same rank or no rank. Expanding in both directions."
		);
		newStart = shiftHoriz(line, newStart, Direction.Left);
		newEnd = shiftHoriz(line, newEnd, Direction.Right);

		console.debug("Recursing with", newStart, newEnd);
		return expand(line, newStart, newEnd);
	}

	if (
		leftSurround &&
		(!rightSurround || leftSurround.rank < rightSurround.rank)
	) {
		// The left-hand surround has a higher priority than the right. Expand right.
		console.log("expanding right toward", leftSurround.surround);
		newEnd = expandTo(
			line,
			newEnd,
			leftSurround.surround.end,
			Direction.Right
		);
	} else if (
		rightSurround &&
		(!leftSurround || rightSurround.rank < leftSurround.rank)
	) {
		// The right-hand surround has a higher priority. Expand left.
		console.log("expanding left toward", rightSurround.surround);
		newStart = expandTo(
			line,
			newStart,
			rightSurround.surround.start,
			Direction.Left
		);
	} else {
		console.error("FIXME: How did I get here?");
	}

	return { start: newStart, end: newEnd };
}

interface LineSelection {
	start: number;
	end: number;
}

function expandToWord(line: string, index: number): LineSelection {
	console.debug("Expanding to word");

	const result: LineSelection = { start: 0, end: line.length };

	let start = index,
		end = index;

	while (start > 0) {
		start--;
		if (isDelimiter(line[start])) {
			result.start = start + 1;
			break;
		}
	}
	while (end < line.length - 1) {
		end++;
		if (isDelimiter(line[end])) {
			result.end = end;
			break;
		}
	}

	return result;
}

function expandTo(
	line: string,
	index: number,
	target: string,
	direction: Direction
): number {
	if (direction === Direction.Right) {
		const hit = line.indexOf(target, index);
		if (hit >= 0) {
			// We want the region to end just before the delimiter.
			index = hit - 1;
		}
	} else {
		while (index > 0) {
			index--;
			if (line[index] === target) {
				// We want the region to start just after the delimiter.
				index++;
				break;
			}
		}
	}

	return index;
}

function findMatchingSurround(
	char: string,
	direction: Direction
): RankedSurround | null {
	for (let i = 0; i < SURROUNDS.length; i++) {
		const s = SURROUNDS[i];

		// Don't find a match unless it's directionally aware. E.g., if we're
		// moving left, we want to find the opening character, not the
		// terminating one.
		if (
			(direction === Direction.Left && s.start === char) ||
			(direction === Direction.Right && s.end === char)
		) {
			return {
				surround: s,
				rank: i,
			};
		}
	}

	return null;
}

// Returns true if the character is any sort of delimiter.
function isDelimiter(char: string): boolean {
	return Boolean(
		DELIMITERS.indexOf(char) >= 0 ||
			SURROUNDS.find((s) => {
				return s.start === char || s.end === char;
			})
	);
}
