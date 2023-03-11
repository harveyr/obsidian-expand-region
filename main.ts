import {
	Editor,
	EditorSelection,
	EditorPosition,
	MarkdownView,
	Plugin,
} from "obsidian";
import { cursorTo } from "readline";

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
		console.log("current selection", currSel);

		if (currSel.anchor.line != currSel.head.line) {
			console.log("I don't handle multiple lines yet");
			return;
		}

		const line = editor.getLine(currSel.anchor.line);

		let newStart = currSel.anchor.ch;
		let newEnd = currSel.head.ch;

		// Prepping to get DRY
		let direction = -1;

		while (newStart > 0) {
			const next = line[newStart + direction];
			if (isDelimiter(next)) {
				break;
			}
			newStart += direction;
		}

		direction = 1;
		while (newEnd < line.length - 1) {
			const next = line[newEnd + direction];
			if (isDelimiter(next)) {
				break;
			}
			newEnd += direction;
		}

		// Move the cursor position to the end of the desired region (end + 1)
		newEnd = Math.min(line.length - 1, newEnd + 1);

		// const line = editor.getCursor
		// editor.replaceSelection("Sample Editor Command");

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

function isDelimiter(char: string): boolean {
	const delims = ["[", "]", ")", ")", " ", "-"];

	return delims.indexOf(char) >= 0;
}
