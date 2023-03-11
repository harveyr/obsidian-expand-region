#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

id=$(jq --raw-output '.id' manifest.json)
version=$(jq --raw-output '.version' manifest.json)

filepath="dist/${id}_${version}.zip"

zip "${filepath}" main.js manifest.json

echo "Created ${filepath}"
