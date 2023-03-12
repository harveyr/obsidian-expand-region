#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

npm version patch

semver=$(jq --raw-output '.version' manifest.json)

echo "Creating release ${semver}"

gh release create --prerelease "v${semver}" main.js manifest.json