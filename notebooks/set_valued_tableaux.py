import marimo

__generated_with = "0.23.5"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    from html import escape

    return escape, mo


@app.cell
def _(mo):
    mo.md(r"""
    # Set-valued tableaux playground

    This is a marimo rewrite of the small HTML prototype. The important change is
    that the tableau is now explicit Python state, rather than an array hidden in
    JavaScript.
    """)
    return


@app.cell
def _():
    def empty_tableau(rows: int, cols: int):
        """Return a rectangular tableau whose cells are empty finite sets."""
        return tuple(tuple(frozenset() for _ in range(cols)) for _ in range(rows))

    def shape(tableau):
        rows = len(tableau)
        cols = len(tableau[0]) if rows else 0
        return rows, cols

    def resize_tableau(tableau, rows: int, cols: int):
        """Resize, preserving existing cells where possible."""
        old_rows, old_cols = shape(tableau)
        return tuple(
            tuple(
                tableau[r][c] if r < old_rows and c < old_cols else frozenset()
                for c in range(cols)
            )
            for r in range(rows)
        )

    def add_to_cell(tableau, row: int, col: int, value: int):
        """Add value to the chosen cell. Rows and columns are zero-based."""
        rows, cols = shape(tableau)
        if not (0 <= row < rows and 0 <= col < cols):
            raise IndexError("cell is outside the tableau")
        new_rows = []
        for r, old_row in enumerate(tableau):
            new_row = []
            for c, old_cell in enumerate(old_row):
                if r == row and c == col:
                    new_row.append(frozenset(set(old_cell) | {value}))
                else:
                    new_row.append(old_cell)
            new_rows.append(tuple(new_row))
        return tuple(new_rows)

    def clear_cell(tableau, row: int, col: int):
        rows, cols = shape(tableau)
        if not (0 <= row < rows and 0 <= col < cols):
            raise IndexError("cell is outside the tableau")
        return tuple(
            tuple(frozenset() if (r == row and c == col) else cell for c, cell in enumerate(old_row))
            for r, old_row in enumerate(tableau)
        )

    def cell_text(cell):
        return ", ".join(str(x) for x in sorted(cell))

    def is_semistandard_set_valued_tableau(tableau):
        """
        Basic Buch-style semistandard check for a rectangular set-valued tableau:
        max(left cell) <= min(right cell), and max(upper cell) < min(lower cell),
        ignoring empty cells.
        """
        rows, cols = shape(tableau)
        problems = []
        for r in range(rows):
            for c in range(cols - 1):
                left, right = tableau[r][c], tableau[r][c + 1]
                if left and right and max(left) > min(right):
                    problems.append(f"row {r + 1}: cell {c + 1} should be <= cell {c + 2}")
        for r in range(rows - 1):
            for c in range(cols):
                upper, lower = tableau[r][c], tableau[r + 1][c]
                if upper and lower and max(upper) >= min(lower):
                    problems.append(f"column {c + 1}: cell {r + 1} should be < cell {r + 2}")
        return problems

    return (
        add_to_cell,
        cell_text,
        clear_cell,
        empty_tableau,
        is_semistandard_set_valued_tableau,
        resize_tableau,
        shape,
    )


@app.cell
def _(empty_tableau, mo):
    get_tableau, set_tableau = mo.state(empty_tableau(1, 4))
    get_message, set_message = mo.state("Ready.")
    return get_message, get_tableau, set_message, set_tableau


@app.cell
def _(
    add_to_cell,
    clear_cell,
    get_tableau,
    mo,
    resize_tableau,
    set_message,
    set_tableau,
    shape,
):
    n_rows = mo.ui.number(start=1, stop=12, step=1, value=1, label="rows")
    n_cols = mo.ui.number(start=1, stop=12, step=1, value=4, label="columns")
    row = mo.ui.number(start=1, stop=12, step=1, value=1, label="row")
    col = mo.ui.number(start=1, stop=12, step=1, value=1, label="column")
    entry = mo.ui.number(start=1, stop=200, step=1, value=1, label="entry")

    def _resize(count):
        rows = int(n_rows.value)
        cols = int(n_cols.value)
        set_tableau(resize_tableau(get_tableau(), rows, cols))
        set_message(f"Resized to {rows} x {cols}.")
        return count + 1

    def _add(count):
        tableau = get_tableau()
        rows, cols = shape(tableau)
        r = int(row.value) - 1
        c = int(col.value) - 1
        if not (0 <= r < rows and 0 <= c < cols):
            set_message("That cell is outside the current tableau.")
            return count + 1
        value = int(entry.value)
        set_tableau(add_to_cell(tableau, r, c, value))
        set_message(f"Added {value} to cell ({r + 1}, {c + 1}).")
        return count + 1

    def _clear(count):
        tableau = get_tableau()
        rows, cols = shape(tableau)
        r = int(row.value) - 1
        c = int(col.value) - 1
        if not (0 <= r < rows and 0 <= c < cols):
            set_message("That cell is outside the current tableau.")
            return count + 1
        set_tableau(clear_cell(tableau, r, c))
        set_message(f"Cleared cell ({r + 1}, {c + 1}).")
        return count + 1

    resize_button = mo.ui.button(value=0, on_click=_resize, label="resize tableau")
    add_button = mo.ui.button(value=0, on_click=_add, label="add entry", kind="success")
    clear_button = mo.ui.button(value=0, on_click=_clear, label="clear cell", kind="warn")

    mo.vstack(
        [
            mo.md("## Controls"),
            mo.hstack([n_rows, n_cols, resize_button]),
            mo.hstack([row, col, entry, add_button, clear_button]),
        ]
    )
    return


@app.cell
def _(
    cell_text,
    escape,
    get_message,
    get_tableau,
    is_semistandard_set_valued_tableau,
    mo,
):
    tableau = get_tableau()
    rows = []
    for row_cells in tableau:
        cells = []
        for cell in row_cells:
            text = escape(cell_text(cell)) or "&nbsp;"
            cells.append(f"<td>{text}</td>")
        rows.append("<tr>" + "".join(cells) + "</tr>")

    css = """
    <style>
      table.setvalued { border-collapse: collapse; margin-top: 0.5rem; }
      table.setvalued td {
        min-width: 4.5rem;
        height: 3.25rem;
        border: 1px solid black;
        text-align: center;
        vertical-align: middle;
        padding: 0.4rem;
        font-size: 1.05rem;
      }
    </style>
    """
    html = css + '<table class="setvalued">' + "".join(rows) + "</table>"

    problems = is_semistandard_set_valued_tableau(tableau)
    status = "Semistandard conditions pass." if not problems else "Problems: " + "; ".join(problems)

    mo.vstack(
        [
            mo.md("## Tableau"),
            mo.Html(html),
            mo.md(f"**Status:** {escape(status)}"),
            mo.md(f"**Message:** {escape(get_message())}"),
        ]
    )
    return (tableau,)


@app.cell
def _(mo, tableau):
    mo.md(
        "## Python value\n\n"
        "The current tableau is an immutable tuple-of-tuples of `frozenset`s, so it is easy "
        "to pass to later combinatorial code."
    )
    tableau
    return


@app.cell
def _():
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
