# This is where I'm testing out the plugin locally.
local_dest_path = ~/tmp/ObsidianDev/.obsidian/plugins/obsidian-expand-region/

.PHONY: dev
dev:
	npm run dev

.PHONY: local_install
local_install:
	mkdir -p $(local_dest_path)
	cp main.js $(local_dest_path)
	cp manifest.json $(local_dest_path)

