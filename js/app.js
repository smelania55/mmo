const PRODUCTS_SOURCE = "/produse_2performant.json?v=" + Date.now();

const BLOG_SOURCE = "/articole_blog.json?v=" + Date.now();

let allProducts = [];
let allArticles = [];
let currentView = "produse";

let dataLoaded = false;
let searchInitialized = false;

/* =====================================================
   FUNCȚII UTILE
===================================================== */

function createProductSlug(text) {
  if (typeof text !== "string") {
    return "";
  }

  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =====================================================
   ÎNCĂRCAREA PRODUSELOR ȘI ARTICOLELOR
===================================================== */

async function loadAllData() {
  try {
    const [productsResponse, blogResponse] = await Promise.all([
      fetch(PRODUCTS_SOURCE),
      fetch(BLOG_SOURCE),
    ]);

    if (!productsResponse.ok) {
      throw new Error(
        `Produsele nu au putut fi încărcate. Cod HTTP: ${productsResponse.status}`,
      );
    }

    if (!blogResponse.ok) {
      throw new Error(
        `Articolele nu au putut fi încărcate. Cod HTTP: ${blogResponse.status}`,
      );
    }

    allProducts = await productsResponse.json();
    allArticles = await blogResponse.json();

    if (!Array.isArray(allProducts)) {
      throw new Error(
        "Fișierul produse_2performant.json nu conține o listă validă.",
      );
    }

    if (!Array.isArray(allArticles)) {
      throw new Error("Fișierul articole_blog.json nu conține o listă validă.");
    }

    dataLoaded = true;

    displayGridContent();
    checkUrlForSearch();
  } catch (error) {
    console.error("Eroare la încărcarea datelor:", error);

    const grid = document.getElementById("productsGrid");

    if (grid) {
      grid.innerHTML = `
        <div class="loading">
          Catalogul nu a putut fi încărcat.
          Verifică fișierele JSON și consola browserului.
        </div>
      `;
    }
  }
}

/* =====================================================
   AFIȘAREA PRODUSELOR ȘI ARTICOLELOR
===================================================== */

function displayGridContent() {
  const grid = document.getElementById("productsGrid");

  const dynamicTitle = document.getElementById("sectionDynamicTitle");

  const searchInput = document.getElementById("searchInput");

  if (!grid) {
    return;
  }

  if (!dataLoaded) {
    grid.innerHTML = '<div class="loading">Se încarcă catalogul...</div>';

    return;
  }

  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";

  /* ===================================================
     ARTICOLE BLOG
  =================================================== */

  if (currentView === "blog") {
    if (dynamicTitle) {
      dynamicTitle.textContent = "Articole din blog";
    }

    const filteredArticles = allArticles.filter((article) => {
      const title =
        typeof article.title === "string" ? article.title.toLowerCase() : "";

      const excerpt =
        typeof article.excerpt === "string"
          ? article.excerpt.toLowerCase()
          : "";

      return title.includes(searchTerm) || excerpt.includes(searchTerm);
    });

    if (filteredArticles.length === 0) {
      grid.innerHTML = `
        <div class="loading">
          Niciun articol găsit.
        </div>
      `;

      return;
    }

    grid.innerHTML = filteredArticles
      .map((article) => {
        const articleTitle = article.title || "Articol";

        const articleSlug =
          typeof article.slug === "string"
            ? article.slug.trim().replace(/^\/+|\/+$/g, "")
            : "";

        if (!articleSlug) {
          console.warn("Articol fără slug valid:", articleTitle);

          return "";
        }

        const articleUrl = `/blog/${encodeURIComponent(articleSlug)}`;

        const articleImage =
          article.image || "/imagini/miere-de-manuka-proprietati.webp";

        const altText = article.alt || articleTitle;

        const titleText = article.titleImagine || articleTitle;

        const articleExcerpt = article.excerpt || "";

        return `
          <article class="product-card">

            <a
              href="${articleUrl}"
              aria-label="Citește articolul ${escapeHtml(articleTitle)}"
            >
              <img
                src="${escapeHtml(articleImage)}"
                alt="${escapeHtml(altText)}"
                title="${escapeHtml(titleText)}"
                class="product-image"
                style="object-fit: cover;"
                loading="lazy"
              >
            </a>

            <div class="product-info">

              <h2 class="product-title">
                <a
                  href="${articleUrl}"
                  style="
                    color: inherit;
                    text-decoration: none;
                  "
                >
                  ${escapeHtml(articleTitle)}
                </a>
              </h2>

              <p
                style="
                  font-size: 0.9rem;
                  color: #666;
                  margin-bottom: 15px;
                "
              >
                ${escapeHtml(articleExcerpt)}
              </p>

              <a
                href="${articleUrl}"
                class="affiliate-btn"
              >
                Citește articolul
              </a>

            </div>
          </article>
        `;
      })
      .join("");

    return;
  }

  /* ===================================================
     PRODUSE
  =================================================== */

  if (dynamicTitle) {
    dynamicTitle.textContent = "Catalog Produse";
  }

  const filteredProducts = allProducts.filter((product) => {
    const title =
      typeof product.title === "string" ? product.title.toLowerCase() : "";

    const description =
      typeof product.description === "string"
        ? product.description.toLowerCase()
        : "";

    return title.includes(searchTerm) || description.includes(searchTerm);
  });

  if (filteredProducts.length === 0) {
    grid.innerHTML = `
      <div class="loading">
        Niciun produs găsit.
      </div>
    `;

    return;
  }

  grid.innerHTML = filteredProducts
    .map((product) => {
      const productTitle = product.title || "Produs fără denumire";

      const productImage =
        product.image_urls ||
        product.image ||
        "/imagini/miere-de-manuka-proprietati.webp";

      const productSlug =
        typeof product.slug === "string" && product.slug.trim()
          ? product.slug.trim().replace(/^\/+|\/+$/g, "")
          : createProductSlug(productTitle);

      const productUrl = `/${encodeURIComponent(productSlug)}`;

      const altText = product.alt || productTitle;

      const titleText = product.titleImagine || productTitle;

      const productPrice =
        product.price !== undefined &&
        product.price !== null &&
        String(product.price).trim() !== ""
          ? `${product.price} RON`
          : "";

      return `
        <article class="product-card">

          <a
            href="${productUrl}"
            aria-label="Vezi produsul ${escapeHtml(productTitle)}"
          >
            <img
              src="${escapeHtml(productImage)}"
              alt="${escapeHtml(altText)}"
              title="${escapeHtml(titleText)}"
              class="product-image"
              loading="lazy"
            >
          </a>

          <div class="product-info">

            <h2 class="product-title">
              <a
                href="${productUrl}"
                style="
                  color: inherit;
                  text-decoration: none;
                "
              >
                ${escapeHtml(productTitle)}
              </a>
            </h2>

            ${
              productPrice
                ? `
                  <p class="product-price">
                    ${escapeHtml(productPrice)}
                  </p>
                `
                : ""
            }

            <a
              href="${productUrl}"
              class="affiliate-btn"
            >
              Detalii produs
            </a>

          </div>
        </article>
      `;
    })
    .join("");
}

/* =====================================================
   CĂUTAREA DIN HEADER
===================================================== */

function initializeSearch() {
  if (searchInitialized) {
    return;
  }

  const searchInput = document.getElementById("searchInput");

  const searchButton = document.getElementById("searchButton");

  if (!searchInput) {
    return;
  }

  searchInitialized = true;

  searchInput.addEventListener("input", () => {
    displayGridContent();
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    executeSearch();
  });

  if (searchButton) {
    searchButton.addEventListener("click", executeSearch);
  }

  checkUrlForSearch();
}

function executeSearch() {
  const searchInput = document.getElementById("searchInput");

  const gridSection = document.getElementById("blogSection");

  if (!searchInput) {
    return;
  }

  /*
   * Pe homepage filtrăm direct.
   */
  if (document.getElementById("productsGrid")) {
    currentView = "produse";

    updateViewButtons();
    displayGridContent();

    if (gridSection) {
      gridSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    return;
  }

  /*
   * Pe articol sau produs trimitem
   * utilizatorul pe homepage.
   */
  const searchValue = searchInput.value.trim();

  if (searchValue) {
    window.location.href = `/?search=${encodeURIComponent(searchValue)}`;
  }
}

/* =====================================================
   PARAMETRUL ?search= DIN URL
===================================================== */

function checkUrlForSearch() {
  const searchInput = document.getElementById("searchInput");

  if (!searchInput) {
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);

  const searchParam = urlParams.get("search");

  if (!searchParam) {
    return;
  }

  searchInput.value = searchParam;

  currentView = "produse";
  updateViewButtons();
  displayGridContent();

  const gridSection = document.getElementById("blogSection");

  if (gridSection) {
    setTimeout(() => {
      gridSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 250);
  }
}

/* =====================================================
   BUTOANE PRODUSE / BLOG
===================================================== */

const showProductsBtn = document.getElementById("showProductsBtn");

const showBlogBtn = document.getElementById("showBlogBtn");

function updateViewButtons() {
  if (showProductsBtn) {
    showProductsBtn.classList.toggle("active", currentView === "produse");
  }

  if (showBlogBtn) {
    showBlogBtn.classList.toggle("active", currentView === "blog");
  }
}

if (showProductsBtn) {
  showProductsBtn.addEventListener("click", () => {
    currentView = "produse";
    updateViewButtons();
    displayGridContent();
  });
}

if (showBlogBtn) {
  showBlogBtn.addEventListener("click", () => {
    currentView = "blog";
    updateViewButtons();
    displayGridContent();
  });
}

/* =====================================================
   BUTOANELE DIN HEADERUL VECHI
===================================================== */

document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", (event) => {
    const targetId = event.currentTarget.getAttribute("data-scroll");

    const targetSection = document.getElementById(targetId);

    if (!targetSection) {
      return;
    }

    if (targetId === "blogSection") {
      currentView = "blog";
      updateViewButtons();
      displayGridContent();
    }

    targetSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});

/* =====================================================
   PORNIRE
===================================================== */

window.addEventListener("DOMContentLoaded", () => {
  loadAllData();

  /*
   * Dacă header-ul este deja în pagină.
   */
  initializeSearch();
});

/*
 * Header-ul este încărcat dinamic
 * de layout.js.
 */
document.addEventListener("layoutLoaded", () => {
  initializeSearch();
});
