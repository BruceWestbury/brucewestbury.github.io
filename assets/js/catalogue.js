/* catalogue.js — shared catalogue rendering utilities */

// Base URL for cubic-jordan data (JSON caches).
// cubic-jordan is deployed as a GitHub Pages site at this URL.
const DATA_BASE = "https://brucewestbury.github.io/cubic-jordan";

// ── Helpers ───────────────────────────────────────────────

function sagePolynomialToLatex(text) {
    // Remove Sage multiplication stars so MathJax renders cleanly.
    return String(text).replaceAll("*", "\\,");
}

function valueOrDash(x) {
    return x === null || x === undefined ? "–" : x;
}

function yesNo(x) {
    if (x === true)  return "yes";
    if (x === false) return "no";
    return "–";
}

// ── JSON loading ──────────────────────────────────────────

async function loadJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.json();
}

// ── Closed graph card ─────────────────────────────────────

function graphCard(record) {
    const card = document.createElement("article");
    card.className = "card";

    // Invariants (small grid, above drawing)
    if (record.invariants && Object.keys(record.invariants).length > 0) {
        const inv = document.createElement("div");
        inv.className = "invariants";

        const show = {
            automorphism_group_order: "aut",
            diameter:                 "diam",
            chromatic_number:         "χ",
            is_hamiltonian:           "hamiltonian",
            num_spanning_trees:       "span. trees",
        };

        for (const [key, label] of Object.entries(show)) {
            if (record.invariants[key] !== undefined) {
                const cell = document.createElement("span");
                const val  = key === "is_hamiltonian"
                    ? yesNo(record.invariants[key])
                    : valueOrDash(record.invariants[key]);
                cell.innerHTML = `<strong>${label}</strong>: ${val}`;
                inv.appendChild(cell);
            }
        }

        card.appendChild(inv);
    }

    // Drawing (SVG)
    const drawing = document.createElement("div");
    drawing.className = "drawing";
    drawing.innerHTML = record.svg || "<span style='color:#999;font-size:0.85rem'>No SVG</span>";
    card.appendChild(drawing);

    // Evaluation
    const evaluation = document.createElement("div");
    evaluation.className = "evaluation";
    if (record.evaluation === null || record.evaluation === undefined) {
        evaluation.textContent = "evaluation: not cached";
    } else {
        evaluation.innerHTML = `\\[${sagePolynomialToLatex(record.evaluation)}\\]`;
    }
    card.appendChild(evaluation);

    // DOT source (collapsible)
    if (record.dot) {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = "DOT source";
        const pre = document.createElement("pre");
        pre.textContent = record.dot;
        details.appendChild(summary);
        details.appendChild(pre);
        card.appendChild(details);
    }

    // Internal identifiers (collapsible)
    if (record.internal) {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = "Identifiers";
        const pre = document.createElement("pre");
        pre.textContent = JSON.stringify(record.internal, null, 2);
        details.appendChild(summary);
        details.appendChild(pre);
        card.appendChild(details);
    }

    return card;
}

// ── Obstruction witness card ──────────────────────────────

function obstructionCard(record) {
    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
        <h2>Witness ${record.display_index ?? record.index}</h2>

        <p style="font-size:0.85rem">
            <strong>Source</strong><br>
            <code>${record.source_key ?? "—"}</code>
        </p>

        <p style="font-size:0.85rem;margin-top:0.5rem">
            <strong>Multiplier</strong>
            \\(${sagePolynomialToLatex(record.multiplier)}\\)
        </p>

        <details>
            <summary>Raw obstruction</summary>
            <pre>${record.raw_obstruction}</pre>
        </details>

        <details>
            <summary>Factorisation</summary>
            <pre>${record.factorisation}</pre>
        </details>

        ${record.provenance ? `
        <details>
            <summary>Provenance</summary>
            <pre>${JSON.stringify(record.provenance, null, 2)}</pre>
        </details>` : ""}

        <details>
            <summary>Relation</summary>
            <pre>${JSON.stringify(record.relation, null, 2)}</pre>
        </details>
    `;

    return card;
}

// ── MathJax re-typeset ────────────────────────────────────

function retypeset() {
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
}
