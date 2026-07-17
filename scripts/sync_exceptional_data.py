#!/usr/bin/env python3
"""Copy the published Exceptional-series JSON into the static website."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path


WEBSITE_ROOT = Path(__file__).resolve().parents[1]
OWNER_HOME = WEBSITE_ROOT.parent
DEFAULT_ZENODO_ROOT = OWNER_HOME / "Research" / "Exceptional-Zenodo"
DEFAULT_RESEARCH_ROOT = OWNER_HOME / "Research" / "Exceptional"
OUTPUT_ROOT = WEBSITE_ROOT / "projects" / "exceptional" / "data"
PUBLIC_FILES = (
    "stored/labels.json",
    "stored/characters.json",
    "stored/quantum_dimensions.json",
    "stored/schur_functors.json",
    "stored/orthogonal_functors.json",
    "stored/bratteli_matrices.json",
    "stored/products.json",
    "derived/quantum_dimensions_rational_level5.json",
)


def load(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def digest(path: Path) -> str:
    result = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def write_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )


def validate_release(data_root: Path) -> tuple[list[str], set[str]]:
    labels = load(data_root / "stored" / "labels.json")["levels"]
    expected_counts = [1, 1, 3, 6, 15, 30]
    if [len(level["labels"]) for level in labels] != expected_counts:
        raise ValueError("unexpected level sizes in labels.json")
    ordered_labels = [
        record["label"] for level in labels for record in level["labels"]
    ]
    label_set = set(ordered_labels)
    if len(ordered_labels) != 56 or len(label_set) != 56:
        raise ValueError("labels.json must contain 56 distinct labels")

    characters = load(data_root / "stored" / "characters.json")["characters"]
    if {record["label"] for record in characters} != label_set:
        raise ValueError("character and label coverage disagree")

    compact = load(data_root / "stored" / "quantum_dimensions.json")[
        "quantum_dimensions"
    ]
    rational = load(
        data_root / "derived" / "quantum_dimensions_rational_level5.json"
    )["quantum_dimensions"]
    compact_labels = {record["label"] for record in compact}
    rational_labels = {record["label"] for record in rational}
    if compact_labels & rational_labels:
        raise ValueError("compact and rational qdim labels overlap")
    if compact_labels | rational_labels != label_set:
        raise ValueError("quantum dimensions do not cover every label")
    return ordered_labels, label_set


def paper_notation(research_root: Path, ordered_labels: list[str]) -> dict[str, str]:
    source = load(
        research_root / "data" / "characters" / "exceptional_characters.json"
    )
    values = {
        record["label"]: record["paper_notation"]
        for record in source["characters"]
        if int(record["level"]) <= 4
    }
    expected = {label for label in ordered_labels if label in values}
    lower_labels = set(ordered_labels[:26])
    if expected != lower_labels or len(values) != 26:
        raise ValueError("Cohen-de Man notation must cover exactly levels 0--4")
    return {label: values[label] for label in ordered_labels if label in values}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zenodo-root", type=Path, default=DEFAULT_ZENODO_ROOT)
    parser.add_argument("--research-root", type=Path, default=DEFAULT_RESEARCH_ROOT)
    return parser.parse_args()


def main() -> int:
    arguments = parse_args()
    source_data = arguments.zenodo_root.resolve() / "data"
    ordered_labels, _ = validate_release(source_data)

    hashes: dict[str, str] = {}
    for relative in PUBLIC_FILES:
        source = source_data / relative
        destination = OUTPUT_ROOT / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
        if source.read_bytes() != destination.read_bytes():
            raise RuntimeError(f"copy verification failed: {relative}")
        hashes[relative] = digest(destination)

    write_json(
        OUTPUT_ROOT / "reference" / "cohen_de_man.json",
        {
            "purpose": "Reference notation used through level four in the submitted paper.",
            "notations": paper_notation(arguments.research_root.resolve(), ordered_labels),
        },
    )
    write_json(
        OUTPUT_ROOT / "reference" / "snapshot.json",
        {
            "zenodo_record": "https://zenodo.org/records/21335054",
            "doi": "10.5281/zenodo.21335054",
            "files": hashes,
        },
    )
    validate_release(OUTPUT_ROOT)
    print(f"PASS copied {len(PUBLIC_FILES)} public JSON files")
    print("PASS Cohen-de Man notation covers levels 0--4")
    print(f"Output: {OUTPUT_ROOT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
