#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

npm version patch

id=$(jq --raw-output '.id' manifest.json)

echo "Creating release ${id}"

gh release create "v${id} main.ts manifest.json"