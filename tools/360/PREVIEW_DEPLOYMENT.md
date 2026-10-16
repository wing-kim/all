# Isolated static preview package

Run from any directory with Python 3 (no third-party dependencies):

```sh
python3 tools/360/package-preview.py --out /tmp/capehorn-review-unique
```

The output must be a new directory outside this checkout. Existing directories,
repository directories and repository ancestors are refused. The source HTML
and renderer are copied without modification. Upload only the output directory
to the isolated preview deployment; keep the production Pages source unchanged.

The package includes `new/3d-model.html`, the explicit runtime JS/CSS allowlist,
and supported web assets under `new/360/assets` and `renderer-chunks` (including
license/attribution metadata). It excludes `new/index.html`, the standalone
`new/360/index.html`, docs, tools, bake input snapshots and node_modules.
Do not add source documents to the runtime asset subtree.

The generated landing page uses relative links and records the source commit,
UTC build time and dirty-worktree flag. `preview-audit.json` records the full
file list, payload size, local-reference findings and test entry links.
A missing literal local dependency causes a nonzero exit. Audit failures leave
the package available for inspection; do not publish a failed package.

The static audit follows `360/` document-relative paths, `./`/`../` module paths
and glTF resources. Computed URLs and original photo catalog fallback probes
require browser network testing. Photo catalogs may try absent sibling media
repositories and `render/manifest.js`; the existing remote catalog fallback is
preserved. Other CDN/model/texture requests require network access. A zero
missing-reference result does not demonstrate render success, input correctness,
feature parity, sunlight correctness or photoreal quality.

To check a GitHub Pages style base path locally, serve the output's parent and
open `http://127.0.0.1:PORT/OUTPUT-DIRECTORY/`. Test all three landing links and
inspect browser errors/network requests before publishing.
