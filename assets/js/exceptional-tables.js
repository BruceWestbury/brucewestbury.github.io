/* Render the Exceptional-series release JSON without mathematical recomputation. */

(function () {
  "use strict";

  const R = (window.SITE_ROOT || ".").replace(/\/$/, "");
  const DATA_ROOT = `${R}/projects/exceptional/data`;
  const PATHS = {
    labels: "stored/labels.json",
    characters: "stored/characters.json",
    qdims: "stored/quantum_dimensions.json",
    rationalQdims: "derived/quantum_dimensions_rational_level5.json",
    schur: "stored/schur_functors.json",
    orthogonal: "stored/orthogonal_functors.json",
    bratteli: "stored/bratteli_matrices.json",
    products: "stored/products.json",
    notation: "reference/cohen_de_man.json",
  };
  const jsonCache = new Map();
  let contextPromise = null;

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  }

  function math(tex, className) {
    return node("span", className || "", `\\(${tex}\\)`);
  }

  function clearTypeset(target) {
    if (window.MathJax && MathJax.typesetClear) {
      MathJax.typesetClear([target]);
    }
    target.replaceChildren();
  }

  function typeset(target, attempt) {
    const count = attempt || 0;
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([target]).catch(() => {});
      return;
    }
    if (count < 30) {
      window.setTimeout(() => typeset(target, count + 1), 100);
    }
  }

  async function loadJson(relative) {
    if (!jsonCache.has(relative)) {
      jsonCache.set(
        relative,
        fetch(`${DATA_ROOT}/${relative}`).then((response) => {
          if (!response.ok) {
            throw new Error(`${relative}: HTTP ${response.status}`);
          }
          return response.json();
        }),
      );
    }
    return jsonCache.get(relative);
  }

  async function context() {
    if (!contextPromise) {
      contextPromise = loadJson(PATHS.labels).then((document) => {
        const byLabel = new Map();
        const byLevel = new Map();
        for (const level of document.levels) {
          byLevel.set(Number(level.level), level.labels);
          for (const record of level.labels) {
            byLabel.set(record.label, {
              ...record,
              level: Number(level.level),
            });
          }
        }
        return { document, byLabel, byLevel };
      });
    }
    return contextPromise;
  }

  function labelTex(label, data) {
    if (label === "I" || label === "L") return label;
    const record = data.byLabel.get(label);
    if (!record || !record.coordinates) return `\\mathrm{${label}}`;
    return `V_{${record.level}}(${record.coordinates.join(",")})`;
  }

  function labelNode(label, data) {
    const result = node("span", "math-label");
    if (label === "I" || label === "L") {
      result.textContent = label;
      return result;
    }
    const record = data.byLabel.get(label);
    if (!record || !record.coordinates) {
      result.textContent = label;
      return result;
    }
    result.append("V", node("sub", "", String(record.level)));
    result.append(`(${record.coordinates.join(",")})`);
    return result;
  }

  function paperNotationTex(value) {
    const starred = value.endsWith("*");
    const core = starred ? value.slice(0, -1) : value;
    const match = core.match(/^([A-Z])(\d+)?$/);
    if (!match) return `\\mathrm{${core}}${starred ? "^{*}" : ""}`;
    const subscript = match[2] ? `_{${match[2]}}` : "";
    return `${match[1]}${subscript}${starred ? "^{*}" : ""}`;
  }

  function casimirTex(formula) {
    return formula.replaceAll("*n", "n");
  }

  function linearPairTex(pair) {
    const r = Number(pair[0]);
    const s = Number(pair[1]);
    let expression = "";
    if (r === 1) expression = "n";
    else if (r === -1) expression = "-n";
    else if (r !== 0) expression = `${r}n`;
    if (s !== 0) {
      if (expression && s > 0) expression += "+";
      expression += String(s);
    }
    if (!expression) expression = "0";
    return `[${expression}]`;
  }

  function partitionTex(value) {
    const parts = Array.isArray(value)
      ? value
      : String(value)
          .replace(/^\[/, "")
          .replace(/\]$/, "")
          .split(",")
          .filter(Boolean);
    return `(${parts.join(",")})`;
  }

  function fractionTex(value) {
    const parts = String(value).split("/");
    return parts.length === 2
      ? `\\frac{${parts[0]}}{${parts[1]}}`
      : String(value);
  }

  function appendFactors(target, factors, negative) {
    const expression = node("div", "factor-list");
    target.append(expression);
    if (!factors.length) {
      expression.append(math(negative ? "-1" : "1", "quantum-factor"));
      return;
    }
    factors.forEach((factor, index) => {
      const prefix = negative && index === 0 ? "-" : "";
      expression.append(
        math(`${prefix}${linearPairTex(factor)}`, "quantum-factor"),
      );
    });
  }

  function appendLinearCombination(target, entries, data) {
    const expression = node("div", "linear-combination");
    target.append(expression);
    const terms = Object.entries(entries).filter((entry) => Number(entry[1]));
    if (!terms.length) {
      expression.textContent = "0";
      return;
    }
    terms.forEach(([label, coefficient], index) => {
      const value = Number(coefficient);
      const term = node("span", "linear-term");
      if (value < 0) term.append(index === 0 ? "-" : " - ");
      else if (index > 0) term.append(" + ");
      const magnitude = Math.abs(value);
      if (magnitude !== 1) term.append(`${magnitude} `);
      term.append(labelNode(label, data));
      expression.append(term);
    });
  }

  function appendCharacter(target, terms) {
    const expression = node("div", "character-expression");
    target.append(expression);
    if (!terms.length) {
      expression.append(math("0", "character-term"));
      return;
    }
    terms.forEach((term, index) => {
      const multiplicity = Number(term.multiplicity);
      let prefix = "";
      if (multiplicity < 0) prefix = index === 0 ? "-" : "-";
      else if (index > 0) prefix = "+";
      const magnitude = Math.abs(multiplicity);
      const coefficient = magnitude === 1 ? "" : String(magnitude);
      const weight = `[${term.highest_weight.join(",")}]`;
      expression.append(
        math(`${prefix}${coefficient}${weight}`, "character-term"),
      );
    });
  }

  function appendBasisExpression(target, terms, basis) {
    const expression = node("div", "basis-expression");
    target.append(expression);
    terms.forEach((term, index) => {
      const raw = String(term.coefficient);
      const negative = raw.startsWith("-");
      const absolute = negative ? raw.slice(1) : raw;
      let prefix = "";
      if (negative) prefix = "-";
      else if (index > 0) prefix = "+";
      const coefficient = absolute === "1" ? "" : fractionTex(absolute);
      const termTex = `${prefix}${coefficient}${basis}_{${partitionTex(term.partition)}}`;
      expression.append(math(termTex, "basis-term"));
    });
  }

  function table(headers, className) {
    const wrapper = node("div", "table-scroll");
    const result = node("table", `data-table ${className || ""}`.trim());
    const head = node("thead");
    const row = node("tr");
    headers.forEach((header, index) => {
      const cell = node("th", index === 0 ? "sticky-column" : "");
      cell.scope = "col";
      if (header instanceof Node) cell.append(header);
      else cell.textContent = header;
      row.append(cell);
    });
    head.append(row);
    result.append(head);
    const body = node("tbody");
    result.append(body);
    wrapper.append(result);
    return { wrapper, table: result, body };
  }

  function rowHeader(content) {
    const cell = node("th", "sticky-column");
    cell.scope = "row";
    if (content instanceof Node) cell.append(content);
    else cell.textContent = content;
    return cell;
  }

  function segmented(values, active, onChange, label) {
    const result = node("div", "level-tabs");
    result.setAttribute("role", "group");
    const buttons = new Map();
    for (const value of values) {
      const button = node("button", "", label ? label(value) : String(value));
      button.type = "button";
      button.classList.toggle("active", value === active);
      button.setAttribute("aria-pressed", String(value === active));
      button.addEventListener("click", () => {
        for (const [candidate, item] of buttons) {
          const selected = candidate === value;
          item.classList.toggle("active", selected);
          item.setAttribute("aria-pressed", String(selected));
        }
        onChange(value);
      });
      buttons.set(value, button);
      result.append(button);
    }
    return result;
  }

  function rawLinks(items) {
    const result = node("div", "raw-data-links");
    for (const [label, relative] of items) {
      const link = node("a", "", label);
      link.href = `${DATA_ROOT}/${relative}`;
      result.append(link);
    }
    return result;
  }

  function defaultLevel() {
    const requested = Number(new URLSearchParams(location.search).get("level"));
    return Number.isInteger(requested) && requested >= 0 && requested <= 5
      ? requested
      : 2;
  }

  async function renderLabels(root) {
    const [data, notation] = await Promise.all([
      context(),
      loadJson(PATHS.notation),
    ]);
    clearTypeset(root);
    const selected = defaultLevel();
    const output = node("div");
    root.append(
      segmented([0, 1, 2, 3, 4, 5], selected, draw, (level) =>
        String(level),
      ),
      output,
      rawLinks([["labels.json", PATHS.labels], ["characters.json", PATHS.characters]]),
    );

    async function draw(level) {
      const characters = await loadJson(PATHS.characters);
      const characterMap = new Map(
        characters.characters.map((record) => [record.label, record]),
      );
      clearTypeset(output);
      const headers = level <= 4
        ? ["Label", "Cohen-de Man", "Casimir"]
        : ["Label", "Casimir"];
      const built = table(headers, "labels-table");
      for (const record of data.byLevel.get(level)) {
        const tr = node("tr");
        tr.append(rowHeader(labelNode(record.label, data)));
        if (level <= 4) {
          const notationCell = node("td");
          notationCell.append(
            math(paperNotationTex(notation.notations[record.label])),
          );
          tr.append(notationCell);
        }
        const casimir = node("td");
        casimir.append(math(casimirTex(characterMap.get(record.label).casimir_formula)));
        tr.append(casimir);
        built.body.append(tr);
      }
      output.append(built.wrapper);
      typeset(output);
    }

    await draw(selected);
  }

  async function renderCharacters(root) {
    const [data, document] = await Promise.all([
      context(),
      loadJson(PATHS.characters),
    ]);
    const records = new Map(
      document.characters.map((record) => [record.label, record]),
    );
    const groups = {
      smaller: ["A1", "A2", "G2", "D4"],
      exceptional: ["F4", "E6", "E7", "E8"],
    };
    let level = defaultLevel();
    let group = "smaller";
    clearTypeset(root);
    const controls = node("div", "table-controls");
    controls.append(
      segmented([0, 1, 2, 3, 4, 5], level, (value) => {
        level = value;
        draw();
      }),
      segmented(
        ["smaller", "exceptional"],
        group,
        (value) => {
          group = value;
          draw();
        },
        (value) => value === "smaller" ? "A1-D4" : "F4-E8",
      ),
    );
    const output = node("div");
    root.append(
      controls,
      output,
      rawLinks([["characters.json", PATHS.characters]]),
    );

    function draw() {
      clearTypeset(output);
      const types = groups[group];
      const built = table(["Label", ...types], "character-table");
      for (const labelRecord of data.byLevel.get(level)) {
        const tr = node("tr");
        tr.append(rowHeader(labelNode(labelRecord.label, data)));
        const record = records.get(labelRecord.label);
        for (const type of types) {
          const td = node("td");
          appendCharacter(td, record.characters[type]);
          tr.append(td);
        }
        built.body.append(tr);
      }
      output.append(built.wrapper);
      typeset(output);
    }

    draw();
  }

  function polynomialFunctorTex(expression) {
    if (expression !== "E5(L) - E3(L)*L + 2*E2(L)*L - 2*L*L + L") {
      throw new Error(`Unrecognized polynomial functor: ${expression}`);
    }
    return "\\bigwedge^{5}L-\\bigwedge^{3}L\\,L+2\\bigwedge^{2}L\\,L-2L^{2}+L";
  }

  async function renderQdims(root) {
    const [data, compact, rational] = await Promise.all([
      context(),
      loadJson(PATHS.qdims),
      loadJson(PATHS.rationalQdims),
    ]);
    const compactMap = new Map(
      compact.quantum_dimensions.map((record) => [record.label, record]),
    );
    let level = defaultLevel();
    clearTypeset(root);
    const output = node("div");
    root.append(
      segmented([0, 1, 2, 3, 4, 5], level, (value) => {
        level = value;
        draw();
      }),
      output,
      rawLinks([
        ["quantum_dimensions.json", PATHS.qdims],
        ["quantum_dimensions_rational_level5.json", PATHS.rationalQdims],
      ]),
    );

    function draw() {
      clearTypeset(output);
      const built = table(["V", "N(V)", "D(V)"], "qdim-table");
      for (const labelRecord of data.byLevel.get(level)) {
        const record = compactMap.get(labelRecord.label);
        if (!record) continue;
        const tr = node("tr");
        tr.append(rowHeader(labelNode(labelRecord.label, data)));
        const numerator = node("td");
        const denominator = node("td");
        if (record.kind === "pair_product") {
          appendFactors(numerator, record.numerator, Number(record.sign) < 0);
          appendFactors(denominator, record.denominator, false);
        } else if (record.kind === "polynomial_functor") {
          numerator.append(math(polynomialFunctorTex(record.expression)));
          denominator.append(math("1"));
        } else {
          throw new Error(`Unknown qdim kind: ${record.kind}`);
        }
        tr.append(numerator, denominator);
        built.body.append(tr);
      }
      output.append(built.wrapper);

      if (level === 5) {
        const omitted = node("section", "omitted-formulas");
        omitted.append(node("h2", "", "Non-pair rational functions"));
        const explanation = node("p");
        explanation.textContent =
          "The following exact quantum dimensions are stored as rational functions in Q and q. Their denominators factor into small cyclotomic factors, but their numerators contain irreducible factors with thousands of terms, so the formulas are not displayed here.";
        omitted.append(explanation);
        const labels = node("div", "omitted-labels");
        for (const record of rational.quantum_dimensions) {
          labels.append(labelNode(record.label, data));
        }
        omitted.append(labels);
        const link = node("a", "", "Open the exact rational-function JSON");
        link.href = `${DATA_ROOT}/${PATHS.rationalQdims}`;
        omitted.append(link);
        output.append(omitted);
      }
      typeset(output);
    }

    draw();
  }

  function productExpression(left, right, data) {
    const result = node("span", "linear-combination");
    result.append(labelNode(left, data), " ⊗ ", labelNode(right, data));
    return result;
  }

  async function renderProducts(root) {
    const [data, products] = await Promise.all([
      context(),
      loadJson(PATHS.products),
    ]);
    clearTypeset(root);
    const sections = [
      ["Level two by level two", products.level2_level2_products.products],
      ["Level two by level three", products.level2_level3_products.products],
    ];
    for (const [title, records] of sections) {
      root.append(node("h2", "", title));
      const built = table(["Product", "Decomposition"], "products-table");
      for (const [key, decomposition] of Object.entries(records)) {
        const [left, right] = key.split("*");
        const tr = node("tr");
        tr.append(rowHeader(productExpression(left, right, data)));
        const td = node("td");
        appendLinearCombination(td, decomposition, data);
        tr.append(td);
        built.body.append(tr);
      }
      root.append(built.wrapper);
    }

    root.append(node("h2", "", "Symmetric and exterior squares"));
    const built = table(["Functor", "Decomposition"], "products-table");
    for (const [label, functors] of Object.entries(
      products.level2_square_functors.functors,
    )) {
      for (const [functor, decomposition] of Object.entries(functors)) {
        const title = node("span", "linear-combination");
        title.append(
          math(functor === "Sym2" ? "\\operatorname{Sym}^{2}" : "\\bigwedge^{2}"),
          "(",
          labelNode(label, data),
          ")",
        );
        const tr = node("tr");
        tr.append(rowHeader(title));
        const td = node("td");
        appendLinearCombination(td, decomposition, data);
        tr.append(td);
        built.body.append(tr);
      }
    }
    root.append(
      built.wrapper,
      rawLinks([["products.json", PATHS.products]]),
    );
    typeset(root);
  }

  async function renderSchur(root) {
    const [data, document] = await Promise.all([
      context(),
      loadJson(PATHS.schur),
    ]);
    const tableMap = new Map(
      document.tables.map((record) => [Number(record.degree), record]),
    );
    let degree = 2;
    clearTypeset(root);
    const output = node("div");
    root.append(
      segmented([1, 2, 3, 4, 5], degree, (value) => {
        degree = value;
        draw();
      }),
      output,
      rawLinks([["schur_functors.json", PATHS.schur]]),
    );

    function draw() {
      clearTypeset(output);
      const record = tableMap.get(degree);
      const built = table(
        ["Schur functor", "Specht dimension", "Decomposition"],
        "schur-table",
      );
      record.partitions.forEach((partition, index) => {
        const tr = node("tr");
        tr.append(
          rowHeader(math(`S_{${partitionTex(partition)}}(L)`)),
          node("td", "", String(record.specht_dimensions[index])),
        );
        const decomposition = {};
        record.column_labels.forEach((label, column) => {
          const coefficient = Number(record.matrix[index][column]);
          if (coefficient) decomposition[label] = coefficient;
        });
        const td = node("td");
        appendLinearCombination(td, decomposition, data);
        tr.append(td);
        built.body.append(tr);
      });
      output.append(built.wrapper);
      typeset(output);
    }

    draw();
  }

  async function renderOrthogonal(root) {
    const [data, document] = await Promise.all([
      context(),
      loadJson(PATHS.orthogonal),
    ]);
    const tableMap = new Map(
      document.tables.map((record) => [Number(record.degree), record]),
    );
    let degree = 2;
    clearTypeset(root);
    const output = node("div");
    root.append(
      segmented([1, 2, 3, 4, 5], degree, (value) => {
        degree = value;
        draw();
      }),
      output,
      rawLinks([["orthogonal_functors.json", PATHS.orthogonal]]),
    );

    function draw() {
      clearTypeset(output);
      const built = table(
        ["Orthogonal", "Schur", "Elementary", "Homogeneous", "Power sum", "On L"],
        "orthogonal-table",
      );
      for (const record of tableMap.get(degree).entries) {
        const tr = node("tr");
        tr.append(rowHeader(math(`o_{${partitionTex(record.partition)}}`)));
        const columns = [
          [record.in_schur_basis, "s"],
          [record.in_elementary_basis, "e"],
          [record.in_homogeneous_basis, "h"],
          [record.in_power_sum_basis, "p"],
        ];
        for (const [terms, basis] of columns) {
          const td = node("td");
          appendBasisExpression(td, terms, basis);
          tr.append(td);
        }
        const functor = node("td");
        appendLinearCombination(functor, record.functor_on_L, data);
        tr.append(functor);
        built.body.append(tr);
      }
      output.append(built.wrapper);
      typeset(output);
    }

    draw();
  }

  function selectControl(title, values) {
    const label = node("label", "", title);
    const select = node("select");
    for (const [value, text] of values) {
      const option = node("option", "", text);
      option.value = value;
      select.append(option);
    }
    label.append(select);
    return { label, select };
  }

  function matrixDetails(family, name, document, data) {
    const levelLabels = (level) =>
      data.byLevel.get(level).map((record) => record.label);
    if (family === "H") {
      const level = Number(name.slice(1));
      return {
        matrix: document.H[name].matrix,
        rows: levelLabels(level),
        columns: levelLabels(level + 1),
      };
    }
    if (family === "A") {
      const level = Number(name.slice(1));
      return {
        matrix: document.A[name],
        rows: levelLabels(level),
        columns: levelLabels(level),
      };
    }
    if (family === "X") {
      const record = document.X[name];
      return {
        matrix: record.matrix,
        rows: record.row_labels,
        columns: record.col_labels,
      };
    }
    const record = document[family][name];
    return {
      matrix: record.matrix,
      rows: record.labels,
      columns: record.labels,
    };
  }

  async function renderBranching(root) {
    const [data, document] = await Promise.all([
      context(),
      loadJson(PATHS.bratteli),
    ]);
    clearTypeset(root);
    const families = [
      ["H", "H matrices"],
      ["A", "A matrices"],
      ["X", "X branching matrices"],
      ["P_new", "P new-layer matrices"],
      ["P_cumulative", "P cumulative matrices"],
    ];
    const parameters = new URLSearchParams(location.search);
    const requestedFamily = parameters.get("family");
    const requestedMatrix = parameters.get("matrix");
    const familyControl = selectControl("Family", families);
    const matrixControl = selectControl("Matrix", []);
    const controls = node("div", "table-controls");
    controls.append(familyControl.label, matrixControl.label);
    const output = node("div");
    root.append(
      controls,
      output,
      rawLinks([["bratteli_matrices.json", PATHS.bratteli]]),
    );

    function populateMatrices(preferredName) {
      const family = familyControl.select.value;
      matrixControl.select.replaceChildren();
      const names = Object.keys(document[family]);
      for (const name of names) {
        const option = node("option", "", name.replaceAll("_", " "));
        option.value = name;
        matrixControl.select.append(option);
      }
      matrixControl.select.value = names.includes(preferredName)
        ? preferredName
        : names[names.length - 1];
      draw();
    }

    function draw() {
      const family = familyControl.select.value;
      const name = matrixControl.select.value;
      const details = matrixDetails(family, name, document, data);
      clearTypeset(output);
      output.append(
        node(
          "p",
          "matrix-meta",
          `${name.replaceAll("_", " ")}: ${details.matrix.length} x ${details.columns.length}`,
        ),
      );
      const built = table(["", ...details.columns], "matrix-table");
      built.wrapper.classList.add("matrix-scroll");
      const headerCells = built.table.querySelectorAll("thead th");
      details.columns.forEach((label, index) => {
        headerCells[index + 1].replaceChildren(labelNode(label, data));
      });
      details.matrix.forEach((values, rowIndex) => {
        const tr = node("tr");
        tr.append(rowHeader(labelNode(details.rows[rowIndex], data)));
        values.forEach((value) => {
          const td = node("td", Number(value) === 0 ? "matrix-zero" : "", String(value));
          tr.append(td);
        });
        built.body.append(tr);
      });
      output.append(built.wrapper);
    }

    familyControl.select.addEventListener("change", () => populateMatrices());
    matrixControl.select.addEventListener("change", draw);
    familyControl.select.value = families.some(
      ([value]) => value === requestedFamily,
    )
      ? requestedFamily
      : "H";
    populateMatrices(requestedMatrix);
  }

  const renderers = {
    labels: renderLabels,
    branching: renderBranching,
    products: renderProducts,
    "quantum-dimensions": renderQdims,
    schur: renderSchur,
    orthogonal: renderOrthogonal,
    characters: renderCharacters,
  };

  const root = document.querySelector("[data-exceptional-view]");
  if (!root) return;
  const view = root.dataset.exceptionalView;
  if (!renderers[view]) {
    root.textContent = `Unknown Exceptional-series view: ${view}`;
    return;
  }
  root.setAttribute("aria-busy", "true");
  renderers[view](root)
    .catch((error) => {
      clearTypeset(root);
      const message = node("p", "exceptional-status exceptional-error");
      message.textContent = `Unable to load this table: ${error.message}`;
      root.append(message);
    })
    .finally(() => root.setAttribute("aria-busy", "false"));
})();
