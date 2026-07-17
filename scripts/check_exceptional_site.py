#!/usr/bin/env python3
"""Check the Exceptional-series website snapshot and page contracts."""

from __future__ import annotations

import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "projects" / "exceptional"
DATA = PROJECT / "data"
PAGES = {
    "index.html": None,
    "labels.html": "labels",
    "branching.html": "branching",
    "products.html": "products",
    "quantum-dimensions.html": "quantum-dimensions",
    "schur-functors.html": "schur",
    "orthogonal-functors.html": "orthogonal",
    "characters.html": "characters",
}


class AssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.paths: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        for key in ("href", "src"):
            value = attributes.get(key)
            if value:
                self.paths.append(value)


def load(relative: str) -> dict:
    with (DATA / relative).open(encoding="utf-8") as handle:
        return json.load(handle)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def matrix_shape(matrix: list[list[int]]) -> tuple[int, int]:
    rows = len(matrix)
    columns = len(matrix[0]) if matrix else 0
    if any(len(row) != columns for row in matrix):
        raise AssertionError("ragged matrix")
    return rows, columns


def check_snapshot() -> set[str]:
    manifest = load("reference/snapshot.json")
    assert manifest["doi"] == "10.5281/zenodo.21335054"
    for relative, expected in manifest["files"].items():
        assert digest(DATA / relative) == expected, relative

    levels = load("stored/labels.json")["levels"]
    assert [int(level["level"]) for level in levels] == list(range(6))
    assert [len(level["labels"]) for level in levels] == [1, 1, 3, 6, 15, 30]
    labels = [record["label"] for level in levels for record in level["labels"]]
    label_set = set(labels)
    assert len(labels) == len(label_set) == 56

    notation = load("reference/cohen_de_man.json")["notations"]
    assert list(notation) == labels[:26]

    character_document = load("stored/characters.json")
    assert character_document["ordinary_types"] == [
        "E8", "E7", "E6", "F4", "D4", "G2", "A2", "A1"
    ]
    characters = character_document["characters"]
    assert {record["label"] for record in characters} == label_set
    for record in characters:
        assert set(record["characters"]) == set(character_document["ordinary_types"])
        for terms in record["characters"].values():
            for term in terms:
                assert isinstance(term["multiplicity"], int)
                assert all(isinstance(value, int) for value in term["highest_weight"])

    compact = load("stored/quantum_dimensions.json")["quantum_dimensions"]
    rational = load("derived/quantum_dimensions_rational_level5.json")[
        "quantum_dimensions"
    ]
    assert sum(record["kind"] == "pair_product" for record in compact) == 44
    assert sum(record["kind"] == "polynomial_functor" for record in compact) == 1
    compact_labels = {record["label"] for record in compact}
    rational_labels = {record["label"] for record in rational}
    assert len(rational_labels) == 11
    assert not compact_labels & rational_labels
    assert compact_labels | rational_labels == label_set

    schur = load("stored/schur_functors.json")["tables"]
    assert [table["degree"] for table in schur] == [1, 2, 3, 4, 5]
    assert sum(len(table["partitions"]) for table in schur) == 18
    for table in schur:
        assert len(table["partitions"]) == len(table["matrix"])
        assert all(len(row) == len(table["column_labels"]) for row in table["matrix"])

    orthogonal = load("stored/orthogonal_functors.json")["tables"]
    assert [table["degree"] for table in orthogonal] == [1, 2, 3, 4, 5]
    assert sum(len(table["entries"]) for table in orthogonal) == 18

    products = load("stored/products.json")
    relation_count = (
        len(products["level2_level2_products"]["products"])
        + len(products["level2_level3_products"]["products"])
        + sum(
            len(functors)
            for functors in products["level2_square_functors"]["functors"].values()
        )
    )
    assert relation_count == 30

    matrices = load("stored/bratteli_matrices.json")
    expected_shapes = {
        "H": [(1, 1), (1, 3), (3, 6), (6, 15), (15, 30)],
        "X": [(2, 5), (5, 11), (11, 26), (26, 56)],
        "P_new": [(1, 1), (1, 1), (3, 3), (6, 6), (15, 15), (30, 30)],
        "P_cumulative": [(1, 1), (2, 2), (5, 5), (11, 11), (26, 26), (56, 56)],
        "A": [(3, 3), (6, 6), (15, 15)],
    }
    for family, expected in expected_shapes.items():
        actual = []
        for value in matrices[family].values():
            matrix = value.get("matrix") if isinstance(value, dict) else value
            actual.append(matrix_shape(matrix))
        assert actual == expected, family
    return label_set


def check_pages() -> None:
    for filename, view in PAGES.items():
        path = PROJECT / filename
        text = path.read_text(encoding="utf-8")
        assert "../../assets/css/exceptional.css" in text
        assert "../../assets/js/site.js" in text
        if view is None:
            assert "data-exceptional-view" not in text
        else:
            assert f'data-exceptional-view="{view}"' in text
            assert "../../assets/js/exceptional-tables.js" in text
        parser = AssetParser()
        parser.feed(text)
        for value in parser.paths:
            if value.startswith(("http://", "https://", "#")):
                continue
            local = value.split("?", 1)[0]
            assert (path.parent / local).resolve().exists(), (filename, value)
    qdim_page = (PROJECT / "quantum-dimensions.html").read_text(encoding="utf-8")
    rational_qdims = load("derived/quantum_dimensions_rational_level5.json")
    for record in rational_qdims["quantum_dimensions"]:
        assert record["rational_function"] not in qdim_page
    renderer = (ROOT / "assets" / "js" / "exceptional-tables.js").read_text(
        encoding="utf-8"
    )
    assert 'record["rational_function"]' not in renderer
    navigation = (ROOT / "assets" / "js" / "site.js").read_text(encoding="utf-8")
    for filename in PAGES:
        assert f"projects/exceptional/{filename}" in navigation or filename == "index.html"


def main() -> int:
    labels = check_snapshot()
    check_pages()
    print(f"PASS website snapshot: {len(labels)} labels")
    print("PASS 8 pages and 7 table renderers")
    print("PASS all compact and omitted-qdim boundaries")
    print("PASS all H, A, X, and P matrix shapes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
