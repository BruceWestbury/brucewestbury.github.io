/* catalogue.js — shared catalogue rendering utilities */

// ── Helpers ───────────────────────────────────────────────

function sagePolynomialToLatex(text) {
  // Remove Sage multiplication stars so MathJax renders cleanly.
  return String(text).replaceAll("*", "\\,");
}

function valueOrDash(x) {
  return x === null || x === undefined ? "–" : x;
}

function yesNo(x) {
  if (x === true) return "yes";
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
      diameter: "diam",
      chromatic_number: "χ",
      is_hamiltonian: "hamiltonian",
      num_spanning_trees: "span. trees",
    };

    for (const [key, label] of Object.entries(show)) {
      if (record.invariants[key] !== undefined) {
        const cell = document.createElement("span");
        const val =
          key === "is_hamiltonian"
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
  drawing.innerHTML =
    record.svg || "<span style='color:#999;font-size:0.85rem'>No SVG</span>";
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
    `;

  // Drawing (SVG)
  const drawing = document.createElement("div");
  drawing.className = "drawing";
  drawing.innerHTML =
    record.source_svg ||
    "<span style='color:#999;font-size:0.85rem'>No SVG</span>";
  card.appendChild(drawing);

  // Source key
  const sourceKey = document.createElement("p");
  sourceKey.style.fontSize = "0.85rem";
  sourceKey.innerHTML = `
        <strong>Source key</strong><br>
        <code>${record.source_key ?? "—"}</code>
    `;
  card.appendChild(sourceKey);

  const body = document.createElement("div");
  body.innerHTML = `
        <p style="font-size:0.85rem;margin-top:0.5rem">
            <strong>Multiplier</strong>
            \\(${sagePolynomialToLatex(record.multiplier)}\\)
        </p>

        <details>
            <summary>Obstruction</summary>
            <pre>${record.factorisation}</pre>
        </details>

        ${
          record.source_dot
            ? `
        <details>
            <summary>DOT</summary>
            <pre>${record.source_dot}</pre>
        </details>`
            : ""
        }
    `;

  card.appendChild(body);
  return card;
}

// ── MathJax re-typeset ────────────────────────────────────

function retypeset() {
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise();
  }
}
