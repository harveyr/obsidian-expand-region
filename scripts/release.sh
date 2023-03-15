#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

npm version patch

semver=$(jq --raw-output '.version' manifest.json)

read -p "Bumped version to ${semver}. Create release? [y/N]" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

echo "Creating release ${semver}"

gh release create --prerelease "v${semver}" main.js manifest.json

git push