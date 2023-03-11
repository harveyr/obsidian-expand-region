#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

id=$(jq --raw-output '.id' manifest.json)
version=$(jq --raw-output '.version' manifest.json)

tarball="${id}_${version}.tar.gz"

tmpdir="dist-tmp"
mkdir "${tmpdir}"
cd "${tmpdir}"

mkdir "${id}"
cp ../main.js "${id}"
cp ../manifest.json "${id}"

tar -czvf "${tarball}" "${id}"

mkdir -p ../dist
mv "${tarball}" ../dist

cd ..

rm -rf "${tmpdir}"

echo "Created dist/${tarball}"
