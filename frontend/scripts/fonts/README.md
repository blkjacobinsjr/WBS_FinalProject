# Local Poppins subsets

The generator uses the checked-in Google Fonts CSS and WOFF2 files in `source/`.
It does not download files and does not run as part of the frontend build.

From the repository root, install the pinned Python dependency and generate the
selected ASCII/common-punctuation profile:

```sh
cd frontend
python3 -m venv .venv-fonts
. .venv-fonts/bin/activate
python -m pip install -r scripts/fonts/requirements.txt
python scripts/fonts/subset_poppins.py --core-profile ascii-punctuation
```

Use `--core-profile google-latin` to generate the full Google Latin subset as a
diagnostic alternative. The selected ASCII profile merges the original Latin
and Latin-ext sources into one extended subset.

The generator rewrites `public/fonts/poppins/`, `src/fonts/poppins.generated.css`,
and `scripts/fonts/poppins-report.json`. The captured Google CSS was requested
with Chrome 156's user agent on 2026-11-08. Source face URLs are retained in
`source/google-css/global.css`; the original source binaries and OFL license are
checked in beside it. Regenerate after changing source fonts/CSS, Poppins usage,
text coverage, weights, styles, or shaping features. Run `npm run build` from
`frontend`, then repeat the homepage and mixed-script pixel comparisons after
every regeneration. The script does not prove visual equivalence.

The HTML preloads the four normal core files only for a direct load of `/`.
Client-side navigation to `/` still loads the needed font through CSS. A signed-in
redirect from `/` may make those preloads unnecessary; verify that route when
integrating the change.
