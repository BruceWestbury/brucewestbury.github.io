import marimo

__generated_with = "0.23.5"
app = marimo.App(width="medium")


@app.cell
def _():
    import html
    import marimo as mo
    import random
    from dataclasses import dataclass

    return dataclass, html, mo, random


@app.cell
def _(dataclass):
    @dataclass(frozen=True)
    class TableauState:
        entries: dict[tuple[int, int], int]
        hole: tuple[int, int] | None = None
        history: tuple[str, ...] = ()
        # Fixed rectangle containing the original tableau:
        # (min_row, max_row, min_col, max_col), inclusive.
        frame: tuple[int, int, int, int] | None = None

    def diagonal_word_skew_tableau(word: tuple[int, ...]) -> TableauState:
        n = len(word)
        return TableauState(
            entries={(n - 1 - i, i): x for i, x in enumerate(word)},
            hole=None,
            history=("Initial SW--NE diagonal skew tableau.",),
            frame=(0, n - 1, 0, n - 1),
        )

    def bounding_box(cells: set[tuple[int, int]], padding: int = 0):
        if not cells:
            return range(1), range(1)
        rows = [r for r, _ in cells]
        cols = [c for _, c in cells]
        return (
            range(min(rows) - padding, max(rows) + padding + 1),
            range(min(cols) - padding, max(cols) + padding + 1),
        )

    def diagram_cells(state: TableauState) -> set[tuple[int, int]]:
        cells = set(state.entries)
        if state.hole is not None:
            cells.add(state.hole)
        return cells

    def is_skew_shape(cells: set[tuple[int, int]]) -> bool:
        if not cells:
            return True
        by_row: dict[int, list[int]] = {}
        for r, c in cells:
            by_row.setdefault(r, []).append(c)
        rows = sorted(by_row)
        lefts = []
        rights = []
        for r in rows:
            cols = sorted(by_row[r])
            if cols != list(range(cols[0], cols[-1] + 1)):
                return False
            lefts.append(cols[0])
            rights.append(cols[-1] + 1)
        if rows != list(range(rows[0], rows[-1] + 1)):
            return False
        return all(rights[i] >= rights[i + 1] for i in range(len(rights) - 1)) and all(
            lefts[i] >= lefts[i + 1] for i in range(len(lefts) - 1)
        )

    def is_semistandard(entries: dict[tuple[int, int], int]) -> bool:
        for (r, c), x in entries.items():
            if (r, c + 1) in entries and not (x <= entries[(r, c + 1)]):
                return False
            if (r + 1, c) in entries and not (x < entries[(r + 1, c)]):
                return False
        return True

    def possible_holes(state: TableauState) -> tuple[tuple[int, int], ...]:
        if state.hole is not None:
            return ()
        entries = state.entries
        candidates: set[tuple[int, int]] = set()
        for r, c in entries:
            candidates.add((r, c - 1))  # immediately left of an entry
            candidates.add((r - 1, c))  # immediately above an entry

        if state.frame is None:
            min_r, max_r, min_c, max_c = (
                min(r for r, _ in entries),
                max(r for r, _ in entries),
                min(c for _, c in entries),
                max(c for _, c in entries),
            )
        else:
            min_r, max_r, min_c, max_c = state.frame

        holes = []
        for r, c in candidates:
            if not (min_r <= r <= max_r and min_c <= c <= max_c):
                continue
            if (r, c) in entries:
                continue
            right_cols = [cc for (rr, cc) in entries if rr == r and cc > c]
            below_rows = [rr for (rr, cc) in entries if cc == c and rr > r]
            if not right_cols and not below_rows:
                continue
            if right_cols and min(right_cols) != c + 1:
                continue
            if below_rows and min(below_rows) != r + 1:
                continue
            holes.append((r, c))
        return tuple(sorted(holes))

    def start_slide(state: TableauState, hole: tuple[int, int]) -> TableauState:
        return TableauState(
            entries=dict(state.entries),
            hole=hole,
            history=state.history + (f"Started a jeu de taquin slide at {hole}.",),
            frame=state.frame,
        )

    def slide_step(state: TableauState) -> TableauState:
        if state.hole is None:
            return state
        r, c = state.hole
        right = (r, c + 1)
        below = (r + 1, c)
        has_right = right in state.entries
        has_below = below in state.entries
        if not has_right and not has_below:
            return TableauState(
                entries=dict(state.entries),
                hole=None,
                history=state.history + ("The hole reached the outer boundary; the slide stops.",),
                frame=state.frame,
            )
        if has_right and not has_below:
            chosen = right
        elif has_below and not has_right:
            chosen = below
        else:
            chosen = below if state.entries[below] <= state.entries[right] else right
        new_entries = dict(state.entries)
        moved = new_entries.pop(chosen)
        new_entries[(r, c)] = moved
        cr, cc = chosen
        if (cr, cc + 1) not in new_entries and (cr + 1, cc) not in new_entries:
            return TableauState(
                entries=new_entries,
                hole=None,
                history=state.history + (f"Moved {moved} from {chosen} into {(r, c)}; the slide stops.",),
                frame=state.frame,
            )
        return TableauState(
            entries=new_entries,
            hole=chosen,
            history=state.history + (f"Moved {moved} from {chosen} into {(r, c)}.",),
            frame=state.frame,
        )

    def random_semistandard_diagonal_word(n: int, a: int, rng) -> tuple[int, ...]:
        return tuple(rng.randint(1, a) for _ in range(n))

    return (
        bounding_box,
        diagonal_word_skew_tableau,
        diagram_cells,
        is_semistandard,
        is_skew_shape,
        possible_holes,
        random_semistandard_diagonal_word,
        slide_step,
        start_slide,
    )


@app.cell
def _(mo):
    mo.md(r"""
    # RECTIFICATION BUTTONS V4

    This file deliberately shows a **Button panel** immediately under the tableau. Starting holes are restricted to the original bounding rectangle.
    If no slide is active it shows **Start (r, c)** buttons. During a slide it
    shows **NEXT**.
    """)
    return


@app.cell
def _(mo):
    n = mo.ui.number(start=2, stop=20, step=1, value=6, label="word length n")
    a = mo.ui.number(start=1, stop=20, step=1, value=5, label="alphabet size a")
    seed = mo.ui.number(start=0, stop=10_000, step=1, value=1, label="random seed")
    reset = mo.ui.button(label="new diagonal word")
    mo.hstack([n, a, seed, reset])
    return a, n, reset, seed


@app.cell
def _(
    a,
    diagonal_word_skew_tableau,
    mo,
    n,
    random,
    random_semistandard_diagonal_word,
    reset,
    seed,
):
    _clicks = 0 if reset.value is None else int(reset.value)
    _rng = random.Random(int(seed.value) + _clicks)
    _initial = diagonal_word_skew_tableau(
        random_semistandard_diagonal_word(int(n.value), int(a.value), _rng)
    )
    get_state, set_state = mo.state(_initial)
    return get_state, set_state


@app.cell
def tableau_view(
    bounding_box,
    diagram_cells,
    get_state,
    html,
    is_semistandard,
    is_skew_shape,
    mo,
    possible_holes,
):
    state = get_state()
    holes = tuple(possible_holes(state))
    cells_to_draw = set(state.entries) | set(holes)
    if state.hole is not None:
        cells_to_draw.add(state.hole)
    if state.frame is not None:
        min_r, max_r, min_c, max_c = state.frame
        cells_to_draw.update((r, c) for r in range(min_r, max_r + 1) for c in range(min_c, max_c + 1))
    rows, cols = bounding_box(cells_to_draw or set(state.entries), padding=0)

    def _cell_div(pos):
        if pos in state.entries:
            _content = html.escape(str(state.entries[pos]))
            _cls = "entry"
        elif state.hole == pos:
            _content = "□"
            _cls = "active-hole"
        elif pos in holes:
            _content = "□"
            _cls = "possible-hole"
        else:
            _content = ""
            _cls = "blank"
        return f'<div class="jt-cell {_cls}">{_content}</div>'

    _grid_cells = "\n".join(_cell_div((r, c)) for r in rows for c in cols)
    mo.vstack(
        [
            mo.Html(
                f"""
                <style>
                  .jt-grid {{
                    display: inline-grid;
                    grid-template-columns: repeat({len(cols)}, 3rem);
                    grid-auto-rows: 3rem;
                    gap: 0px;
                    line-height: 1;
                  }}
                  .jt-cell {{
                    width: 3rem; height: 3rem;
                    display: flex; align-items: center; justify-content: center;
                    box-sizing: border-box; font-size: 1.2rem;
                    margin: 0; padding: 0;
                  }}
                  .jt-cell.entry {{ border: 1px solid #333; background: white; }}
                  .jt-cell.active-hole {{ border: 2px dashed #333; background: #fff4bf; }}
                  .jt-cell.possible-hole {{ border: 1px solid #777; background: #e8eefc; }}
                  .jt-cell.blank {{ border: 1px solid transparent; background: transparent; }}
                </style>
                <div class="jt-grid">{_grid_cells}</div>
                """
            ),
            mo.md(
                f"Skew shape including active hole: **{is_skew_shape(diagram_cells(state))}**  \n"
                f"Filled boxes semistandard: **{is_semistandard(state.entries)}**  \n"
                f"Active hole: **{state.hole}**  \n"
                f"Possible starting holes: **{holes}**"
            ),
        ],
        gap=0,
    )
    return holes, state


@app.cell
def button_panel(
    get_state,
    holes,
    mo,
    set_state,
    slide_step,
    start_slide,
    state,
):
    def _start_callback(_value=None, _pos=None):
        _state_now = get_state()
        if _pos is not None and _state_now.hole is None:
            set_state(start_slide(_state_now, _pos))

    def _next_callback(_value=None):
        set_state(slide_step(get_state()))

    if state.hole is None:
        _buttons = [
            mo.ui.button(
                label=f"Start {pos}",
                on_click=lambda _value=None, pos=pos: _start_callback(_value, pos),
            )
            for pos in holes
        ]
        if _buttons:
            _panel = mo.vstack([
                mo.md("## BUTTON PANEL V4"),
                mo.md(f"Possible holes: `{holes}`"),
                mo.hstack(_buttons, gap=1),
            ], gap=0)
        else:
            _panel = mo.vstack([
                mo.md("## BUTTON PANEL V4"),
                mo.md("No possible starting holes."),
                mo.md(f"Active hole: `{state.hole}`"),
            ], gap=0)
    else:
        _panel = mo.vstack([
            mo.md("## BUTTON PANEL V4"),
            mo.md(f"Active hole: `{state.hole}`"),
            mo.ui.button(label="NEXT", on_click=_next_callback),
        ], gap=0)

    _panel
    return


@app.cell
def _(mo, state):
    mo.md("### Recent moves\n\n" + "\n".join(f"- {line}" for line in state.history[-10:]))
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
