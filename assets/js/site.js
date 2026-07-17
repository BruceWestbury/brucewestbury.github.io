/*
 * site.js — shared navigation injection + UI helpers
 *
 * Directory layout this script assumes:
 *
 *   index.html                   (SITE_ROOT = ".")
 *   about.html                   (SITE_ROOT = ".")
 *   publications.html            (SITE_ROOT = ".")
 *   projects/f4/index.html       (SITE_ROOT = "../..")
 *   projects/f4/closed-graphs.html
 *   projects/f4/witnesses.html
 *   projects/e6/index.html       (SITE_ROOT = "../..")
 *   projects/e6/closed-graphs.html
 *   projects/e6/witnesses.html
 *
 * Each page sets window.SITE_ROOT before loading this script, e.g.:
 *
 *   Top-level :  <script>window.SITE_ROOT = ".";</script>
 *   Nested    :  <script>window.SITE_ROOT = "../..";</script>
 *
 * The two placeholder elements expected in every page's <body>:
 *
 *   <header id="site-header"></header>
 *   <nav    id="site-sidebar" class="sidebar"></nav>
 */

(function () {
  "use strict";

  const R = (window.SITE_ROOT || ".").replace(/\/$/, "");

  // ── Site map ──────────────────────────────────────────────
  // Single source of truth for all navigation links.

  const NAV_LINKS = [
    { label: "Publications", href: `${R}/publications.html` },
    { label: "About", href: `${R}/about.html` },
  ];

  const CHAPTERS = [
    {
      title: "F\u2084 Series", // F₄
      href: `${R}/projects/f4/index.html`,
      pages: [
        { label: "Introduction", href: `${R}/projects/f4/index.html` },
        { label: "Closed graphs", href: `${R}/projects/f4/closed-graphs.html` },
        { label: "Witnesses", href: `${R}/projects/f4/witnesses.html` },
      ],
    },
    {
      title: "E\u2086 Series", // E₆
      href: `${R}/projects/e6/index.html`,
      pages: [
        { label: "Introduction", href: `${R}/projects/e6/index.html` },
        { label: "Closed graphs", href: `${R}/projects/e6/closed-graphs.html` },
        { label: "Witnesses", href: `${R}/projects/e6/witnesses.html` },
      ],
    },
    {
      title: "Exceptional series",
      href: `${R}/projects/exceptional/index.html`,
      pages: [
        { label: "Introduction", href: `${R}/projects/exceptional/index.html` },
        { heading: "Generic structure" },
        { label: "Labels and Casimirs", href: `${R}/projects/exceptional/labels.html` },
        { label: "Branching matrices", href: `${R}/projects/exceptional/branching.html` },
        { label: "Products", href: `${R}/projects/exceptional/products.html` },
        { label: "Quantum dimensions", href: `${R}/projects/exceptional/quantum-dimensions.html` },
        { label: "Schur functors", href: `${R}/projects/exceptional/schur-functors.html` },
        { label: "Orthogonal functors", href: `${R}/projects/exceptional/orthogonal-functors.html` },
        { heading: "Characters" },
        { label: "Character tables", href: `${R}/projects/exceptional/characters.html` },
      ],
    },
  ];

  // ── Build <header> ────────────────────────────────────────

  function buildHeader() {
    const header = document.getElementById("site-header");
    if (!header) return;

    header.className = "topbar";
    header.innerHTML = `
            <img src="${R}/assets/images/magic_square_logo.svg"
                 class="logo" alt="Magic square" />
            <a class="site-title" href="${R}/index.html">Bruce Westbury</a>
            <nav>${NAV_LINKS.map(
              (l) => `<a href="${l.href}">${l.label}</a>`,
            ).join("\n            ")}</nav>
            <button class="menu-toggle" id="menu-toggle" aria-label="Toggle menu">&#9776;</button>
        `;
  }

  // ── Build <nav class="sidebar"> ───────────────────────────

  function buildSidebar() {
    const nav = document.getElementById("site-sidebar");
    if (!nav) return;

    const chaptersHTML = CHAPTERS.map(
      (ch) => `
            <div class="chapter">
                <a class="chapter-title" href="${ch.href}">${ch.title}</a>
                <ul>
                    ${(ch.pages || [])
                      .map((p) =>
                        p.heading
                          ? `<li class="sidebar-section">${p.heading}</li>`
                          : `<li><a href="${p.href}">${p.label}</a></li>`,
                      )
                      .join("\n                    ")}
                </ul>
            </div>`,
    ).join("\n");

    nav.innerHTML = `
            <div class="sidebar-heading">Contents</div>
            ${chaptersHTML}
        `;
  }

  // ── Mark active sidebar link ──────────────────────────────
  // Compares resolved hrefs against location.pathname.

  function markActive() {
    const current = location.pathname.replace(/\/$/, "") || "/";
    document.querySelectorAll("#site-sidebar a").forEach((a) => {
      const resolved = new URL(
        a.getAttribute("href"),
        location.href,
      ).pathname.replace(/\/$/, "");
      a.classList.toggle("active", resolved === current);
    });
  }

  // ── Sidebar toggle (mobile) ───────────────────────────────

  function bindToggle() {
    const btn = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("site-sidebar");
    if (!btn || !sidebar) return;

    btn.addEventListener("click", () => sidebar.classList.toggle("open"));

    document.addEventListener("click", (e) => {
      if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
        sidebar.classList.remove("open");
      }
    });
  }

  // ── Init ──────────────────────────────────────────────────

  buildHeader();
  buildSidebar();
  markActive();
  bindToggle();
})();

// ── MathJax re-typeset helper (used by catalogue pages) ──────
function retypeset() {
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise();
  }
}
