/* site.js — navigation helpers */

// ── Sidebar toggle (mobile) ───────────────────────────────

const menuToggle = document.getElementById("menu-toggle");
const sidebar    = document.querySelector(".sidebar");

if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove("open");
        }
    });
}

// ── Active link ───────────────────────────────────────────
// Marks the sidebar link whose resolved href matches the current page.

(function markActive() {
    const current = location.pathname.replace(/\/$/, "") || "/";

    document.querySelectorAll(".sidebar a").forEach((a) => {
        const href = a.getAttribute("href");
        if (!href) return;

        const resolved = new URL(href, location.href).pathname.replace(/\/$/, "");

        if (resolved === current) {
            a.classList.add("active");
        }
    });
})();
