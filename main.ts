import { Editor, MarkdownView, Plugin } from "obsidian";

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
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				// const selections = editor.listSelections();
				// editor.replaceSelection("Sample Editor Command");
			},
		});
	}
}
