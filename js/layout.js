/* =====================================================
   CONFIGURAREA CĂII DE BAZĂ

   GitHub Pages:
   https://smelania55.github.io/mmo/

   Hostico:
   https://www.mieredemanuka.com/
===================================================== */

const SITE_BASE = window.location.hostname.endsWith("github.io")
  ? "/mmo"
  : "";

/* =====================================================
   ÎNCĂRCAREA COMPONENTELOR HTML
===================================================== */

async function loadComponent(targetId, componentPath) {
  const target = document.getElementById(targetId);

  if (!target) {
    console.warn(`Elementul #${targetId} nu există în această pagină.`);
    return;
  }

  try {
    const componentUrl = `${SITE_BASE}/${componentPath}`;

    const response = await fetch(componentUrl);

    if (!response.ok) {
      throw new Error(
        `Componenta ${componentPath} nu s-a încărcat. Cod HTTP: ${response.status}`,
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

   Exemplu:
   /categorie/mgo

   devine pe GitHub:
   /mmo/categorie/mgo

   Pe Hostico linkul rămâne:
   /categorie/mgo
===================================================== */

function correctInternalLinks(containerId) {
  if (!SITE_BASE) {
    return;
  }

  const container = document.getElementById(containerId);

  if (!container) {
    return;
  }

  container.querySelectorAll('a[href^="/"]').forEach((link) => {
    const href = link.getAttribute("href");

    if (!href) {
      return;
    }

    if (href === SITE_BASE || href.startsWith(`${SITE_BASE}/`)) {
      return;
    }

    link.setAttribute("href", `${SITE_BASE}${href}`);
  });
}

/* =====================================================
   ÎNCĂRCAREA HEADERULUI, MENIULUI ȘI FOOTERULUI
===================================================== */

async function loadLayout() {
  await loadComponent("site-header", "includes/header.html");
  await loadComponent("site-menu", "includes/menu.html");
  await loadComponent("site-footer", "includes/footer.html");

  correctInternalLinks("site-header");
  correctInternalLinks("site-menu");
  correctInternalLinks("site-footer");

  /*
   * Anunță app.js că headerul și câmpul de căutare
   * au fost încărcate în pagină.
   */
  document.dispatchEvent(new CustomEvent("layoutLoaded"));
}

/* =====================================================
   PORNIRE
===================================================== */

window.addEventListener("DOMContentLoaded", loadLayout);
