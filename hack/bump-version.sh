#!/usr/bin/env bash
# Usage: hack/bump-version.sh <new-version> | --current
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="${ROOT_DIR}/manifest.json"

current_version() {
  python3 -c 'import json, sys; print(json.load(open(sys.argv[1]))["version"])' "${MANIFEST}"
}

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <new-version> | --current" >&2
  exit 1
fi

if [ "$1" = "--current" ]; then
  echo "Current version: $(current_version)"
  exit 0
fi

NEW_VERSION="${1#v}"
if ! printf '%s' "${NEW_VERSION}" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Version must look like 1.2.3, got: ${NEW_VERSION}" >&2
  exit 1
fi

echo "Bumping version: $(current_version) → ${NEW_VERSION}"
# package-lock.json carries the version twice; npm does not rewrite it on its own.
python3 - "${ROOT_DIR}" "${NEW_VERSION}" <<'PY'
import json, os, sys
root, version = sys.argv[1], sys.argv[2]
for name in ("manifest.json", "package.json", "package-lock.json"):
    path = os.path.join(root, name)
    with open(path) as handle:
        data = json.load(handle)
    data["version"] = version
    if name == "package-lock.json":
        data["packages"][""]["version"] = version
    with open(path, "w") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print(f"  ✓ {name}")
PY

echo ""
echo "Next steps:"
echo "  git add manifest.json package.json package-lock.json"
echo "  git commit -m \"chore: bump version to ${NEW_VERSION}\""
echo "  git tag -a v${NEW_VERSION} -m v${NEW_VERSION}"
echo "  git push origin main v${NEW_VERSION}"
