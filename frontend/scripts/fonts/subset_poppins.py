#!/usr/bin/env python3
"""Create local Poppins subsets from the checked-in Google Fonts sources.

Run from the repository root with the dependencies in requirements.txt.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
SOURCE_CSS = ROOT / "scripts/fonts/source/google-css/global.css"
SOURCE_DIR = ROOT / "scripts/fonts/source/google-woff2"
OUTPUT_DIR = ROOT / "public/fonts/poppins"
CSS_OUT = ROOT / "src/fonts/poppins.generated.css"
REPORT_OUT = ROOT / "scripts/fonts/poppins-report.json"
OFL_PATH = ROOT / "scripts/fonts/source/licenses/Poppins-OFL.txt"
FACE_SPECS = [("normal", w) for w in (400, 500, 600, 700)] + [("italic", 600)]
SUBSETS = {"latin": "latin", "latin-ext": "latin-ext", "devanagari": "devanagari"}
PRESERVED_HEAD_FIELDS = ("xMin", "yMin", "xMax", "yMax", "created", "modified")

# The alternate core is ASCII plus punctuation commonly present in UI copy.
COMMON_CORE = set(range(0x20, 0x7F)) | {0x00A9, 0x20AC, 0x2122}
COMMON_CORE |= set(range(0x2000, 0x2070))


def parse_faces() -> tuple[dict[tuple[str, int, str], Path], dict[tuple[str, int, str], set[int]]]:
    css = SOURCE_CSS.read_text()
    found: dict[tuple[str, int, str], Path] = {}
    face_ranges: dict[tuple[str, int, str], set[int]] = {}
    pattern = re.compile(r"/\*\s*([^*]+?)\s*\*/\s*@font-face\s*\{([^}]+)\}", re.S)
    for match in pattern.finditer(css):
        subset_name, body = match.groups()
        family = re.search(r"font-family:\s*['\"]?([^;'\"]+)", body)
        if not family or family.group(1).strip() != "Poppins":
            continue
        style = re.search(r"font-style:\s*(normal|italic)", body).group(1)
        weight = int(re.search(r"font-weight:\s*(\d+)", body).group(1))
        url = re.search(r"url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)", body).group(1)
        subset_name = subset_name.strip().lower()
        if subset_name not in SUBSETS:
            continue
        filename = url.rsplit("/", 1)[1]
        key = (style, weight, SUBSETS[subset_name])
        found[key] = SOURCE_DIR / filename
        range_text = re.search(r"unicode-range:\s*([^;]+);", body).group(1)
        face_ranges[key] = parse_unicode_range(range_text)
    for style, weight in FACE_SPECS:
        for subset_name in SUBSETS.values():
            path = found.get((style, weight, subset_name))
            if path is None or not path.is_file():
                raise RuntimeError(f"Missing source face: {style} {weight} {subset_name}: {path}")
    return found, face_ranges


def parse_unicode_range(value: str) -> set[int]:
    result: set[int] = set()
    for token in value.split(","):
        match = re.fullmatch(r"\s*U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?\s*", token)
        if not match:
            raise RuntimeError(f"Unsupported unicode-range token: {token!r}")
        start = int(match.group(1), 16)
        end = int(match.group(2), 16) if match.group(2) else start
        result.update(range(start, end + 1))
    return result


def cmap(font: TTFont) -> set[int]:
    return set().union(*(set(table.cmap) for table in font["cmap"].tables if table.isUnicode()))


def ranges(codepoints: set[int]) -> str:
    if not codepoints:
        return ""
    ordered = sorted(codepoints)
    spans = []
    start = previous = ordered[0]
    for cp in ordered[1:]:
        if cp == previous + 1:
            previous = cp
            continue
        spans.append((start, previous))
        start = previous = cp
    spans.append((start, previous))
    return ", ".join(f"U+{a:04X}" if a == b else f"U+{a:04X}-{b:04X}" for a, b in spans)


def font_info(path: Path) -> dict:
    font = TTFont(path)
    cp = cmap(font)
    features: dict[str, list[str]] = {}
    for tag in ("GSUB", "GPOS"):
        if tag in font:
            features[tag] = sorted({rec.FeatureTag for rec in font[tag].table.FeatureList.FeatureRecord})
    axes = []
    if "fvar" in font:
        axes = [{"tag": a.axisTag, "min": a.minValue, "default": a.defaultValue, "max": a.maxValue} for a in font["fvar"].axes]
    glyph_instruction_bytes = 0
    if "glyf" in font:
        for glyph in font["glyf"].glyphs.values():
            program = getattr(glyph, "program", None)
            if program:
                glyph_instruction_bytes += len(program.getBytecode())
    return {
        "bytes": path.stat().st_size,
        "glyphs": len(font.getGlyphOrder()),
        "unicode_codepoints": len(cp),
        "axes": axes,
        "features": features,
        "hint_tables": [tag for tag in ("fpgm", "prep", "cvt ", "gasp", "hdmx", "LTSH", "VDMX") if tag in font],
        "glyph_instruction_bytes": glyph_instruction_bytes,
        "head": {key: getattr(font["head"], key) for key in PRESERVED_HEAD_FIELDS},
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "axes": axes,
        "codepoints": cp,
    }


def subset_font(font: TTFont, codepoints: set[int], output: Path) -> None:
    source_head = {key: getattr(font["head"], key) for key in PRESERVED_HEAD_FIELDS}
    font.recalcBBoxes = False
    font.recalcTimestamp = False
    options = subset.Options()
    options.flavor = "woff2"
    options.hinting = False
    options.recalc_bounds = False
    options.recalc_timestamp = False
    options.layout_features = ["*"]
    options.layout_scripts = ["*"]
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.name_legacy = True
    options.name_languages = [0x409]
    options.glyph_names = True
    options.notdef_glyph = True
    options.notdef_outline = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    for key, value in source_head.items():
        setattr(font["head"], key, value)
    output.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff2"
    font.save(output)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--core-profile", choices=("google-latin", "ascii-punctuation"), default="ascii-punctuation")
    args = parser.parse_args()
    sources, source_ranges = parse_faces()
    shutil.rmtree(OUTPUT_DIR, ignore_errors=True)
    OUTPUT_DIR.mkdir(parents=True)
    css_faces = []
    ofl_text = OFL_PATH.read_text()
    reserved_names = re.findall(r"with Reserved Font Name\s+([^.;]+)", ofl_text, flags=re.I)
    report = {"profile": args.core_profile, "source_css_sha256": hashlib.sha256(SOURCE_CSS.read_bytes()).hexdigest(),
              "ofl_sha256": hashlib.sha256(OFL_PATH.read_bytes()).hexdigest(), "reserved_font_names": reserved_names,
              "source_faces": {}, "outputs": []}
    for style, weight in FACE_SPECS:
        source_records = {name: font_info(sources[(style, weight, name)]) for name in SUBSETS.values()}
        report["source_faces"][f"{style}-{weight}"] = {
            name: {k: v for k, v in info.items() if k != "codepoints"} | {"file": sources[(style, weight, name)].name}
            for name, info in source_records.items()
        }
        latin_cp = source_records["latin"]["codepoints"]
        ext_cp = source_records["latin-ext"]["codepoints"] - latin_cp
        dev_cp = source_records["devanagari"]["codepoints"]
        if args.core_profile == "google-latin":
            pieces = [("devanagari", sources[(style, weight, "devanagari")], dev_cp, source_ranges[(style, weight, "devanagari")]),
                      ("latin-ext", sources[(style, weight, "latin-ext")], ext_cp, source_ranges[(style, weight, "latin-ext")]),
                      ("core", sources[(style, weight, "latin")], latin_cp, source_ranges[(style, weight, "latin")])]
        else:
            core_cp = latin_cp & COMMON_CORE
            merged = Merger().merge([str(sources[(style, weight, "latin")]), str(sources[(style, weight, "latin-ext")])])
            merged["head"].created = min(source_records[name]["head"]["created"] for name in ("latin", "latin-ext"))
            merged["head"].modified = max(source_records[name]["head"]["modified"] for name in ("latin", "latin-ext"))
            latin_all = latin_cp | source_records["latin-ext"]["codepoints"]
            extended_range = (source_ranges[(style, weight, "latin")] | source_ranges[(style, weight, "latin-ext")]) - core_cp
            pieces = [("devanagari", sources[(style, weight, "devanagari")], dev_cp, source_ranges[(style, weight, "devanagari")]),
                      ("extended", merged, latin_all - core_cp, extended_range),
                      ("core", sources[(style, weight, "latin")], core_cp, core_cp)]
        for piece_index, (subset_name, source, target_cp, css_range) in enumerate(pieces):
            filename = f"poppins-{style}-{weight}-{subset_name}.woff2"
            output = OUTPUT_DIR / filename
            if isinstance(source, TTFont):
                font = source
                source_head = {key: getattr(font["head"], key) for key in PRESERVED_HEAD_FIELDS}
                font.recalcBBoxes = False
                font.recalcTimestamp = False
                options = subset.Options()
                options.flavor, options.hinting = "woff2", False
                options.recalc_bounds = False
                options.recalc_timestamp = False
                options.layout_features, options.layout_scripts = ["*"], ["*"]
                options.name_IDs, options.name_languages, options.name_legacy = [0,1,2,3,4,5,6,13,14], [0x409], True
                options.glyph_names = options.notdef_glyph = options.notdef_outline = True
                subsetter = subset.Subsetter(options=options)
                subsetter.populate(unicodes=target_cp)
                subsetter.subset(font)
                for key, value in source_head.items():
                    setattr(font["head"], key, value)
                font.flavor = "woff2"
                font.save(output)
            else:
                subset_font(TTFont(source), target_cp, output)
            info = font_info(output)
            later_coverage = set()
            for _, _, later_cp, later_range in pieces[piece_index + 1:]:
                later_coverage |= later_cp & later_range
            effective_range = (css_range & info["codepoints"]) - later_coverage
            record = {"file": str(output.relative_to(ROOT)), "style": style, "weight": weight, "subset": subset_name,
                      "bytes": info["bytes"], "glyphs": info["glyphs"], "unicode_codepoints": info["unicode_codepoints"],
                      "unicode_range": ranges(effective_range), "features": info["features"], "hint_tables": info["hint_tables"],
                      "glyph_instruction_bytes": info["glyph_instruction_bytes"], "head": info["head"], "sha256": info["sha256"],
                      "axes": info["axes"]}
            report["outputs"].append(record)
            css_faces.append("\n".join([
                "@font-face {", "  font-family: 'Poppins';", f"  font-style: {style};", f"  font-weight: {weight};",
                "  font-display: swap;", f"  src: url('/fonts/poppins/{filename}') format('woff2');",
                f"  unicode-range: {record['unicode_range']};", "}",
            ]))
    CSS_OUT.parent.mkdir(parents=True, exist_ok=True)
    CSS_OUT.write_text("\n\n".join(css_faces) + "\n")
    REPORT_OUT.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(f"Generated profile={args.core_profile} bytes={sum(r['bytes'] for r in report['outputs'])}")
    for row in report["outputs"]:
        print(f"{row['style']:6} {row['weight']} {row['subset']:12} {row['bytes']:6} B {row['unicode_codepoints']:3} codepoints")


if __name__ == "__main__":
    main()
