/* =====================================================
   CALEA DE BAZĂ A SITE-ULUI

   GitHub Pages: /mmo
   Hostico:      rădăcina domeniului
===================================================== */

const SITE_BASE = window.location.hostname.endsWith("github.io")
  ? "/mmo"
  : "";

/* =====================================================
   ÎNCĂRCAREA COMPONENTELOR
===================================================== */

async function loadComponent(targetId, componentPath) {
  const target = document.getElementById(targetId);

  if (!target) {
    console.warn(`Lipsește elementul #${targetId}`);
    return;
  }

  try {
    const response = await fetch(`${SITE_BASE}/${componentPath}`);

    if (!response.ok) {
      throw new Error(
        `${componentPath} nu s-a încărcat. Cod HTTP: ${response.status}`,
      );
    }

    target.innerHTML = await response.text();
  } catch (error) {
    console.error(
      `Eroare la încărcarea componentei ${componentPath}:`,
      error,
    );
  }
}

/* =====================================================
   CORECTAREA LINKURILOR INTERNE PE GITHUB PAGES
===================================================== */

function correctInternalLinks(containerId) {
  if (!SITE_BASE) return;

  const container = document.getElementById(containerId);

  if (!container) return;

  container.querySelectorAll('a[href^="/"]').forEach((link) => {
    const href = link.getAttribute("href");

    if (!href || href.startsWith(`${SITE_BASE}/`)) {
      return;
    }

    link.setAttribute("href", `${SITE_BASE}${href}`);
  });
}

/* =====================================================
   PORNIRE
===================================================== */

async function loadLayout() {
  await loadComponent("site-header", "includes/header.html");
  await loadComponent("site-menu", "includes/menu.html");
  await loadComponent("site-footer", "includes/footer.html");

  correctInternalLinks("site-header");
  correctInternalLinks("site-menu");
  correctInternalLinks("site-footer");

  document.dispatchEvent(new CustomEvent("layoutLoaded"));
}

window.addEventListener("DOMContentLoaded", loadLayout);
