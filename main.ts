import {
	Editor,
	EditorSelection,
	EditorPosition,
	MarkdownView,
	Plugin,
} from "obsidian";
import { cursorTo } from "readline";
import * as internal from "stream";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

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

		const currSel: EditorSelection = selections[0];

		if (currSel.anchor.line != currSel.head.line) {
			console.log("I don't handle multiple lines yet");
			return;
		}

		const line = editor.getLine(currSel.anchor.line);

		const newStart = getExpandedBoundary(line, currSel.anchor.ch, -1, 0);

		let newEnd = getExpandedBoundary(
			line,
			currSel.head.ch,
			1,
			line.length - 1
		);
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

function getExpandedBoundary(
	line: string,
	currIdx: number,
	direction: number,
	limit: number
): number {
	let newIdx = currIdx;

	while (newIdx < limit) {
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
